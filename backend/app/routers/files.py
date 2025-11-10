from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime, timedelta
import uuid

from app.database import get_db
from app.models.database import User, File, ParsedDocument
from app.models.schemas import FileUploadResponse, FileStatusResponse, ParsedDocumentResponse
from app.routers.auth import get_current_user
from app.services.document_parser import DocumentParser
from app.services.file_storage import FileStorage

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_file(file: UploadFile):
    """Validate uploaded file."""
    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size (this is approximate since we don't read the whole file)
    if hasattr(file, 'size') and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file for processing."""
    validate_file(file)
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1].lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Create file record
    db_file = File(
        user_id=current_user.id,
        filename=file.filename,
        content_type=file.content_type,
        size=0,  # Will be updated after saving
        status="uploading",
        expires_at=datetime.utcnow() + timedelta(hours=24)  # 24 hour expiry
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    try:
        # Save file
        file_storage = FileStorage()
        file_path = await file_storage.save_file(file, unique_filename)
        
        # Update file record with actual size and path
        file_size = os.path.getsize(file_path)
        db_file.s3_key = file_path  # For local storage, this is the file path
        db_file.size = file_size
        db_file.status = "uploaded"
        db.commit()
        
        return FileUploadResponse(
            id=db_file.id,
            filename=db_file.filename,
            content_type=db_file.content_type,
            size=db_file.size,
            status=db_file.status,
            created_at=db_file.created_at
        )
        
    except Exception as e:
        # Update status to error
        db_file.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.get("/{file_id}/status", response_model=FileStatusResponse)
async def get_file_status(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get file upload/processing status."""
    db_file = db.query(File).filter(
        File.id == file_id,
        File.user_id == current_user.id
    ).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileStatusResponse(
        id=db_file.id,
        status=db_file.status,
        filename=db_file.filename
    )

@router.post("/{file_id}/parse")
async def parse_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger document parsing for a file."""
    db_file = db.query(File).filter(
        File.id == file_id,
        File.user_id == current_user.id
    ).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if db_file.status != "uploaded":
        raise HTTPException(status_code=400, detail="File not ready for parsing")
    
    try:
        # Update status
        db_file.status = "processing"
        db.commit()
        
        # Parse document
        parser = DocumentParser()
        file_path = db_file.s3_key  # Local file path for now
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on disk")
        
        parsed_data = await parser.parse_document(file_path, db_file.content_type)
        
        # Check if parsing result already exists
        existing_parsed = db.query(ParsedDocument).filter(
            ParsedDocument.file_id == file_id
        ).first()
        
        if existing_parsed:
            # Update existing
            existing_parsed.json_extraction = parsed_data
        else:
            # Create new parsed document record
            parsed_doc = ParsedDocument(
                file_id=db_file.id,
                user_id=current_user.id,
                json_extraction=parsed_data
            )
            db.add(parsed_doc)
        
        # Update file status
        db_file.status = "completed"
        db.commit()
        
        return {"message": "File parsed successfully", "file_id": file_id}
        
    except Exception as e:
        db_file.status = "error"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")

@router.get("/{file_id}/extracted", response_model=ParsedDocumentResponse)
async def get_extracted_data(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get extracted data from a parsed document."""
    parsed_doc = db.query(ParsedDocument).join(File).filter(
        ParsedDocument.file_id == file_id,
        File.user_id == current_user.id
    ).first()
    
    if not parsed_doc:
        raise HTTPException(status_code=404, detail="Parsed document not found")
    
    return ParsedDocumentResponse(**parsed_doc.json_extraction)

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file and its associated data."""
    db_file = db.query(File).filter(
        File.id == file_id,
        File.user_id == current_user.id
    ).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Delete file from storage
        if db_file.s3_key and os.path.exists(db_file.s3_key):
            os.remove(db_file.s3_key)
        
        # Delete parsed document if exists
        parsed_doc = db.query(ParsedDocument).filter(
            ParsedDocument.file_id == file_id
        ).first()
        if parsed_doc:
            db.delete(parsed_doc)
        
        # Delete file record
        db.delete(db_file)
        db.commit()
        
        return {"message": "File deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File deletion failed: {str(e)}")

@router.get("/", response_model=List[FileUploadResponse])
async def list_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all files for the current user."""
    files = db.query(File).filter(
        File.user_id == current_user.id
    ).order_by(File.created_at.desc()).limit(50).all()
    
    return [
        FileUploadResponse(
            id=f.id,
            filename=f.filename,
            content_type=f.content_type,
            size=f.size,
            status=f.status,
            created_at=f.created_at
        )
        for f in files
    ]