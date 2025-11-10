import os
import re
import PyPDF2
import docx
from typing import Dict, Any, List
import json

class DocumentParser:
    def __init__(self):
        self.contact_patterns = {
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'phone': re.compile(r'(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}'),
            'linkedin': re.compile(r'linkedin\.com/in/[\w-]+', re.IGNORECASE),
            'github': re.compile(r'github\.com/[\w-]+', re.IGNORECASE)
        }
        
        self.section_patterns = {
            'experience': re.compile(r'\b(experience|work experience|employment|career|professional experience)\b', re.IGNORECASE),
            'education': re.compile(r'\b(education|academic|qualifications|degrees)\b', re.IGNORECASE),
            'skills': re.compile(r'\b(skills|technical skills|competencies|abilities|proficiencies)\b', re.IGNORECASE),
            'summary': re.compile(r'\b(summary|profile|objective|about|overview)\b', re.IGNORECASE)
        }

    async def parse_document(self, file_path: str, content_type: str) -> Dict[str, Any]:
        """Parse document and extract structured data."""
        try:
            if content_type == "application/pdf":
                text = self._extract_pdf_text(file_path)
            elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                text = self._extract_docx_text(file_path)
            elif content_type == "text/plain":
                text = self._extract_txt_text(file_path)
            else:
                raise ValueError(f"Unsupported content type: {content_type}")
            
            return self._extract_structured_data(text)
            
        except Exception as e:
            raise Exception(f"Document parsing failed: {str(e)}")

    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file."""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            raise Exception(f"PDF extraction failed: {str(e)}")
        
        if not text.strip():
            raise Exception("PDF appears to be empty or scanned (OCR not implemented)")
        
        return text

    def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file."""
        try:
            doc = docx.Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise Exception(f"DOCX extraction failed: {str(e)}")

    def _extract_txt_text(self, file_path: str) -> str:
        """Extract text from TXT file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except UnicodeDecodeError:
            try:
                with open(file_path, 'r', encoding='latin-1') as file:
                    return file.read()
            except Exception as e:
                raise Exception(f"TXT extraction failed: {str(e)}")

    def _extract_structured_data(self, text: str) -> Dict[str, Any]:
        """Extract structured data from text."""
        lines = text.split('\n')
        
        # Extract contact information
        contact = self._extract_contact_info(text)
        
        # Extract sections
        sections = self._identify_sections(lines)
        
        # Extract skills
        skills = self._extract_skills(sections.get('skills', []))
        
        # Extract experience
        experiences = self._extract_experiences(sections.get('experience', []))
        
        # Extract education
        education = self._extract_education(sections.get('education', []))
        
        # Create summary
        summary = self._create_summary(text, contact, skills, experiences)
        
        return {
            "contact": contact,
            "skills": skills,
            "experiences": experiences,
            "education": education,
            "summary": summary,
            "raw_text": text[:2000]  # First 2000 chars for reference
        }

    def _extract_contact_info(self, text: str) -> Dict[str, Any]:
        """Extract contact information."""
        contact = {}
        
        # Extract email
        email_matches = self.contact_patterns['email'].findall(text)
        if email_matches:
            contact['email'] = email_matches[0]
        
        # Extract phone
        phone_matches = self.contact_patterns['phone'].findall(text)
        if phone_matches:
            # Clean up phone number
            phone = re.sub(r'[^\d+]', '', phone_matches[0])
            contact['phone'] = phone_matches[0]
        
        # Extract LinkedIn
        linkedin_matches = self.contact_patterns['linkedin'].findall(text)
        if linkedin_matches:
            contact['linkedin'] = f"https://{linkedin_matches[0]}"
        
        # Extract GitHub
        github_matches = self.contact_patterns['github'].findall(text)
        if github_matches:
            contact['github'] = f"https://{github_matches[0]}"
        
        # Extract name (first non-empty line, heuristic)
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if lines:
            first_line = lines[0]
            # If it looks like a name (not email, phone, etc.)
            if not any(pattern.search(first_line) for pattern in self.contact_patterns.values()):
                if len(first_line.split()) <= 4 and len(first_line) <= 50:
                    contact['name'] = first_line
        
        return contact

    def _identify_sections(self, lines: List[str]) -> Dict[str, List[str]]:
        """Identify and extract different sections of the resume."""
        sections = {}
        current_section = None
        section_content = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line is a section header
            section_found = None
            for section_name, pattern in self.section_patterns.items():
                if pattern.search(line):
                    section_found = section_name
                    break
            
            if section_found:
                # Save previous section
                if current_section and section_content:
                    sections[current_section] = section_content
                
                # Start new section
                current_section = section_found
                section_content = []
            elif current_section:
                section_content.append(line)
        
        # Save last section
        if current_section and section_content:
            sections[current_section] = section_content
        
        return sections

    def _extract_skills(self, skill_lines: List[str]) -> List[str]:
        """Extract skills from skill section."""
        skills = []
        
        # Common skill separators
        separators = [',', '•', '·', '|', ';', '\n']
        
        text = ' '.join(skill_lines)
        
        # Split by common separators
        skill_candidates = []
        for separator in separators:
            if separator in text:
                skill_candidates.extend(text.split(separator))
                break
        else:
            # If no separators found, split by whitespace
            skill_candidates = text.split()
        
        # Clean and filter skills
        for skill in skill_candidates:
            skill = skill.strip()
            if skill and len(skill) > 1 and len(skill) < 30:
                # Remove common prefixes/suffixes
                skill = re.sub(r'^(proficient in|experience with|knowledge of)\s*', '', skill, flags=re.IGNORECASE)
                skill = skill.strip('.,;:')
                if skill:
                    skills.append(skill)
        
        return skills[:20]  # Limit to 20 skills

    def _extract_experiences(self, experience_lines: List[str]) -> List[Dict[str, Any]]:
        """Extract work experience entries."""
        experiences = []
        
        # Look for job titles, companies, dates
        date_pattern = re.compile(r'\b(\d{4}|\w+\s+\d{4}|\d{1,2}/\d{4})\b')
        
        current_experience = {}
        for line in experience_lines[:20]:  # Limit processing
            # Check for dates
            dates = date_pattern.findall(line)
            if dates:
                if current_experience:
                    experiences.append(current_experience)
                current_experience = {
                    'title': '',
                    'company': '',
                    'start': dates[0] if len(dates) > 0 else '',
                    'end': dates[1] if len(dates) > 1 else dates[0] if len(dates) == 1 else '',
                    'description': line,
                    'highlights': []
                }
            elif line and current_experience:
                # Add to description or highlights
                if len(line) > 50:
                    current_experience['highlights'].append(line)
                else:
                    if not current_experience['title']:
                        current_experience['title'] = line
                    elif not current_experience['company']:
                        current_experience['company'] = line
        
        if current_experience:
            experiences.append(current_experience)
        
        return experiences[:5]  # Limit to 5 experiences

    def _extract_education(self, education_lines: List[str]) -> List[Dict[str, Any]]:
        """Extract education entries."""
        education = []
        
        date_pattern = re.compile(r'\b(\d{4}|\w+\s+\d{4})\b')
        
        for line in education_lines[:10]:  # Limit processing
            dates = date_pattern.findall(line)
            if dates or any(keyword in line.lower() for keyword in ['university', 'college', 'degree', 'bachelor', 'master', 'phd']):
                education.append({
                    'degree': '',
                    'institution': line,
                    'start': dates[0] if len(dates) > 0 else '',
                    'end': dates[1] if len(dates) > 1 else dates[0] if len(dates) == 1 else '',
                    'gpa': ''
                })
        
        return education[:3]  # Limit to 3 education entries

    def _create_summary(self, text: str, contact: Dict, skills: List[str], experiences: List[Dict]) -> str:
        """Create a brief summary of the candidate."""
        # Extract first few sentences that look like a summary
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        summary_lines = []
        for line in lines[:10]:  # Check first 10 lines
            # Skip contact info lines
            if any(self.contact_patterns[key].search(line) for key in self.contact_patterns):
                continue
            # Skip section headers
            if any(pattern.search(line) for pattern in self.section_patterns.values()):
                continue
            # If line is substantial
            if len(line) > 30 and not line.isupper():
                summary_lines.append(line)
                if len(' '.join(summary_lines)) > 200:
                    break
        
        if summary_lines:
            return ' '.join(summary_lines)[:500]
        
        # Fallback: create summary from extracted data
        name = contact.get('name', 'Candidate')
        skill_list = ', '.join(skills[:5]) if skills else 'various technologies'
        exp_count = len(experiences)
        
        return f"{name} is a professional with experience in {skill_list}. Has {exp_count} work experience entries in their background."