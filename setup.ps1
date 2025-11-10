# ApplyBotX Setup Script for Windows
Write-Host "Setting up ApplyBotX..." -ForegroundColor Green

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $null = Get-Command node -ErrorAction Stop
    Write-Host "Node.js found" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed. Please install Node.js 16+ and try again." -ForegroundColor Red
    exit 1
}

try {
    $null = Get-Command python -ErrorAction Stop
    Write-Host "Python found" -ForegroundColor Green
} catch {
    Write-Host "Python is not installed. Please install Python 3.8+ and try again." -ForegroundColor Red
    exit 1
}

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install

# Setup backend
Write-Host "Setting up backend..." -ForegroundColor Yellow
Set-Location backend

# Create virtual environment
python -m venv .venv
& ".\.venv\Scripts\Activate.ps1"

# Install Python dependencies
pip install -r requirements.txt

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating backend .env file..." -ForegroundColor Yellow
    $secretKey = -join ((1..32) | ForEach { Get-Random -input ([char[]]([char]'a'..[char]'f') + [char[]]([char]'0'..[char]'9')) })
    
    $envContent = @"
# Database (SQLite for development)
DATABASE_URL=sqlite:///./applybotx.db

# Security
SECRET_KEY=dev-secret-key-change-in-production-$secretKey
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI (Required for email generation)
OPENAI_API_KEY=your-openai-api-key-here

# OAuth (Optional for development)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# CORS
FRONTEND_URL=http://localhost:3000
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "Please edit backend\.env and add your OpenAI API key" -ForegroundColor Yellow
}

Set-Location ..

# Setup frontend
Write-Host "Setting up frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install

# Create frontend .env file if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "Creating frontend .env file..." -ForegroundColor Yellow
    $frontendEnv = "VITE_API_BASE_URL=http://localhost:8000/api/v1"
    $frontendEnv | Out-File -FilePath ".env.local" -Encoding UTF8
}

Set-Location ..

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend\.env and add your OpenAI API key" -ForegroundColor White
Write-Host "2. (Optional) Configure OAuth credentials for email sending" -ForegroundColor White
Write-Host "3. Run: npm run start" -ForegroundColor White
Write-Host ""
Write-Host "Application will be available at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor White