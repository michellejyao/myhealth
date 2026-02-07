# Medical Image Analysis API

Production-ready pipeline for **segmentation** and **abnormality detection** on MRI/medical images using **NVIDIA MONAI** and **PyTorch**.

## Features

- **Segmentation**: 2D UNet (MONAI) for tissue/lesion segmentation; supports optional pretrained weights.
- **Abnormality detection**: Findings derived from segmentation and intensity analysis; extensible for custom classifiers.
- **Endpoints**:
  - `GET /health` — Health check (reports CPU/CUDA).
  - `POST /analyze/url` — Analyze image from URL (JSON: `{ "image_url": "https://..." }`).
  - `POST /analyze` — Analyze uploaded file (multipart: `file` = image).

## Setup

```bash
cd medical-image-api
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

## Run

```bash
# Default: http://0.0.0.0:8000
python main.py
# Or with reload
set MEDICAL_IMAGE_API_RELOAD=1
python main.py
```

## Optional: Pretrained weights

Set `SEGMENTATION_WEIGHTS_PATH` to a `.pth` file (e.g. from [MONAI Model Zoo](https://github.com/Project-MONAI/model-zoo)) for better segmentation. Without it, a heuristic fallback is used so the API still returns valid segmentation and findings.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `MEDICAL_IMAGE_API_HOST` | `0.0.0.0` | Bind host |
| `MEDICAL_IMAGE_API_PORT` | `8000` | Port |
| `SEGMENTATION_WEIGHTS_PATH` | (none) | Path to .pth weights |
| `MEDICAL_IMAGE_DEVICE` | `cuda` if available | `cuda` or `cpu` |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Allowed frontend origins |
| `MAX_IMAGE_BYTES` | `50000000` | Max upload size (50 MB) |

## Docker (optional)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

Build and run:

```bash
docker build -t medical-image-api .
docker run -p 8000:8000 -e CORS_ORIGINS="http://localhost:5173" medical-image-api
```
