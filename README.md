# ApplyBotX - AI Job Application Assistant

ApplyBotX is a user-friendly platform that allows job seekers to upload application files (resumes, portfolios, job descriptions), from which AI extracts key information and generates personalized job application emails. Users can preview, edit, and send emails securely from their own email accounts, streamlining job application efforts.

## 🚀 Features

- **Smart Document Parsing**: Upload PDFs, DOCX, or TXT files and automatically extract skills, experience, and contact information
- **AI-Powered Email Generation**: Generate personalized job application emails using OpenAI GPT
- **Direct Email Sending**: Send emails directly from Gmail or Outlook with OAuth2 security
- **Template System**: Use built-in templates or create custom email templates
- **Secure Data Handling**: All data encrypted at rest, temporary file storage with auto-deletion
- **Email History**: Track sent emails and delivery status

## 🛠 Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Primary database
- **SQLAlchemy** - ORM with Alembic migrations
- **OAuth2** - Google & Microsoft authentication
- **OpenAI API** - AI email generation
- **PyPDF2, python-docx** - Document parsing
- **JWT** - Authentication tokens
- **Cryptography** - Token encryption

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **React Query** - Data fetching
- **Axios** - HTTP client
- **React Quill** - Rich text editor

### Infrastructure
- **Docker** - Containerization
- **AWS S3** - File storage (configurable)
- **Redis** - Session storage and task queue

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **PostgreSQL 12+** (or SQLite for development)
- **Redis** (optional, for production)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/applybotx.git
cd applybotx
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\\Scripts\\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, SECRET_KEY, OPENAI_API_KEY
# Optional: Google/Microsoft OAuth credentials
```

### 3. Database Setup

```bash
# For development (SQLite)
# Update .env: DATABASE_URL=sqlite:///./applybotx.db

# For production (PostgreSQL)
# Update .env: DATABASE_URL=postgresql://username:password@localhost:5432/applybotx

# The database tables will be created automatically when you start the server
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env.local
```

### 5. OAuth Setup (Optional but Recommended)

#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:8000/api/v1/auth/oauth/google/callback`
6. Update `.env` with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

#### Microsoft OAuth:
1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Configure API permissions for Mail.Send
4. Add redirect URI: `http://localhost:8000/api/v1/auth/oauth/microsoft/callback`
5. Update `.env` with `MICROSOFT_CLIENT_ID` and `MICROSOFT_CLIENT_SECRET`

### 6. OpenAI Setup

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Update `.env` with `OPENAI_API_KEY=your-key-here`

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Or run both with one command:**
```bash
# From root directory
npm run start
```

### Production Mode

```bash
# Build frontend
cd frontend
npm run build

# Run backend with production settings
cd ../backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

```
Authentication:
POST   /api/v1/auth/login
POST   /api/v1/auth/register
GET    /api/v1/auth/me
GET    /api/v1/auth/oauth/{provider}/start
GET    /api/v1/auth/oauth/{provider}/callback

Files:
POST   /api/v1/files/upload
GET    /api/v1/files/{file_id}/status
POST   /api/v1/files/{file_id}/parse
GET    /api/v1/files/{file_id}/extracted

AI Generation:
POST   /api/v1/ai/generate-email
GET    /api/v1/ai/drafts/{draft_id}

Email:
POST   /api/v1/email/send
GET    /api/v1/email/sends/{send_id}
GET    /api/v1/email/sent
```

## 🔒 Security Features

- **Token Encryption**: OAuth tokens encrypted at rest using Fernet
- **JWT Authentication**: Secure session management
- **CORS Protection**: Configured for frontend domain
- **Input Validation**: Pydantic schemas for all API inputs
- **File Validation**: Type and size checks for uploads
- **Temporary Storage**: Automatic file cleanup after processing
- **Audit Logging**: Track user actions and email sends

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Docker Deployment

### Using Docker Compose

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your settings

# Build and run
docker-compose up --build
```

### Individual Docker Builds

```bash
# Backend
cd backend
docker build -t applybotx-backend .
docker run -p 8000:8000 --env-file .env applybotx-backend

# Frontend
cd frontend
docker build -t applybotx-frontend .
docker run -p 3000:80 applybotx-frontend
```

## 🌐 Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/applybotx

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# AI
OPENAI_API_KEY=your-openai-api-key

# Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=applybotx-files
AWS_REGION=us-east-1

# Redis (optional)
REDIS_URL=redis://localhost:6379/0

# Encryption
ENCRYPTION_KEY=your-32-byte-base64-encryption-key

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## 📝 Usage Guide

### 1. Account Setup
1. Register an account or sign in with Google/Microsoft
2. Connect your email account (Gmail or Outlook) for sending emails

### 2. Upload Documents
1. Go to **Upload Files** page
2. Drag and drop or browse for PDF, DOCX, or TXT files
3. Wait for automatic parsing to extract key information

### 3. Generate Emails
1. Go to **Compose Email** page
2. Select uploaded files to use as context
3. Enter job description and company details
4. Choose email tone and template
5. Generate AI-powered email draft

### 4. Review and Send
1. Review the generated email content
2. Edit subject and body as needed
3. Add recipient email addresses
4. Send directly from your connected email account

### 5. Track History
1. View sent emails in **History** page
2. Check delivery status
3. Resend or create similar emails

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/your-username/applybotx/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/applybotx/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/applybotx/discussions)

## 🗺 Roadmap

- [ ] **Email Template Editor** - Visual template customization
- [ ] **Bulk Email Sending** - Send to multiple recipients
- [ ] **Analytics Dashboard** - Email open/click tracking
- [ ] **Job Board Integration** - Import job listings directly
- [ ] **Contact Management** - Store and manage recruiter contacts
- [ ] **Follow-up Automation** - Automated follow-up reminders
- [ ] **Mobile App** - React Native mobile application
- [ ] **LLaMA Integration** - Self-hosted AI option
- [ ] **Multi-language Support** - Internationalization

---

**Made with ❤️ for job seekers everywhere**#   A P P L Y B O T X  
 