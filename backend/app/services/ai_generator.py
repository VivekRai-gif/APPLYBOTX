import json
import re
from typing import Dict, Any, Optional
from app.config import settings

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

class AIEmailGenerator:
    def __init__(self):
        if OPENAI_AVAILABLE and settings.openai_api_key:
            openai.api_key = settings.openai_api_key
            self.client = openai.OpenAI(api_key=settings.openai_api_key)
        else:
            self.client = None
    
    async def generate_email(
        self,
        extracted_data: Dict[str, Any],
        job_description: str,
        company_name: str,
        role: str,
        tone: str = "professional",
        length: str = "normal",
        template_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate email using AI."""
        
        if not self.client:
            # Fallback to template-based generation
            return self._generate_template_email(
                extracted_data, job_description, company_name, role, tone, length
            )
        
        try:
            # Prepare context
            context = self._prepare_context(extracted_data, job_description, company_name, role)
            
            # Generate email using OpenAI
            prompt = self._create_prompt(context, tone, length)
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional career advisor helping job seekers write compelling application emails."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=800
            )
            
            result = response.choices[0].message.content
            
            # Parse the result
            return self._parse_ai_response(result, response.usage.total_tokens if response.usage else 0)
            
        except Exception as e:
            # Fallback to template generation
            return self._generate_template_email(
                extracted_data, job_description, company_name, role, tone, length
            )
    
    def _prepare_context(self, extracted_data: Dict[str, Any], job_description: str, company_name: str, role: str) -> Dict[str, Any]:
        """Prepare context for AI generation."""
        
        # Extract key information
        contact = extracted_data.get("contact", {})
        skills = extracted_data.get("skills", [])[:10]  # Top 10 skills
        experiences = extracted_data.get("experiences", [])[:3]  # Top 3 experiences
        summary = extracted_data.get("summary", "")[:500]  # Truncate summary
        
        # Create a concise candidate summary
        candidate_summary = []
        
        if contact.get("name"):
            candidate_summary.append(f"Name: {contact['name']}")
        
        if summary:
            candidate_summary.append(f"Summary: {summary}")
        
        if skills:
            candidate_summary.append(f"Key Skills: {', '.join(skills)}")
        
        if experiences:
            exp_text = []
            for exp in experiences:
                if exp.get("title") and exp.get("company"):
                    exp_text.append(f"{exp['title']} at {exp['company']}")
            if exp_text:
                candidate_summary.append(f"Recent Experience: {'; '.join(exp_text)}")
        
        return {
            "candidate_summary": "\n".join(candidate_summary),
            "job_description": job_description[:1000],  # Truncate job description
            "company_name": company_name,
            "role": role,
            "contact_email": contact.get("email", ""),
            "contact_phone": contact.get("phone", "")
        }
    
    def _create_prompt(self, context: Dict[str, Any], tone: str, length: str) -> str:
        """Create AI prompt for email generation."""
        
        length_instructions = {
            "short": "Keep the email concise (150-200 words max)",
            "normal": "Write a standard length email (200-300 words)",
            "long": "Write a detailed email (300-400 words)"
        }
        
        tone_instructions = {
            "professional": "Use a formal, professional tone",
            "friendly": "Use a warm but professional tone",
            "enthusiastic": "Use an enthusiastic and energetic tone"
        }
        
        prompt = f"""
Generate a job application email with the following requirements:

CANDIDATE INFORMATION:
{context['candidate_summary']}

JOB DETAILS:
Company: {context['company_name']}
Position: {context['role']}
Job Description: {context['job_description']}

REQUIREMENTS:
- {tone_instructions.get(tone, 'Use a professional tone')}
- {length_instructions.get(length, 'Write a standard length email')}
- Include a compelling subject line (max 10 words)
- Highlight 2-3 most relevant skills/experiences that match the job
- Include contact information if available
- End with a clear call-to-action

OUTPUT FORMAT (return as JSON):
{{
    "subject": "Subject line here",
    "body_html": "<p>HTML formatted email body</p>",
    "body_text": "Plain text version"
}}

Generate the email now:
"""
        return prompt
    
    def _parse_ai_response(self, response: str, tokens_used: int) -> Dict[str, Any]:
        """Parse AI response and extract email components."""
        try:
            # Try to parse JSON response
            if response.strip().startswith('{'):
                parsed = json.loads(response)
                return {
                    "subject": parsed.get("subject", "Application for Position"),
                    "html_body": parsed.get("body_html", parsed.get("body", "")),
                    "plain_body": parsed.get("body_text", self._html_to_text(parsed.get("body_html", ""))),
                    "model_meta": {
                        "model": "gpt-3.5-turbo",
                        "tokens_used": tokens_used,
                        "response_type": "json"
                    }
                }
        except json.JSONDecodeError:
            pass
        
        # Fallback: parse text response
        lines = response.split('\n')
        subject = "Application for Position"
        body_parts = []
        
        for line in lines:
            line = line.strip()
            if line.lower().startswith('subject:'):
                subject = line[8:].strip().strip('"')
            elif line and not line.lower().startswith(('subject:', 'body:', 'html:', 'text:')):
                body_parts.append(line)
        
        body_text = '\n'.join(body_parts)
        body_html = self._text_to_html(body_text)
        
        return {
            "subject": subject,
            "html_body": body_html,
            "plain_body": body_text,
            "model_meta": {
                "model": "gpt-3.5-turbo",
                "tokens_used": tokens_used,
                "response_type": "text"
            }
        }
    
    def _generate_template_email(
        self,
        extracted_data: Dict[str, Any],
        job_description: str,
        company_name: str,
        role: str,
        tone: str,
        length: str
    ) -> Dict[str, Any]:
        """Fallback template-based email generation."""
        
        contact = extracted_data.get("contact", {})
        skills = extracted_data.get("skills", [])[:5]
        experiences = extracted_data.get("experiences", [])[:2]
        
        name = contact.get("name", "")
        
        # Generate subject
        if name:
            subject = f"Application for {role} - {name}"
        else:
            subject = f"Application for {role} Position"
        
        # Generate body
        greeting = f"Dear {company_name} Hiring Team,"
        
        # Opening paragraph
        if name:
            opening = f"I am {name}, and I am writing to express my strong interest in the {role} position at {company_name}."
        else:
            opening = f"I am writing to express my strong interest in the {role} position at {company_name}."
        
        # Skills paragraph
        skills_text = ""
        if skills:
            skills_list = ", ".join(skills[:3])
            skills_text = f"My technical expertise includes {skills_list}, which aligns well with the requirements for this role."
        
        # Experience paragraph
        exp_text = ""
        if experiences:
            exp = experiences[0]
            if exp.get("title") and exp.get("company"):
                exp_text = f"In my recent role as {exp['title']} at {exp['company']}, I have gained valuable experience that would contribute to your team's success."
        
        # Closing
        closing = f"I would welcome the opportunity to discuss how my background and enthusiasm can contribute to {company_name}'s continued success. Please feel free to contact me to schedule an interview."
        
        # Contact info
        contact_info = []
        if contact.get("email"):
            contact_info.append(f"Email: {contact['email']}")
        if contact.get("phone"):
            contact_info.append(f"Phone: {contact['phone']}")
        
        contact_text = "\n".join(contact_info) if contact_info else ""
        
        signature = "Best regards," + (f"\n{name}" if name else "")
        
        # Combine paragraphs
        body_parts = [greeting, opening]
        if skills_text:
            body_parts.append(skills_text)
        if exp_text:
            body_parts.append(exp_text)
        body_parts.extend([closing, contact_text, signature])
        
        body_text = "\n\n".join(filter(None, body_parts))
        body_html = self._text_to_html(body_text)
        
        return {
            "subject": subject,
            "html_body": body_html,
            "plain_body": body_text,
            "model_meta": {
                "model": "template",
                "tokens_used": 0,
                "response_type": "template"
            }
        }
    
    def _text_to_html(self, text: str) -> str:
        """Convert plain text to HTML."""
        paragraphs = text.split('\n\n')
        html_paragraphs = [f"<p>{para.replace(chr(10), '<br>')}</p>" for para in paragraphs if para.strip()]
        return "\n".join(html_paragraphs)
    
    def _html_to_text(self, html: str) -> str:
        """Convert HTML to plain text."""
        # Simple HTML to text conversion
        text = re.sub(r'<br\s*/?>', '\n', html)
        text = re.sub(r'</p>', '\n\n', text)
        text = re.sub(r'<[^>]+>', '', text)
        return text.strip()