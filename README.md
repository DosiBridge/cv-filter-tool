# CV Filter Tool

A professional full-stack application for filtering and matching CVs against job requirements using AI-powered analysis.

## Features

- 📄 **Multi-format Support**: Upload CVs in PDF or DOCX formats
- 🤖 **AI-Powered Matching**: Uses OpenAI GPT models to analyze CVs against job requirements
- 📊 **Detailed Analysis**: Provides match percentages for skills, experience, education, and overall match
- 🎯 **Smart Sorting**: Automatically sorts CVs by match percentage
- 🔄 **Manual Reordering**: Drag and drop or use buttons to reorder CVs
- 💡 **Strengths & Weaknesses**: Get detailed insights about each candidate
- 🎨 **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- ⚡ **Fast Processing**: Efficient backend with FastAPI for quick CV processing

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **OpenAI API**: LLM integration for CV analysis
- **PyPDF2**: PDF text extraction
- **python-docx**: Word document text extraction
- **Uvicorn**: ASGI server

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS 3.4**: Utility-first CSS framework (v4 in alpha, using stable v3.4)
- **Lucide React**: Beautiful icons

## Project Structure

```
cv-filter-tool/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py          # API endpoints
│   │   ├── services/
│   │   │   ├── file_processor.py  # PDF/Word extraction
│   │   │   ├── llm_service.py     # OpenAI integration
│   │   │   └── cv_matcher.py      # CV matching logic
│   │   ├── main.py                # FastAPI application
│   │   └── models.py              # Pydantic models
│   ├── requirements.txt
│   └── README.md
└── frontend/
    ├── app/
    │   ├── components/
    │   │   ├── CVUpload.tsx
    │   │   ├── RequirementsInput.tsx
    │   │   └── ResultsDisplay.tsx
    │   ├── page.tsx
    │   └── layout.tsx
    ├── types/
    │   └── index.ts
    ├── package.json
    └── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 18+
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file:
```bash
cp env.example .env
```

6. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

7. Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. **Enter Job Requirements**: In the requirements text area, enter the job description, required skills, experience level, education requirements, and any other criteria.

2. **Upload CVs**: 
   - Click the upload area or drag and drop CV files
   - Supported formats: PDF, DOCX (legacy .doc files should be converted to .docx)
   - You can upload multiple files at once

3. **Filter CVs**: Click the "Filter CVs" button to process all uploaded CVs.

4. **Review Results**: 
   - Results are automatically sorted by match percentage
   - View detailed analysis for each CV including:
     - Overall match percentage
     - Skills match
     - Experience match
     - Education match
     - Summary
     - Strengths and weaknesses

5. **Reorder CVs**: Use the up/down arrows to manually reorder CVs based on your preference.

6. **Clear All**: Click "Clear All" to reset and start over.

## API Endpoints

### `POST /api/upload`
Upload CVs and filter against requirements.

**Request:**
- `requirements` (form field): Job requirements text
- `files` (form field): Array of CV files (PDF, DOCX)

**Response:**
```json
{
  "results": [
    {
      "filename": "cv.pdf",
      "match_percentage": 85.5,
      "skills_match": 90.0,
      "experience_match": 80.0,
      "education_match": 85.0,
      "overall_match": 85.5,
      "summary": "Strong candidate with relevant experience...",
      "strengths": ["5 years Python experience", "Relevant education"],
      "weaknesses": ["Limited cloud experience"]
    }
  ],
  "total_cvs": 1
}
```

### `GET /health`
Health check endpoint.

## Configuration

### Backend
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `OPENAI_MODEL`: OpenAI model to use (default: `gpt-4o-mini`)

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:8000`)

## Development

### Backend
- API documentation: `http://localhost:8000/docs` (Swagger UI)
- Alternative docs: `http://localhost:8000/redoc` (ReDoc)

### Frontend
- Development server: `http://localhost:3000`
- Hot reload enabled for both backend and frontend

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the GitHub repository.

