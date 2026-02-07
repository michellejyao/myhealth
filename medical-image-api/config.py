"""Configuration for the medical image analysis API."""
import os
from pathlib import Path

# API
API_HOST = os.getenv("MEDICAL_IMAGE_API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("MEDICAL_IMAGE_API_PORT", "8000"))

# Model: path to segmentation weights (optional). If not set, uses heuristic segmentation.
SEGMENTATION_WEIGHTS_PATH = os.getenv("SEGMENTATION_WEIGHTS_PATH", "")
# Device
DEVICE = os.getenv("MEDICAL_IMAGE_DEVICE", "cuda" if __import__("torch").cuda.is_available() else "cpu")

# Input size expected by the segmentation model (H, W)
SEGMENTATION_INPUT_SIZE = (256, 256)

# Segmentation class labels (match your trained model or use defaults for brain MRI)
DEFAULT_SEGMENTATION_LABELS = ["background", "normal_tissue", "lesion"]

# CORS: allow frontend origin
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

# Max image size (bytes) and dimension (pixels)
MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", "50_000_000"))  # 50 MB
MAX_IMAGE_DIM = int(os.getenv("MAX_IMAGE_DIM", "2048"))

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
