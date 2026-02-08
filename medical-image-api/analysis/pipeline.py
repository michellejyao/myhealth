"""
Orchestrates loading image, running segmentation and abnormality detection, and returning results.
"""
import base64
import io
import logging
from typing import Any

import numpy as np
from PIL import Image

from . import abnormality
from . import segmenter

logger = logging.getLogger(__name__)

# Module-level model cache
_segmentation_model_cache = None


def _load_image_from_bytes(data: bytes) -> np.ndarray:
    """Decode image bytes to grayscale numpy (H, W) float [0,1]. Always returns 2D."""
    pil = Image.open(io.BytesIO(data))
    if pil.mode != "L":
        pil = pil.convert("L")
    arr = np.asarray(pil, dtype=np.float32) / 255.0
    if arr.ndim == 3:
        arr = arr.mean(axis=-1)
    return arr


def _load_image_from_url(url: str) -> np.ndarray:
    """Fetch image from URL and return as numpy."""
    import httpx
    with httpx.Client(timeout=30.0) as client:
        r = client.get(url)
        r.raise_for_status()
        return _load_image_from_bytes(r.content)


def _mask_to_png_b64(mask: np.ndarray, labels: list[str]) -> str:
    """Encode segmentation mask as PNG (indexed by class) and return base64."""
    from PIL import Image
    # Scale to 0-255 for visibility (optional: use colormap per class)
    h, w = mask.shape
    out = np.zeros((h, w, 3), dtype=np.uint8)
    colors = [
        (0, 0, 0),       # background
        (70, 130, 180),  # normal tissue - steel blue
        (255, 99, 71),   # lesion - tomato
    ]
    for i in range(min(len(colors), int(mask.max()) + 1)):
        out[mask == i] = colors[i]
    pil = Image.fromarray(out)
    buf = io.BytesIO()
    pil.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def run_analysis(
    image_bytes: bytes | None = None,
    image_url: str | None = None,
    weights_path: str | None = None,
    input_size: tuple[int, int] = (256, 256),
    segmentation_labels: list[str] | None = None,
) -> dict[str, Any]:
    """
    Run full pipeline: load image -> segment -> detect abnormalities -> return payload.
    Either image_bytes or image_url must be provided.
    """
    if image_bytes is None and not image_url:
        raise ValueError("Provide either image_bytes or image_url")
    if image_bytes is not None and image_url:
        raise ValueError("Provide only one of image_bytes or image_url")

    if segmentation_labels is None:
        segmentation_labels = ["background", "normal_tissue", "lesion"]

    if image_bytes is not None:
        image = _load_image_from_bytes(image_bytes)
    else:
        image = _load_image_from_url(image_url)

    # Ensure 2D (H, W) for MONAI 2D pipeline
    if image.ndim == 3:
        image = image.mean(axis=-1)
    elif image.ndim != 2:
        image = np.squeeze(image)
    if image.ndim != 2:
        raise ValueError(f"Image must be 2D (H, W), got shape {image.shape}")
    image_uint8 = (np.clip(image, 0, 1) * 255).astype(np.uint8)
    image_for_seg = image

    if weights_path and segmenter._segmentation_model_cache is None:
        segmenter.load_segmentation_model(weights_path, out_channels=len(segmentation_labels))
    model_and_device = segmenter._segmentation_model_cache

    mask, labels = segmenter.segment_slice(
        image_for_seg,
        model_and_device=model_and_device,
        input_size=input_size,
        labels=segmentation_labels,
    )

    findings = abnormality.detect_abnormalities(image_uint8, mask, labels)

    segmentation_b64 = _mask_to_png_b64(mask, labels)
    return {
        "segmentation_mask_b64": segmentation_b64,
        "segmentation_labels": labels,
        "findings": findings,
        "meta": {
            "input_shape": list(image.shape),
            "mask_shape": list(mask.shape),
            "num_findings": len(findings),
        },
    }
