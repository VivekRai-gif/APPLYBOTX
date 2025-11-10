from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.database import get_db
from app.models.database import User, AIDraft, ParsedDocument, File
from app.models.schemas import AIGenerateRequest, AIDraftResponse
from app.routers.auth import get_current_user
from app.services.ai_generator import AIEmailGenerator

router = APIRouter()

@router.post("/generate-email", response_model=AIDraftResponse)
async def generate_email(
    request: AIGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate an email draft using AI."""
    try:
        # Get extracted data if file_ids provided
        extracted_data = None
        if request.file_ids:
            # Fetch and combine extracted data from multiple files
            parsed_docs = db.query(ParsedDocument).join(File).filter(
                ParsedDocument.file_id.in_(request.file_ids),
                File.user_id == current_user.id
            ).all()
            
            if not parsed_docs:
                raise HTTPException(status_code=404, detail="No parsed documents found for provided file IDs")
            
            # Merge extracted data from multiple documents
            extracted_data = merge_extracted_data([doc.json_extraction for doc in parsed_docs])
        
        elif request.extracted_data:
            extracted_data = request.extracted_data.dict()
        else:
            raise HTTPException(status_code=400, detail="Either file_ids or extracted_data must be provided")
        
        # Generate email using AI
        ai_generator = AIEmailGenerator()
        
        generation_result = await ai_generator.generate_email(
            extracted_data=extracted_data,
            job_description=request.job_description,
            company_name=request.company_name,
            role=request.role,
            tone=request.tone,
            length=request.length,
            template_id=request.template_id
        )
        
        # Store draft in database
        draft = AIDraft(
            user_id=current_user.id,
            inputs_json={
                "job_description": request.job_description,
                "company_name": request.company_name,
                "role": request.role,
                "tone": request.tone,
                "length": request.length,
                "template_id": request.template_id
            },
            subject=generation_result["subject"],
            html_body=generation_result["html_body"],
            plain_body=generation_result["plain_body"],
            model_meta=generation_result.get("model_meta", {})
        )
        
        db.add(draft)
        db.commit()
        db.refresh(draft)
        
        return AIDraftResponse(
            id=draft.id,
            subject=draft.subject,
            html_body=draft.html_body,
            plain_body=draft.plain_body,
            model_meta=draft.model_meta,
            created_at=draft.created_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email generation failed: {str(e)}")

@router.get("/drafts/{draft_id}", response_model=AIDraftResponse)
async def get_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific AI draft."""
    draft = db.query(AIDraft).filter(
        AIDraft.id == draft_id,
        AIDraft.user_id == current_user.id
    ).first()
    
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    return AIDraftResponse(
        id=draft.id,
        subject=draft.subject,
        html_body=draft.html_body,
        plain_body=draft.plain_body,
        model_meta=draft.model_meta,
        created_at=draft.created_at
    )

@router.get("/drafts", response_model=List[AIDraftResponse])
async def list_drafts(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List AI drafts for the current user."""
    drafts = db.query(AIDraft).filter(
        AIDraft.user_id == current_user.id
    ).order_by(AIDraft.created_at.desc()).limit(limit).all()
    
    return [
        AIDraftResponse(
            id=draft.id,
            subject=draft.subject,
            html_body=draft.html_body,
            plain_body=draft.plain_body,
            model_meta=draft.model_meta,
            created_at=draft.created_at
        )
        for draft in drafts
    ]

@router.delete("/drafts/{draft_id}")
async def delete_draft(
    draft_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an AI draft."""
    draft = db.query(AIDraft).filter(
        AIDraft.id == draft_id,
        AIDraft.user_id == current_user.id
    ).first()
    
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    db.delete(draft)
    db.commit()
    
    return {"message": "Draft deleted successfully"}

def merge_extracted_data(data_list: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Merge extracted data from multiple documents."""
    merged = {
        "contact": {},
        "skills": [],
        "experiences": [],
        "education": [],
        "summary": "",
        "raw_text": ""
    }
    
    for data in data_list:
        # Merge contact info (prefer non-empty values)
        for key, value in data.get("contact", {}).items():
            if value and not merged["contact"].get(key):
                merged["contact"][key] = value
        
        # Merge skills (deduplicate)
        for skill in data.get("skills", []):
            if skill not in merged["skills"]:
                merged["skills"].append(skill)
        
        # Merge experiences
        merged["experiences"].extend(data.get("experiences", []))
        
        # Merge education
        merged["education"].extend(data.get("education", []))
        
        # Combine summaries
        if data.get("summary"):
            if merged["summary"]:
                merged["summary"] += " " + data["summary"]
            else:
                merged["summary"] = data["summary"]
        
        # Combine raw text (truncated)
        if data.get("raw_text"):
            merged["raw_text"] += " " + data["raw_text"]
    
    # Truncate if too long
    merged["raw_text"] = merged["raw_text"][:5000]
    merged["summary"] = merged["summary"][:1000]
    
    return merged