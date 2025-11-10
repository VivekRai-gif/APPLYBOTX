import base64
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import httpx
from typing import List, Dict, Any
from app.models.database import OAuthAccount
from app.services.encryption import decrypt_token
from app.services.oauth import GoogleOAuth, MicrosoftOAuth

class EmailSender:
    def __init__(self):
        self.google_oauth = GoogleOAuth()
        self.microsoft_oauth = MicrosoftOAuth()

    async def send_email(
        self,
        oauth_account: OAuthAccount,
        to_emails: List[str],
        cc_emails: List[str],
        bcc_emails: List[str],
        subject: str,
        html_body: str,
        plain_body: str,
        send_as_html: bool = True
    ) -> Dict[str, Any]:
        """Send email using the appropriate provider."""
        
        if oauth_account.provider == "google":
            return await self._send_gmail(
                oauth_account, to_emails, cc_emails, bcc_emails,
                subject, html_body, plain_body, send_as_html
            )
        elif oauth_account.provider == "microsoft":
            return await self._send_outlook(
                oauth_account, to_emails, cc_emails, bcc_emails,
                subject, html_body, plain_body, send_as_html
            )
        else:
            raise ValueError(f"Unsupported email provider: {oauth_account.provider}")

    async def _send_gmail(
        self,
        oauth_account: OAuthAccount,
        to_emails: List[str],
        cc_emails: List[str],
        bcc_emails: List[str],
        subject: str,
        html_body: str,
        plain_body: str,
        send_as_html: bool
    ) -> Dict[str, Any]:
        """Send email using Gmail API."""
        
        try:
            # Get access token (refresh if needed)
            access_token = await self._get_valid_access_token(oauth_account)
            
            # Create MIME message
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = oauth_account.email
            message['To'] = ', '.join(to_emails)
            
            if cc_emails:
                message['Cc'] = ', '.join(cc_emails)
            
            # Add text and HTML parts
            if plain_body:
                text_part = MIMEText(plain_body, 'plain')
                message.attach(text_part)
            
            if send_as_html and html_body:
                html_part = MIMEText(html_body, 'html')
                message.attach(html_part)
            
            # Convert to raw message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            # Send via Gmail API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                    headers={
                        'Authorization': f'Bearer {access_token}',
                        'Content-Type': 'application/json'
                    },
                    json={'raw': raw_message}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "message_id": result.get("id"),
                        "provider": "gmail",
                        "response": result
                    }
                else:
                    error_detail = response.text
                    return {
                        "success": False,
                        "error": f"Gmail API error: {response.status_code}",
                        "detail": error_detail,
                        "provider": "gmail"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": f"Gmail sending failed: {str(e)}",
                "provider": "gmail"
            }

    async def _send_outlook(
        self,
        oauth_account: OAuthAccount,
        to_emails: List[str],
        cc_emails: List[str],
        bcc_emails: List[str],
        subject: str,
        html_body: str,
        plain_body: str,
        send_as_html: bool
    ) -> Dict[str, Any]:
        """Send email using Microsoft Graph API."""
        
        try:
            # Get access token (refresh if needed)
            access_token = await self._get_valid_access_token(oauth_account)
            
            # Prepare recipients
            to_recipients = [{"emailAddress": {"address": email}} for email in to_emails]
            cc_recipients = [{"emailAddress": {"address": email}} for email in cc_emails] if cc_emails else []
            bcc_recipients = [{"emailAddress": {"address": email}} for email in bcc_emails] if bcc_emails else []
            
            # Prepare message body
            body_content = html_body if send_as_html else plain_body
            body_type = "HTML" if send_as_html else "Text"
            
            message_payload = {
                "message": {
                    "subject": subject,
                    "body": {
                        "contentType": body_type,
                        "content": body_content
                    },
                    "toRecipients": to_recipients,
                    "ccRecipients": cc_recipients,
                    "bccRecipients": bcc_recipients
                }
            }
            
            # Send via Microsoft Graph API
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://graph.microsoft.com/v1.0/me/sendMail",
                    headers={
                        'Authorization': f'Bearer {access_token}',
                        'Content-Type': 'application/json'
                    },
                    json=message_payload
                )
                
                if response.status_code == 202:  # Microsoft Graph returns 202 for successful send
                    return {
                        "success": True,
                        "provider": "microsoft",
                        "response": "Email sent successfully"
                    }
                else:
                    error_detail = response.text
                    return {
                        "success": False,
                        "error": f"Microsoft Graph API error: {response.status_code}",
                        "detail": error_detail,
                        "provider": "microsoft"
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": f"Outlook sending failed: {str(e)}",
                "provider": "microsoft"
            }

    async def _get_valid_access_token(self, oauth_account: OAuthAccount) -> str:
        """Get a valid access token, refreshing if necessary."""
        from datetime import datetime
        from app.database import SessionLocal
        
        # Decrypt current access token
        access_token = decrypt_token(oauth_account.access_token_encrypted)
        
        # Check if token is expired (with 5 minute buffer)
        if oauth_account.token_expiry:
            from datetime import timedelta
            if datetime.utcnow() + timedelta(minutes=5) > oauth_account.token_expiry:
                # Token is expired or about to expire, refresh it
                access_token = await self._refresh_access_token(oauth_account)
        
        return access_token

    async def _refresh_access_token(self, oauth_account: OAuthAccount) -> str:
        """Refresh the access token."""
        from datetime import datetime, timedelta
        from app.database import SessionLocal
        from app.services.encryption import encrypt_token
        
        refresh_token = decrypt_token(oauth_account.refresh_token_encrypted)
        
        if not refresh_token:
            raise Exception("No refresh token available")
        
        try:
            if oauth_account.provider == "google":
                token_data = await self.google_oauth.refresh_access_token(refresh_token)
            elif oauth_account.provider == "microsoft":
                token_data = await self.microsoft_oauth.refresh_access_token(refresh_token)
            else:
                raise Exception(f"Unknown provider: {oauth_account.provider}")
            
            # Update the database with new tokens
            db = SessionLocal()
            try:
                # Refresh the oauth_account object from the database
                db_oauth_account = db.query(OAuthAccount).filter(
                    OAuthAccount.id == oauth_account.id
                ).first()
                
                if db_oauth_account:
                    db_oauth_account.access_token_encrypted = encrypt_token(token_data['access_token'])
                    if 'refresh_token' in token_data:
                        db_oauth_account.refresh_token_encrypted = encrypt_token(token_data['refresh_token'])
                    db_oauth_account.token_expiry = datetime.utcnow() + timedelta(seconds=token_data.get('expires_in', 3600))
                    db_oauth_account.updated_at = datetime.utcnow()
                    
                    db.commit()
                
                return token_data['access_token']
                
            finally:
                db.close()
                
        except Exception as e:
            raise Exception(f"Token refresh failed: {str(e)}")