# OnionIQ

OnionIQ is a multilingual onion quality assessment interface with a React/TypeScript frontend and a FastAPI image-analysis service.

## Run Locally

Start the API in one terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:AI_MODE = "demo"
python -m uvicorn app.main:app --reload --port 8000
```

Start the frontend in another terminal from the project root:

```powershell
npm install
npm run dev
```

The frontend defaults to `http://127.0.0.1:8000` for the API. Set `VITE_API_BASE_URL` in `.env.local` to use another API URL. Demo results are synthetic and visibly labeled; they are not AI predictions.

## Model Integration

No trained onion model is included. To use one, set `AI_MODE=model` and `ONION_MODEL_PROVIDER=your_package.module:create_provider`. The configured factory must return the provider described in [backend/README.md](backend/README.md). Model startup fails if the provider is missing or invalid; it never falls back to demo inference.

## Checks

```powershell
npm run build
python -m pip install -r backend/requirements-dev.txt
python -m pytest backend/tests -q
```