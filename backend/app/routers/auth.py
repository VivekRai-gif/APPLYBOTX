from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
import httpx
from typing import Optional

from app.database import get_db
from app.models.database import User, OAuthAccount
from app.models.schemas import UserCreate, UserResponse, UserLogin, Token, TokenData, OAuthAccountResponse
from app.config import settings
from app.services.oauth import GoogleOAuth, MicrosoftOAuth
from app.services.encryption import encrypt_token, decrypt_token

router = APIRouter()

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password) if user.password else None
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        name=user.name,
        is_oauth_user=user.password is None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

# Routes
@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    return create_user(db=db, user=user)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# OAuth Routes
@router.get("/oauth/google/start")
async def google_oauth_start():
    if not settings.google_client_id:
        raise HTTPException(status_code=400, detail="Google OAuth not configured")
    
    oauth = GoogleOAuth()
    auth_url = oauth.get_authorization_url()
    return RedirectResponse(url=auth_url)

@router.get("/oauth/google/callback")
async def google_oauth_callback(code: str, db: Session = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(status_code=400, detail="Google OAuth not configured")
    
    try:
        oauth = GoogleOAuth()
        tokens = await oauth.exchange_code_for_tokens(code)
        user_info = await oauth.get_user_info(tokens['access_token'])
        
        # Check if user exists
        user = get_user_by_email(db, user_info['email'])
        if not user:
            # Create new user
            user_create = UserCreate(
                email=user_info['email'],
                name=user_info.get('name'),
                password=None  # OAuth user
            )
            user = create_user(db, user_create)
        
        # Store or update OAuth account
        oauth_account = db.query(OAuthAccount).filter(
            OAuthAccount.user_id == user.id,
            OAuthAccount.provider == "google"
        ).first()
        
        if oauth_account:
            # Update existing account
            oauth_account.access_token_encrypted = encrypt_token(tokens['access_token'])
            oauth_account.refresh_token_encrypted = encrypt_token(tokens.get('refresh_token', ''))
            oauth_account.token_expiry = datetime.utcnow() + timedelta(seconds=tokens.get('expires_in', 3600))
            oauth_account.updated_at = datetime.utcnow()
        else:
            # Create new OAuth account
            oauth_account = OAuthAccount(
                user_id=user.id,
                provider="google",
                provider_user_id=user_info['id'],
                email=user_info['email'],
                access_token_encrypted=encrypt_token(tokens['access_token']),
                refresh_token_encrypted=encrypt_token(tokens.get('refresh_token', '')),
                scopes=tokens.get('scope', ''),
                token_expiry=datetime.utcnow() + timedelta(seconds=tokens.get('expires_in', 3600))
            )
            db.add(oauth_account)
        
        db.commit()
        
        # Create session token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        # Redirect to frontend with token
        return RedirectResponse(url=f"{settings.frontend_url}/auth/callback?token={access_token}")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth callback failed: {str(e)}")

@router.get("/oauth/microsoft/start")
async def microsoft_oauth_start():
    if not settings.microsoft_client_id:
        raise HTTPException(status_code=400, detail="Microsoft OAuth not configured")
    
    oauth = MicrosoftOAuth()
    auth_url = oauth.get_authorization_url()
    return RedirectResponse(url=auth_url)

@router.get("/oauth/microsoft/callback")
async def microsoft_oauth_callback(code: str, db: Session = Depends(get_db)):
    if not settings.microsoft_client_id:
        raise HTTPException(status_code=400, detail="Microsoft OAuth not configured")
    
    try:
        oauth = MicrosoftOAuth()
        tokens = await oauth.exchange_code_for_tokens(code)
        user_info = await oauth.get_user_info(tokens['access_token'])
        
        # Similar logic as Google OAuth...
        # (Implementation would be similar to Google callback)
        
        return {"message": "Microsoft OAuth callback - implementation needed"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth callback failed: {str(e)}")

@router.get("/email/accounts", response_model=list[OAuthAccountResponse])
async def get_connected_accounts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    accounts = db.query(OAuthAccount).filter(OAuthAccount.user_id == current_user.id).all()
    return accounts

@router.delete("/email/accounts/{account_id}")
async def disconnect_account(account_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = db.query(OAuthAccount).filter(
        OAuthAccount.id == account_id,
        OAuthAccount.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    db.delete(account)
    db.commit()
    
    return {"message": "Account disconnected successfully"}