from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.database import User, EmailSend, AIDraft, OAuthAccount
from app.models.schemas import EmailSendRequest, EmailSendResponse, EmailSendStatusResponse
from app.routers.auth import get_current_user
from app.services.email_sender import EmailSender

router = APIRouter()

@router.post("/send", response_model=EmailSendResponse)
async def send_email(
    request: EmailSendRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send an email using the user's connected email account."""
    
    # Validate from_account_id belongs to current user
    oauth_account = db.query(OAuthAccount).filter(
        OAuthAccount.id == request.from_account_id,
        OAuthAccount.user_id == current_user.id
    ).first()
    
    if not oauth_account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    # Get email content
    subject = request.subject
    html_body = request.html_body
    plain_body = request.plain_body
    
    if request.draft_id:
        # Get content from draft
        draft = db.query(AIDraft).filter(
            AIDraft.id == request.draft_id,
            AIDraft.user_id == current_user.id
        ).first()
        
        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")
        
        subject = subject or draft.subject
        html_body = html_body or draft.html_body
        plain_body = plain_body or draft.plain_body
    
    if not subject or not html_body:
        raise HTTPException(status_code=400, detail="Subject and body are required")
    
    # Create email send record
    email_send = EmailSend(
        user_id=current_user.id,
        draft_id=request.draft_id,
        from_account_id=request.from_account_id,
        to_list=request.to,
        cc_list=request.cc or [],
        bcc_list=request.bcc or [],
        subject=subject,
        html_body=html_body,
        status="pending"
    )
    
    db.add(email_send)
    db.commit()
    db.refresh(email_send)
    
    try:
        # Send email
        email_sender = EmailSender()
        
        send_result = await email_sender.send_email(
            oauth_account=oauth_account,
            to_emails=request.to,
            cc_emails=request.cc or [],
            bcc_emails=request.bcc or [],
            subject=subject,
            html_body=html_body,
            plain_body=plain_body,
            send_as_html=request.send_as_html
        )
        
        # Update email send record
        email_send.status = "sent" if send_result["success"] else "failed"
        email_send.provider_response = send_result
        db.commit()
        
        return EmailSendResponse(
            id=email_send.id,
            status=email_send.status,
            provider_response=send_result,
            created_at=email_send.created_at
        )
        
    except Exception as e:
        # Update status to failed
        email_send.status = "failed"
        email_send.provider_response = {"error": str(e)}
        db.commit()
        
        raise HTTPException(status_code=500, detail=f"Email sending failed: {str(e)}")

@router.get("/sends/{send_id}", response_model=EmailSendStatusResponse)
async def get_send_status(
    send_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the status of a sent email."""
    
    email_send = db.query(EmailSend).filter(
        EmailSend.id == send_id,
        EmailSend.user_id == current_user.id
    ).first()
    
    if not email_send:
        raise HTTPException(status_code=404, detail="Email send record not found")
    
    return EmailSendStatusResponse(
        id=email_send.id,
        status=email_send.status,
        subject=email_send.subject,
        to_list=email_send.to_list,
        created_at=email_send.created_at
    )

@router.get("/sent", response_model=List[EmailSendStatusResponse])
async def list_sent_emails(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List sent emails for the current user."""
    
    email_sends = db.query(EmailSend).filter(
        EmailSend.user_id == current_user.id
    ).order_by(EmailSend.created_at.desc()).limit(limit).all()
    
    return [
        EmailSendStatusResponse(
            id=send.id,
            status=send.status,
            subject=send.subject,
            to_list=send.to_list,
            created_at=send.created_at
        )
        for send in email_sends
    ]

@router.delete("/sends/{send_id}")
async def delete_send_record(
    send_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a send record (this doesn't recall the email)."""
    
    email_send = db.query(EmailSend).filter(
        EmailSend.id == send_id,
        EmailSend.user_id == current_user.id
    ).first()
    
    if not email_send:
        raise HTTPException(status_code=404, detail="Email send record not found")
    
    db.delete(email_send)
    db.commit()
    
    return {"message": "Send record deleted successfully"}