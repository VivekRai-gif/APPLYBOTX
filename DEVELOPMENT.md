# Development Setup Guide

This guide will help you set up a local development environment for ApplyBotX.

## Quick Start

### Prerequisites Check
Before starting, ensure you have:
- Python 3.8+ installed
- Node.js 16+ installed
- PostgreSQL running (or use SQLite for quick start)

### 1-Minute Setup (Using SQLite)

```powershell
# Clone and enter directory
git clone <repository-url>
cd ApplyBotX

# Install root dependencies
npm install

# Setup backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Create basic .env file
echo "DATABASE_URL=sqlite:///./applybotx.db" > .env
echo "SECRET_KEY=dev-secret-change-in-production" >> .env
echo "OPENAI_API_KEY=your-openai-key-here" >> .env

# Setup frontend
cd ..\frontend
npm install

# Start both services
cd ..
npm run start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Detailed Development Setup

### Backend Development

#### Environment Configuration

Create `backend/.env`:
```bash
# Database (SQLite for development)
DATABASE_URL=sqlite:///./applybotx.db

# Security
SECRET_KEY=your-secret-key-for-development
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI (Required for email generation)
OPENAI_API_KEY=sk-your-openai-api-key

# OAuth (Optional for development)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# CORS
FRONTEND_URL=http://localhost:3000
```

#### Database Migration
```powershell
cd backend
# Tables are created automatically on first run
python -m uvicorn app.main:app --reload
```

#### Running Tests
```powershell
cd backend
pytest tests/ -v
```

#### API Development
- FastAPI auto-generates documentation at `/docs`
- Use `/redoc` for alternative documentation
- Hot reload is enabled in development mode

### Frontend Development

#### Environment Configuration

Create `frontend/.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

#### Development Server
```powershell
cd frontend
npm run dev
```

#### Building for Production
```powershell
cd frontend
npm run build
npm run preview  # Preview production build
```

## OAuth Setup for Development

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:8000/api/v1/auth/oauth/google/callback`
5. Copy the Client ID and Client Secret to your `.env` file

### Microsoft OAuth Setup
1. Go to [Azure Portal](https://portal.azure.com/)
2. Go to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Configure:
   - Name: "ApplyBotX Development"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: `http://localhost:8000/api/v1/auth/oauth/microsoft/callback`
5. After creation, go to "API permissions":
   - Add "Microsoft Graph" > "Delegated permissions"
   - Add "Mail.Send" permission
6. Go to "Certificates & secrets" and create a new client secret
7. Copy the Application (client) ID and client secret to your `.env` file

## Database Management

### SQLite (Development)
- Database file: `backend/applybotx.db`
- No setup required, created automatically
- Use SQLite Browser for GUI access

### PostgreSQL (Production-like)
```powershell
# Install PostgreSQL and create database
createdb applybotx

# Update .env
DATABASE_URL=postgresql://username:password@localhost:5432/applybotx
```

### Database Operations
```powershell
cd backend

# Reset database (delete all tables and recreate)
rm applybotx.db  # For SQLite
python -c "from app.models.database import Base; from app.database import engine; Base.metadata.drop_all(engine); Base.metadata.create_all(engine)"

# View database schema
python -c "from app.models.database import Base; print([table.name for table in Base.metadata.tables.values()])"
```

## Testing

### Backend Testing
```powershell
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py -v

# Run tests with output
pytest -s tests/
```

### Frontend Testing
```powershell
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Debugging

### Backend Debugging
- FastAPI automatically provides interactive debugging
- Use `print()` statements or `logging` for debugging
- Access interactive docs at `/docs` to test API endpoints

### Frontend Debugging
- Use browser developer tools
- React Developer Tools extension recommended
- Console.log for debugging

### Common Issues

#### "Import could not be resolved" errors
- These are expected during development before installing dependencies
- Run `pip install -r requirements.txt` and `npm install` to resolve

#### Database connection issues
- Check DATABASE_URL format
- Ensure PostgreSQL is running (if using PostgreSQL)
- For SQLite, ensure write permissions in directory

#### OAuth redirect issues
- Check redirect URIs match exactly (including http vs https)
- Ensure OAuth providers are configured correctly
- Check console for detailed error messages

#### CORS errors
- Ensure FRONTEND_URL in backend .env matches frontend URL
- Check browser console for specific CORS error details

## Development Tools

### Recommended VS Code Extensions
- Python
- Pylance
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- REST Client (for API testing)
- GitLens

### Code Formatting
```powershell
# Backend formatting
cd backend
black app/
isort app/
flake8 app/

# Frontend formatting
cd frontend
npm run lint
npm run lint:fix
```

### Environment Variables Management
- Never commit `.env` files
- Use `.env.example` as template
- Consider using python-dotenv for environment management

## Production Considerations

When moving to production:
1. Use PostgreSQL instead of SQLite
2. Set strong SECRET_KEY
3. Configure proper CORS origins
4. Use HTTPS for OAuth redirects
5. Set up proper file storage (AWS S3)
6. Configure Redis for session storage
7. Use environment variables for all secrets
8. Set up proper logging and monitoring

## Getting Help

- Check the main README.md for general information
- Look at API documentation at `/docs` when backend is running
- Check GitHub issues for known problems
- Use browser developer tools for frontend issues
- Check backend logs for API issues