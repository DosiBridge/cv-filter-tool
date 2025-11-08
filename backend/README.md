# CV Filter Tool - Backend

FastAPI backend for CV filtering and matching against job requirements.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file:
```bash
cp .env.example .env
```

3. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

## Running

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `POST /api/upload` - Upload CVs and filter against requirements
- `GET /health` - Health check
- `GET /` - Root endpoint

## Documentation

API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

