from __future__ import annotations

import asyncio
import io
import logging
import os
import warnings
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from .calculation_engine import calculate_onion_quality
from .inference import Category, Detection, build_provider
from .schemas import AnalysisResponse, CalculationInput, CalculationResponse

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("onioniq.api")

MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(10 * 1024 * 1024)))
MAX_IMAGE_PIXELS = int(os.getenv("MAX_IMAGE_PIXELS", "20000000"))
ANALYSIS_TIMEOUT_SECONDS = float(os.getenv("ANALYSIS_TIMEOUT_SECONDS", "35"))
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
CATEGORY_NAMES: tuple[Category, ...] = (
    "healthy",
    "damaged",
    "rotten",
    "sprouted",
    "undersized",
)
Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.provider = build_provider()
    except Exception as exc:
        logger.exception("Could not configure onion inference provider")
        raise RuntimeError("Onion inference provider configuration failed") from exc
    if app.state.provider.mode == "demo":
        logger.warning("AI_MODE=demo: synthetic sample results are enabled; no trained model is used")
    else:
        logger.info("AI_MODE=model: trained-model provider is enabled")
    yield


app = FastAPI(title="OnionIQ Quality API", version="1.0.0", lifespan=lifespan)
origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


async def read_image_file(upload: UploadFile) -> Image.Image:
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    contents = bytearray()
    while chunk := await upload.read(1024 * 1024):
        contents.extend(chunk)
        if len(contents) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Image is too large")

    if not contents:
        raise HTTPException(status_code=400, detail="Image is empty")

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(contents)) as source:
                if source.format not in {"JPEG", "PNG", "WEBP"}:
                    raise HTTPException(status_code=415, detail="Unsupported image type")
                source.verify()
            with Image.open(io.BytesIO(contents)) as source:
                source.load()
                return source.convert("RGB")
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, Image.DecompressionBombWarning) as exc:
        raise HTTPException(status_code=400, detail="Image could not be read") from exc


def build_response(detections: list[Detection], mode: str) -> AnalysisResponse:
    counts = {category: 0 for category in CATEGORY_NAMES}
    serialized_detections = []
    for detection in detections:
        counts[detection.category] += 1
        if len(serialized_detections) < 500:
            serialized_detections.append(
                {
                    "category": detection.category,
                    "confidence": round(detection.confidence, 4),
                    "bbox": [
                        round(detection.x, 6),
                        round(detection.y, 6),
                        round(detection.width, 6),
                        round(detection.height, 6),
                    ],
                }
            )

    total = sum(counts.values())
    metrics = calculate_onion_quality(total=total, **counts)
    return AnalysisResponse(
        **metrics,
        detections=serialized_detections,
        mode=mode,
    )


@app.get("/health")
async def health(request: Request) -> dict[str, str]:
    return {"status": "ok", "mode": request.app.state.provider.mode}


@app.post("/api/v1/assessments/calculate", response_model=CalculationResponse)
async def calculate_assessment(payload: CalculationInput) -> CalculationResponse:
    return CalculationResponse(**calculate_onion_quality(**payload.model_dump()))


@app.post("/api/v1/assessments/analyze", response_model=AnalysisResponse)
async def analyze_onion_sample(
    request: Request,
    image: Annotated[UploadFile, File(description="Onion sample image")],
) -> AnalysisResponse:
    try:
        image_data = await read_image_file(image)
        try:
            detections = await asyncio.wait_for(
                asyncio.to_thread(request.app.state.provider.predict, image_data),
                timeout=ANALYSIS_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError as exc:
            logger.warning("Onion inference timed out after %.1f seconds", ANALYSIS_TIMEOUT_SECONDS)
            raise HTTPException(status_code=504, detail="Analysis took too long") from exc
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Onion inference failed")
            raise HTTPException(status_code=500, detail="Analysis could not be completed") from exc
    finally:
        await image.close()

    return build_response(detections, request.app.state.provider.mode)