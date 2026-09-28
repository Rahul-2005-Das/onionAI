# OnionIQ API

Run the API from this directory with `python -m venv .venv`, activate the environment, install `python -m pip install -r requirements.txt`, set the environment variables, then run `python -m uvicorn app.main:app --reload --port 8000`.

Use `.env.example` as a reference when setting the variables in the shell; Python does not automatically load that file. The default `AI_MODE=demo` uses image-content-seeded synthetic detections. The response includes `mode: "demo"`; this output is not a real quality prediction and the frontend labels it as a demonstration.

For a trained model, set `AI_MODE=model` and `ONION_MODEL_PROVIDER=your_package.module:create_provider`. The factory must return an object with `predict(image)` where `image` is a Pillow RGB image and the method returns a list of detections. Each detection is a mapping with `category` (`healthy`, `damaged`, `rotten`, `sprouted`, or `undersized`), `confidence` from 0 to 1, and normalized `bbox: [x, y, width, height]`. Model mode never falls back to demo mode; provider configuration problems prevent startup.

Set `VITE_API_BASE_URL=http://127.0.0.1:8000` for the frontend. The endpoint is `POST /api/v1/assessments/analyze` with multipart field `image`. `/health` reports service mode.

## Quality Calculation

`app/calculation_engine.py` is the pure calculation engine. It accepts `total` and the five category counts, validates whole non-negative values, rejects category sums above `total`, reports any remainder as `unclassified_count`, and returns category percentages, Grade A/Grade B/URS percentages, quality score, final grade, and storage verdict. `POST /api/v1/assessments/calculate` exposes the same engine for human-review count edits; omitted category counts default to zero.

Thresholds and score weights live in `app/grading_rules.py`. `DEFAULT_GRADING_RULES` is tagged `draft-1` with `is_official=false`; these are provisional examples, not official agricultural or SIH criteria. Confirm and replace them with the SIH/domain owner before treating grades or storage verdicts as standards. The API returns rule provenance, and the frontend displays a draft-rules notice. Category percentages use deterministic largest-remainder rounding and sum to exactly 100% when the total is nonzero.

Image uploads are limited by `MAX_IMAGE_BYTES` (10 MiB by default), decoded formats are restricted to JPEG/PNG/WebP, dimensions are capped by `MAX_IMAGE_PIXELS`, and inference is bounded by `ANALYSIS_TIMEOUT_SECONDS`. API errors are returned as generic messages; internal provider details are logged server-side only.

Run API tests from the workspace root after `python -m pip install -r backend/requirements-dev.txt` with `python -m pytest backend/tests -q`.