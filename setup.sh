#!/bin/bash
# ApplyBotX Setup Script
set -e

echo "🚀 Setting up ApplyBotX..."

# Check prerequisites
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup backend
echo "🐍 Setting up backend..."
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating backend .env file..."
    cat > .env << EOL
# Database (SQLite for development)
DATABASE_URL=sqlite:///./applybotx.db

# Security
SECRET_KEY=dev-secret-key-change-in-production-$(openssl rand -hex 16)
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
EOL
    echo "⚠️  Please edit backend/.env and add your OpenAI API key"
fi

cd ..

# Setup frontend
echo "⚛️  Setting up frontend..."
cd frontend
npm install

# Create frontend .env file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📄 Creating frontend .env file..."
    cat > .env.local << EOL
VITE_API_BASE_URL=http://localhost:8000/api/v1
EOL
fi

cd ..

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env and add your OpenAI API key"
echo "2. (Optional) Configure OAuth credentials for email sending"
echo "3. Run: npm run start"
echo ""
echo "🌐 Application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"