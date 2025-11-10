from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_oauth_user: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# OAuth schemas
class OAuthAccountResponse(BaseModel):
    id: int
    provider: str
    email: str
    scopes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# File schemas
class FileUploadResponse(BaseModel):
    id: int
    filename: str
    content_type: str
    size: int
    status: str
    created_at: datetime

class FileStatusResponse(BaseModel):
    id: int
    status: str
    filename: str

# Document parsing schemas
class ContactInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class Experience(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    description: Optional[str] = None
    highlights: List[str] = []

class Education(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    gpa: Optional[str] = None

class ParsedDocumentResponse(BaseModel):
    contact: ContactInfo
    skills: List[str] = []
    experiences: List[Experience] = []
    education: List[Education] = []
    summary: Optional[str] = None
    raw_text: str

# AI generation schemas
class AIGenerateRequest(BaseModel):
    file_ids: Optional[List[int]] = None
    extracted_data: Optional[ParsedDocumentResponse] = None
    job_description: str
    company_name: str
    role: str
    template_id: Optional[int] = None
    tone: str = "professional"  # professional, friendly, enthusiastic
    length: str = "normal"  # short, normal, long

class AIDraftResponse(BaseModel):
    id: int
    subject: str
    html_body: str
    plain_body: str
    model_meta: Optional[Dict[str, Any]] = None
    created_at: datetime

# Email schemas
class EmailSendRequest(BaseModel):
    draft_id: Optional[int] = None
    subject: Optional[str] = None
    html_body: Optional[str] = None
    plain_body: Optional[str] = None
    from_account_id: int
    to: List[EmailStr]
    cc: Optional[List[EmailStr]] = []
    bcc: Optional[List[EmailStr]] = []
    send_as_html: bool = True

class EmailSendResponse(BaseModel):
    id: int
    status: str
    provider_response: Optional[Dict[str, Any]] = None
    created_at: datetime

class EmailSendStatusResponse(BaseModel):
    id: int
    status: str
    subject: str
    to_list: List[str]
    created_at: datetime

# Template schemas
class TemplateCreate(BaseModel):
    name: str
    subject_template: str
    body_template: str
    is_public: bool = False

class TemplateResponse(BaseModel):
    id: int
    name: str
    subject_template: str
    body_template: str
    is_public: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

# Generic response schemas
class StatusResponse(BaseModel):
    status: str
    message: Optional[str] = None

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None