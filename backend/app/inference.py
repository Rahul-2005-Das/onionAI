from __future__ import annotations

import hashlib
import importlib
import math
import os
from dataclasses import dataclass
from typing import Any, Literal, Protocol

from PIL import Image

Category = Literal["healthy", "damaged", "rotten", "sprouted", "undersized"]


@dataclass(frozen=True)
class Detection:
    category: Category
    confidence: float
    x: float
    y: float
    width: float
    height: float


class InferenceProvider(Protocol):
    mode: Literal["demo", "model"]

    def predict(self, image: Image.Image) -> list[Detection]: ...


class DemoInferenceProvider:
    """Synthetic, content-seeded samples for demonstrations; never a real prediction."""

    mode: Literal["demo"] = "demo"
    _categories: tuple[Category, ...] = (
        "healthy",
        "damaged",
        "rotten",
        "sprouted",
        "undersized",
    )

    def predict(self, image: Image.Image) -> list[Detection]:
        thumbnail = image.copy()
        thumbnail.thumbnail((64, 64))
        digest = hashlib.sha256(thumbnail.tobytes()).digest()
        count = 12 + digest[0] % 25
        detections: list[Detection] = []

        for index in range(count):
            value = digest[(index + 1) % len(digest)]
            category: Category = self._categories[value % len(self._categories)]
            x = ((digest[(index + 7) % len(digest)] / 255) * 0.88) + 0.06
            y = ((digest[(index + 13) % len(digest)] / 255) * 0.88) + 0.06
            detections.append(
                Detection(
                    category=category,
                    confidence=0.5 + (digest[(index + 19) % len(digest)] / 510),
                    x=x,
                    y=y,
                    width=0.04,
                    height=0.04,
                )
            )

        return detections


class ModelInferenceProvider:
    """Adapter for a project-local trained model plugin."""

    mode: Literal["model"] = "model"

    def __init__(self, plugin: Any) -> None:
        if not callable(getattr(plugin, "predict", None)):
            raise RuntimeError("Configured model provider must implement predict(image)")
        self._plugin = plugin

    def predict(self, image: Image.Image) -> list[Detection]:
        raw_detections = self._plugin.predict(image)
        if not isinstance(raw_detections, list):
            raise ValueError("Model provider must return a list of detections")

        detections: list[Detection] = []
        for raw in raw_detections:
            if isinstance(raw, Detection):
                detection = raw
            elif isinstance(raw, dict):
                bbox = raw.get("bbox")
                if not isinstance(bbox, (list, tuple)) or len(bbox) != 4:
                    raise ValueError("Model detection bbox must be [x, y, width, height]")
                detection = Detection(
                    category=raw.get("category"),
                    confidence=float(raw.get("confidence")),
                    x=float(bbox[0]),
                    y=float(bbox[1]),
                    width=float(bbox[2]),
                    height=float(bbox[3]),
                )
            else:
                raise ValueError("Model provider returned an unsupported detection")

            if detection.category not in self._categories:
                raise ValueError("Model provider returned an unknown category")
            values = (
                detection.confidence,
                detection.x,
                detection.y,
                detection.width,
                detection.height,
            )
            if not all(math.isfinite(value) for value in values):
                raise ValueError("Model provider returned a non-finite value")
            if not 0 <= detection.confidence <= 1:
                raise ValueError("Model confidence must be between 0 and 1")
            if not (
                0 <= detection.x <= 1
                and 0 <= detection.y <= 1
                and 0 <= detection.width <= 1
                and 0 <= detection.height <= 1
                and detection.x + detection.width <= 1
                and detection.y + detection.height <= 1
            ):
                raise ValueError("Model bbox coordinates must be normalized to the image")
            detections.append(detection)
        return detections

    _categories = DemoInferenceProvider._categories


def build_provider() -> InferenceProvider:
    mode = os.getenv("AI_MODE", "demo").strip().lower()
    if mode == "demo":
        return DemoInferenceProvider()
    if mode != "model":
        raise RuntimeError("AI_MODE must be either 'demo' or 'model'")

    provider_path = os.getenv("ONION_MODEL_PROVIDER", "").strip()
    if not provider_path or ":" not in provider_path:
        raise RuntimeError("ONION_MODEL_PROVIDER must be set as 'module:factory' in model mode")

    module_name, factory_name = provider_path.split(":", maxsplit=1)
    module = importlib.import_module(module_name)
    factory = getattr(module, factory_name)
    plugin = factory()
    return ModelInferenceProvider(plugin)