import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from backend.app.inference import ModelInferenceProvider, build_provider
from backend.app import main as api
from backend.app.main import app, build_response


def png_bytes(color=(160, 80, 30)):
    image = Image.new("RGB", (48, 32), color)
    output = io.BytesIO()
    image.save(output, format="PNG")
    return output.getvalue()


def test_upload_returns_consistent_demo_counts():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/assessments/analyze",
            files={"image": ("sample.png", png_bytes(), "image/png")},
        )

    assert response.status_code == 200
    result = response.json()
    assert result["mode"] == "demo"
    assert result["total"] == sum(result[key] for key in ("healthy", "damaged", "rotten", "sprouted", "undersized"))
    assert result["total"] == len(result["detections"])
    assert result["grade_a_percentage"] == round(result["healthy"] / result["total"] * 100)


def test_invalid_image_is_rejected_without_internal_error():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/assessments/analyze",
            files={"image": ("bad.png", b"not an image", "image/png")},
        )

    assert response.status_code == 400
    assert response.json() == {"detail": "Image could not be read"}


def test_unsupported_media_type_is_rejected():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/assessments/analyze",
            files={"image": ("sample.gif", b"GIF89a", "image/gif")},
        )

    assert response.status_code == 415


def test_response_metrics_are_derived_from_detection_counts():
    result = build_response([], "model")
    assert result.total == 0
    assert result.grade_a_percentage == 0
    assert result.urs_percentage == 0
    assert result.quality_score == 0


def test_model_provider_rejects_bad_bbox():
    class BadProvider:
        def predict(self, image):
            return [{"category": "healthy", "confidence": 0.9, "bbox": [0.8, 0.8, 0.4, 0.4]}]

    provider = ModelInferenceProvider(BadProvider())
    with pytest.raises(ValueError):
        provider.predict(Image.new("RGB", (16, 16)))


def test_upload_size_limit_is_enforced(monkeypatch):
    monkeypatch.setattr(api, "MAX_IMAGE_BYTES", 32)
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/assessments/analyze",
            files={"image": ("sample.png", png_bytes(), "image/png")},
        )

    assert response.status_code == 413
    assert response.json() == {"detail": "Image is too large"}


def test_inference_timeout_has_safe_error(monkeypatch):
    class SlowProvider:
        mode = "model"

        def predict(self, image):
            import time
            time.sleep(0.1)
            return []

    monkeypatch.setattr(api, "ANALYSIS_TIMEOUT_SECONDS", 0.001)
    with TestClient(app) as client:
        app.state.provider = SlowProvider()
        response = client.post(
            "/api/v1/assessments/analyze",
            files={"image": ("sample.png", png_bytes(), "image/png")},
        )

    assert response.status_code == 504
    assert response.json() == {"detail": "Analysis took too long"}


def test_model_exception_does_not_expose_details():
    class FailingProvider:
        mode = "model"

        def predict(self, image):
            raise RuntimeError("private model weights failed to load")

    with TestClient(app) as client:
        app.state.provider = FailingProvider()
        response = client.post(
            "/api/v1/assessments/analyze",
            files={"image": ("sample.png", png_bytes(), "image/png")},
        )

    assert response.status_code == 500
    assert response.json() == {"detail": "Analysis could not be completed"}


def test_response_caps_detection_details_without_changing_counts():
    from backend.app.inference import Detection

    detections = [Detection("healthy", 0.9, 0.1, 0.1, 0.1, 0.1) for _ in range(510)]
    response = build_response(detections, "model")
    assert response.total == 510
    assert response.healthy == 510
    assert len(response.detections) == 500


def test_model_mode_requires_a_real_provider(monkeypatch):
    monkeypatch.setenv("AI_MODE", "model")
    monkeypatch.delenv("ONION_MODEL_PROVIDER", raising=False)
    with pytest.raises(RuntimeError, match="ONION_MODEL_PROVIDER"):
        build_provider()