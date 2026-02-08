"""
MONAI-based 2D segmentation for MRI slices.
Uses UNet for tissue/lesion segmentation; supports optional pretrained weights.
"""
import logging
from pathlib import Path

import numpy as np
import torch

logger = logging.getLogger(__name__)


def _resize_2d(img: np.ndarray, target_h: int, target_w: int, mode: str = "bilinear") -> np.ndarray:
    """Resize 2D array to (target_h, target_w) without MONAI to avoid layout/size errors. img: (H, W)."""
    from scipy.ndimage import zoom
    h, w = img.shape[:2]
    if (h, w) == (target_h, target_w):
        return img
    zoom_factors = (target_h / h, target_w / w)
    out = zoom(img, zoom_factors, order=1 if mode == "bilinear" else 0, mode="nearest")
    return out.astype(img.dtype)


# Lazy MONAI import so API starts even if MONAI not installed in dev
def _monai_imports():
    import monai
    from monai.networks.nets import UNet
    from monai.transforms import EnsureChannelFirst, Resize, ScaleIntensity, ToTensor
    return UNet, EnsureChannelFirst, Resize, ScaleIntensity, ToTensor


def _get_device():
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


# Module-level cache for (model, device)
_segmentation_model_cache = None


def load_segmentation_model(weights_path: str | None, in_channels: int = 1, out_channels: int = 3):
    """Build 2D UNet and optionally load weights. Returns model on correct device and caches it."""
    global _segmentation_model_cache
    UNet, _, _, _, _ = _monai_imports()
    device = _get_device()
    # 2D UNet: spatial_dims=2, channels for MRI single channel
    model = UNet(
        spatial_dims=2,
        in_channels=in_channels,
        out_channels=out_channels,
        channels=(32, 64, 128, 256),
        strides=(2, 2, 2),
        num_res_units=2,
    ).to(device)
    model.eval()
    if weights_path and Path(weights_path).exists():
        try:
            state = torch.load(weights_path, map_location=device)
            model.load_state_dict(state.get("model", state), strict=False)
            logger.info("Loaded segmentation weights from %s", weights_path)
        except Exception as e:
            logger.warning("Could not load weights from %s: %s", weights_path, e)
    else:
        logger.info("No segmentation weights; using untrained model (heuristic fallback will be used)")
    _segmentation_model_cache = (model, device)
    return model, device


def segment_slice(image: np.ndarray, model_and_device=None, input_size=(256, 256), labels=None):
    """
    Run 2D segmentation on a single slice.
    image: numpy array (H, W) or (H, W, C), float or uint8. Extra channels are reduced to grayscale.
    Returns: (mask numpy (H,W) int, labels list).
    """
    if labels is None:
        labels = ["background", "normal_tissue", "lesion"]
    # Force 2D: MONAI Resize expects spatial_dims=2 (H, W), not (H, W, C)
    if image.ndim == 3:
        image = np.asarray(image).astype(np.float32).mean(axis=-1)
    elif image.ndim != 2:
        image = np.squeeze(image)
        if image.ndim != 2:
            raise ValueError(f"Expected 2D image (H, W), got ndim={image.ndim} shape={image.shape}")
    orig_shape = image.shape[:2]
    # Normalize to [0,1] and ensure float32
    if image.dtype == np.uint8 or image.max() > 1.0:
        img = image.astype(np.float32) / max(float(image.max()), 1e-6)
    else:
        img = image.astype(np.float32).copy()
    # Resize with scipy to avoid MONAI Resize layout issues (it can interpret (1,1,H,W) as 3 spatial dims)
    target_h, target_w = input_size
    if (img.shape[0], img.shape[1]) != input_size:
        img = _resize_2d(img, target_h, target_w, mode="bilinear")
    # (H, W) -> (1, 1, H, W) for model
    img = img[np.newaxis, np.newaxis, ...].astype(np.float32)
    tensor = torch.from_numpy(img).float()
    if model_and_device is not None:
        model, device = model_and_device
        with torch.no_grad():
            tensor = tensor.to(device)
            logits = model(tensor)
            pred = logits.argmax(dim=1).cpu().numpy()[0]  # H, W
        # Resize pred back to original if needed (use scipy to avoid MONAI spatial dim mismatch)
        if pred.shape != orig_shape:
            pred = _resize_2d(pred.astype(np.float32), orig_shape[0], orig_shape[1], mode="nearest").astype(np.int32)
        return pred, labels
    # Heuristic fallback: simple threshold to simulate tissue vs background
    h, w = int(tensor.shape[2]), int(tensor.shape[3])
    arr = tensor[0, 0].numpy()
    thresh = float(np.percentile(arr, 50))
    mask = np.zeros((h, w), dtype=np.int32)
    mask[arr > thresh] = 1
    # Optional: high-intensity regions as "lesion"
    high = np.percentile(arr, 95)
    mask[arr >= high] = 2
    if (h, w) != orig_shape:
        mask = _resize_2d(mask.astype(np.float32), orig_shape[0], orig_shape[1], mode="nearest").astype(np.int32)
    return mask, labels
