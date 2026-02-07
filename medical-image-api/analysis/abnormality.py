"""
Abnormality detection from segmentation and image statistics.
Produces a list of findings (label, confidence, region) for the frontend.
"""
import logging
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


def detect_abnormalities(
    image: np.ndarray,
    segmentation_mask: np.ndarray,
    segmentation_labels: list[str],
) -> list[dict[str, Any]]:
    """
    Derive abnormality findings from segmentation and intensity.
    For production, replace or augment with a dedicated classifier (e.g. MONAI classification model).
    """
    findings = []
    # Lesion class is typically last or named "lesion"
    lesion_label = "lesion"
    lesion_idx = next((i for i, L in enumerate(segmentation_labels) if "lesion" in L.lower() or L == "tumor"), None)
    if lesion_idx is None and len(segmentation_labels) > 1:
        lesion_idx = len(segmentation_labels) - 1

    if lesion_idx is not None:
        lesion_mask = (segmentation_mask == lesion_idx)
        if np.any(lesion_mask):
            area = np.sum(lesion_mask)
            total = segmentation_mask.size
            ratio = area / max(total, 1)
            # Confidence based on relative area (small regions often noise; medium more likely real)
            confidence = min(0.99, 0.5 + 0.4 * min(ratio * 20, 1.0))
            findings.append({
                "label": "Potential lesion / abnormal tissue",
                "confidence": round(float(confidence), 2),
                "region": "segmented_region",
                "description": f"Segmentation identified {segmentation_labels[lesion_idx]} (relative area {ratio:.2%}). Clinical correlation recommended.",
            })

    # Intensity-based: very bright spots sometimes indicate pathology
    if image.size > 0:
        img_flat = np.asarray(image).astype(np.float32).ravel()
        high = np.percentile(img_flat, 99.5)
        mean = np.mean(img_flat)
        if high > mean * 2.0 and mean > 0:
            findings.append({
                "label": "High-intensity region detected",
                "confidence": 0.65,
                "region": "intensity_analysis",
                "description": "Image contains high-intensity regions. Consider review for calcification or other bright findings.",
            })

    return findings
