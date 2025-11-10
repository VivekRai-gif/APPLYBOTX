import os
import shutil
from typing import Optional
from fastapi import UploadFile
import uuid

class FileStorage:
    def __init__(self, storage_path: str = "uploads"):
        self.storage_path = storage_path
        os.makedirs(storage_path, exist_ok=True)

    async def save_file(self, file: UploadFile, filename: Optional[str] = None) -> str:
        """Save uploaded file to storage and return file path."""
        if filename is None:
            # Generate unique filename
            file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
            filename = f"{uuid.uuid4()}{file_ext}"
        
        file_path = os.path.join(self.storage_path, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return file_path

    def delete_file(self, file_path: str) -> bool:
        """Delete file from storage."""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception:
            return False

    def get_file_size(self, file_path: str) -> int:
        """Get file size in bytes."""
        try:
            return os.path.getsize(file_path)
        except Exception:
            return 0

    def file_exists(self, file_path: str) -> bool:
        """Check if file exists."""
        return os.path.exists(file_path)