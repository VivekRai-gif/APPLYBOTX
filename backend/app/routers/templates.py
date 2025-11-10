from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.database import User, Template
from app.models.schemas import TemplateCreate, TemplateResponse
from app.routers.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=TemplateResponse)
async def create_template(
    template: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new email template."""
    
    db_template = Template(
        user_id=current_user.id,
        name=template.name,
        subject_template=template.subject_template,
        body_template=template.body_template,
        is_public=template.is_public
    )
    
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    return TemplateResponse(
        id=db_template.id,
        name=db_template.name,
        subject_template=db_template.subject_template,
        body_template=db_template.body_template,
        is_public=db_template.is_public,
        created_at=db_template.created_at
    )

@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List templates available to the current user."""
    
    # Get user's templates and public templates
    templates = db.query(Template).filter(
        (Template.user_id == current_user.id) | (Template.is_public == True)
    ).order_by(Template.created_at.desc()).all()
    
    return [
        TemplateResponse(
            id=template.id,
            name=template.name,
            subject_template=template.subject_template,
            body_template=template.body_template,
            is_public=template.is_public,
            created_at=template.created_at
        )
        for template in templates
    ]

@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific template."""
    
    template = db.query(Template).filter(
        Template.id == template_id,
        (Template.user_id == current_user.id) | (Template.is_public == True)
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return TemplateResponse(
        id=template.id,
        name=template.name,
        subject_template=template.subject_template,
        body_template=template.body_template,
        is_public=template.is_public,
        created_at=template.created_at
    )

@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    template_update: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a template (only owner can update)."""
    
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template.name = template_update.name
    template.subject_template = template_update.subject_template
    template.body_template = template_update.body_template
    template.is_public = template_update.is_public
    
    db.commit()
    db.refresh(template)
    
    return TemplateResponse(
        id=template.id,
        name=template.name,
        subject_template=template.subject_template,
        body_template=template.body_template,
        is_public=template.is_public,
        created_at=template.created_at
    )

@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a template (only owner can delete)."""
    
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.user_id == current_user.id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    
    return {"message": "Template deleted successfully"}

# Built-in templates endpoint
@router.get("/builtin/list")
async def list_builtin_templates():
    """List built-in email templates."""
    
    builtin_templates = [
        {
            "id": "professional",
            "name": "Professional",
            "subject_template": "Application for {role} Position - {candidate_name}",
            "body_template": """Dear Hiring Manager,

I am writing to express my strong interest in the {role} position at {company_name}. With my background in {key_skills}, I am confident that I would be a valuable addition to your team.

{experience_summary}

I am particularly drawn to this opportunity because {company_interest_reason}. I believe my skills in {relevant_skills} would enable me to contribute effectively to your team's goals.

I would welcome the opportunity to discuss how my background and enthusiasm can contribute to {company_name}'s success. Thank you for your time and consideration.

Best regards,
{candidate_name}
{contact_info}"""
        },
        {
            "id": "enthusiastic",
            "name": "Enthusiastic",
            "subject_template": "Excited to Apply - {role} at {company_name}",
            "body_template": """Hello {company_name} Team!

I hope this email finds you well. I'm reaching out because I'm genuinely excited about the {role} opportunity at {company_name}!

{experience_summary}

What really excites me about this role is {company_interest_reason}. I'm passionate about {relevant_skills} and would love to bring my energy and expertise to your team.

I'd be thrilled to chat more about how I can contribute to {company_name}'s amazing work. Looking forward to hearing from you!

Warm regards,
{candidate_name}
{contact_info}"""
        },
        {
            "id": "concise",
            "name": "Concise",
            "subject_template": "{candidate_name} - {role} Application",
            "body_template": """Dear Hiring Team,

I am interested in the {role} position at {company_name}. My experience includes:

{key_achievements}

I believe my skills in {relevant_skills} align well with your requirements. I would appreciate the opportunity to discuss this position further.

Thank you for your consideration.

{candidate_name}
{contact_info}"""
        }
    ]
    
    return {"builtin_templates": builtin_templates}