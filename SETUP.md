# Quick Setup Guide

## Prerequisites
- Python 3.8+ installed
- Node.js 18+ installed
- OpenAI API key

## Quick Start

### 1. Backend Setup (Terminal 1)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env file
echo OPENAI_API_KEY=your_api_key_here > .env
echo OPENAI_MODEL=gpt-4o-mini >> .env

# Run backend
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Troubleshooting

### Backend Issues

1. **Module not found errors**: Make sure virtual environment is activated
2. **OpenAI API errors**: Check your API key in `.env` file
3. **Port already in use**: Change port in uvicorn command: `--port 8001`

### Frontend Issues

1. **npm install fails**: Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
2. **API connection errors**: Check that backend is running and `NEXT_PUBLIC_API_URL` is correct
3. **Build errors**: Make sure you're using Node.js 18+

## Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

### Frontend (.env.local) - Optional
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Notes

- Make sure both backend and frontend are running simultaneously
- The backend processes files temporarily and cleans them up after processing
- For production, configure CORS properly in `backend/app/main.py`

