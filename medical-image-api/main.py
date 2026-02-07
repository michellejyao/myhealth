"""
Production-ready Medical Image Analysis API.
Uses MONAI + PyTorch for segmentation and abnormality detection on MRI/medical images.
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

import config
from analysis.pipeline import run_analysis

logging.basicConfig(level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO))
logger = logging.getLogger(__name__)


class AnalyzeByUrlRequest(BaseModel):
    """Request body when submitting an image URL."""
    image_url: HttpUrl


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: preload model if weights path is set."""
    if config.SEGMENTATION_WEIGHTS_PATH:
        try:
            from analysis import segmenter
            segmenter.load_segmentation_model(
                config.SEGMENTATION_WEIGHTS_PATH,
                out_channels=len(config.DEFAULT_SEGMENTATION_LABELS),
            )
        except Exception as e:
            logger.warning("Could not preload segmentation model: %s", e)
    yield
    try:
        from analysis import segmenter
        segmenter._segmentation_model_cache = None
    except Exception:
        pass


app = FastAPI(
    title="Medical Image Analysis API",
    description="MONAI + PyTorch segmentation and abnormality detection for MRI/medical images",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Health check for load balancers and frontend."""
    import torch
    return {
        "status": "ok",
        "device": str(torch.device("cuda" if torch.cuda.is_available() else "cpu")),
    }


@app.post("/analyze")
async def analyze(
    file: UploadFile | None = File(None),
):
    """
    Run medical image analysis (segmentation + abnormality detection).
    Send multipart/form-data with field "file" = image file.
    """
    if file is None:
        raise HTTPException(400, "Provide multipart field 'file' with an image")

    try:
        data = await file.read()
        if len(data) > config.MAX_IMAGE_BYTES:
            raise HTTPException(413, "Image too large")
        result = run_analysis(
            image_bytes=data,
            weights_path=config.SEGMENTATION_WEIGHTS_PATH or None,
            input_size=config.SEGMENTATION_INPUT_SIZE,
            segmentation_labels=config.DEFAULT_SEGMENTATION_LABELS,
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.exception("Analysis failed")
        raise HTTPException(500, f"Analysis failed: {str(e)}")


@app.post("/analyze/url")
async def analyze_by_url(body: AnalyzeByUrlRequest):
    """Run analysis on an image fetched from URL (e.g. Supabase public URL)."""
    try:
        result = run_analysis(
            image_url=str(body.image_url),
            weights_path=config.SEGMENTATION_WEIGHTS_PATH or None,
            input_size=config.SEGMENTATION_INPUT_SIZE,
            segmentation_labels=config.DEFAULT_SEGMENTATION_LABELS,
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.exception("Analysis failed")
        raise HTTPException(500, f"Analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=os.getenv("MEDICAL_IMAGE_API_RELOAD", "0") == "1",
    )
