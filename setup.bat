@echo off
echo Setting up ApplyBotX...

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
)
echo Node.js found

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed. Please install Python 3.8+ and try again.
    pause
    exit /b 1
)
echo Python found

:: Install root dependencies
echo Installing root dependencies...
npm install

:: Setup backend
echo Setting up backend...
cd backend

:: Create virtual environment
python -m venv .venv
call .\.venv\Scripts\activate.bat

:: Install Python dependencies
pip install -r requirements.txt

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating backend .env file...
    (
        echo # Database ^(SQLite for development^)
        echo DATABASE_URL=sqlite:///./applybotx.db
        echo.
        echo # Security
        echo SECRET_KEY=dev-secret-key-change-in-production
        echo ALGORITHM=HS256
        echo ACCESS_TOKEN_EXPIRE_MINUTES=30
        echo.
        echo # OpenAI ^(Required for email generation^)
        echo OPENAI_API_KEY=your-openai-api-key-here
        echo.
        echo # OAuth ^(Optional for development^)
        echo GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
        echo GOOGLE_CLIENT_SECRET=your-google-client-secret
        echo MICROSOFT_CLIENT_ID=your-microsoft-client-id
        echo MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
        echo.
        echo # CORS
        echo FRONTEND_URL=http://localhost:3000
    ) > .env
    echo Please edit backend\.env and add your OpenAI API key
)

cd ..

:: Setup frontend
echo Setting up frontend...
cd frontend
npm install

:: Create frontend .env file if it doesn't exist
if not exist ".env.local" (
    echo Creating frontend .env file...
    echo VITE_API_BASE_URL=http://localhost:8000/api/v1 > .env.local
)

cd ..

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Edit backend\.env and add your OpenAI API key
echo 2. ^(Optional^) Configure OAuth credentials for email sending
echo 3. Run: npm run start
echo.
echo Application will be available at:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
pause