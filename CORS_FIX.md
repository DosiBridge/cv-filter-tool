# CORS Fix Applied

## Issue
Frontend running on port 3001 was blocked by CORS policy because backend only allowed port 3000.

## Solution Applied

### Backend Changes (`backend/app/main.py`)
Updated CORS middleware to allow multiple origins:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

### Frontend Changes (`frontend/app/page.tsx`)
- Added `credentials: 'include'` to fetch request
- Removed explicit Content-Type header (browser handles FormData automatically)

## Verification

1. **Backend is running** on port 8000
2. **CORS is configured** to allow ports 3000 and 3001
3. **Frontend can now connect** to backend without CORS errors

## Testing

1. Refresh your browser at http://localhost:3001
2. The CORS error should be resolved
3. Try uploading CVs and filtering - it should work now

## Note

If you're still seeing CORS errors:
1. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Restart the frontend dev server if needed

The backend has been restarted with the new CORS configuration.

