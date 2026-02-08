# Medical Image Analysis Pipeline

The **Analyze Medical Image** button on the log detail page runs a production-ready pipeline using **NVIDIA MONAI** and **PyTorch** for:

- **Segmentation**: 2D UNet on MRI/medical images (tissue and lesion regions).
- **Abnormality detection**: Findings derived from segmentation and intensity; results returned to the frontend for visualization.

## Architecture

1. **Frontend** (React): Log detail page → "Analyze Medical Image" opens a modal. User selects an image (from the log or uploads one). The app calls the Medical Image API and then saves results to Supabase.
2. **Medical Image API** (Python, FastAPI): `medical-image-api/` — MONAI + PyTorch. Endpoints:
   - `POST /analyze/url` — analyze image from URL (e.g. Supabase public attachment URL).
   - `POST /analyze` — analyze uploaded file.
3. **Database**: `medical_image_analyses` table stores segmentation reference and findings per attachment. Segmentation mask can be stored in Supabase Storage.

## Setup

### 1. Run the Medical Image API (Python)

```bash
cd medical-image-api
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
python main.py
```

API runs at `http://localhost:8000` by default. See `medical-image-api/README.md` for options and optional pretrained weights.

### 2. Frontend environment

In `.env.local` (project root), add:

```env
VITE_MEDICAL_IMAGE_API_URL=http://localhost:8000
```

If unset, the frontend defaults to `http://localhost:8000`.

### 3. Database

Apply the migration that creates `medical_image_analyses`:

```bash
supabase db push
# or apply supabase/migrations/007_medical_image_analyses.sql manually
```

## Flow

1. User opens a log → clicks **Analyze Medical Image**.
2. User selects an existing image or uploads one.
3. Frontend calls `POST /analyze/url` with the image URL (or `POST /analyze` with file).
4. API runs MONAI segmentation and abnormality detection, returns `segmentation_mask_b64`, `findings`, etc.
5. Frontend saves the result to `medical_image_analyses` (and optionally uploads the mask to storage).
6. Modal shows the original image with segmentation overlay and a list of findings.

## Optional: Pretrained weights

For better segmentation, set `SEGMENTATION_WEIGHTS_PATH` in the API environment to a `.pth` file (e.g. from [MONAI Model Zoo](https://github.com/Project-MONAI/model-zoo)). Without it, the API uses a heuristic fallback so it still returns valid structure for integration and testing.
