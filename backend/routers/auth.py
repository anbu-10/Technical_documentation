import uuid
import json
import secrets
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.config import settings
from backend.models import User, EmailVerificationToken, PasswordResetToken, AuditEvent
from backend.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserDetailResponse,
    UserProfileUpdate,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest
)
from backend.services.auth import (
    hash_password,
    verify_password,
    create_access_token,
    check_rate_limit,
    log_audit_event,
    get_current_user,
    get_current_active_user
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Accounts"])

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def parse_user_notification_prefs(user: User) -> dict:
    if not user.notification_preferences_json:
        return {"email_notifications": True, "security_alerts": True}
    try:
        return json.loads(user.notification_preferences_json)
    except Exception:
        return {"email_notifications": True, "security_alerts": True}

@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegisterRequest, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    if not check_rate_limit(f"reg:{ip}", max_requests=10, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again in a few moments."
        )

    # Password validation
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    # Duplicate email check
    email_clean = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        log_audit_event(db, "auth.register_duplicate", user_email=email_clean, ip_address=ip, status="failed")
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    # Create new user
    new_user = User(
        email=email_clean,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role="user",
        is_active=True,
        is_verified=False,
        theme="dark"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate real Email Verification Token (24 hour expiration)
    verify_token_str = secrets.token_urlsafe(32)
    verify_token = EmailVerificationToken(
        user_id=new_user.id,
        token=verify_token_str,
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    )
    db.add(verify_token)
    db.commit()

    # Log verification link for development/audit
    verify_url = f"{settings.APP_URL}/verify-email?token={verify_token_str}"
    log_audit_event(
        db,
        "auth.register",
        user_id=new_user.id,
        user_email=new_user.email,
        ip_address=ip,
        status="success",
        details={"verification_url": verify_url}
    )

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserDetailResponse(
            id=new_user.id,
            email=new_user.email,
            full_name=new_user.full_name,
            role=new_user.role,
            is_active=new_user.is_active,
            is_verified=new_user.is_verified,
            avatar_url=new_user.avatar_url,
            theme=new_user.theme,
            preferred_provider=new_user.preferred_provider,
            notification_preferences=parse_user_notification_prefs(new_user),
            created_at=new_user.created_at,
            updated_at=new_user.updated_at
        )
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    if not check_rate_limit(f"login:{ip}", max_requests=15, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again shortly."
        )

    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        log_audit_event(db, "auth.login_failed", user_email=email_clean, ip_address=ip, status="failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        log_audit_event(db, "auth.login_inactive", user_id=user.id, user_email=email_clean, ip_address=ip, status="failed")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact support."
        )

    # Calculate token duration based on remember_me
    delta = datetime.timedelta(days=30) if payload.remember_me else datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role}, expires_delta=delta)

    log_audit_event(db, "auth.login", user_id=user.id, user_email=user.email, ip_address=ip, status="success")

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserDetailResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            is_active=user.is_active,
            is_verified=user.is_verified,
            avatar_url=user.avatar_url,
            theme=user.theme,
            preferred_provider=user.preferred_provider,
            notification_preferences=parse_user_notification_prefs(user),
            created_at=user.created_at,
            updated_at=user.updated_at
        )
    )

@router.get("/me", response_model=UserDetailResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return UserDetailResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        avatar_url=current_user.avatar_url,
        theme=current_user.theme,
        preferred_provider=current_user.preferred_provider,
        notification_preferences=parse_user_notification_prefs(current_user),
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )

@router.put("/profile", response_model=UserDetailResponse)
def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if payload.full_name is not None:
        name_clean = payload.full_name.strip()
        if len(name_clean) < 2:
            raise HTTPException(status_code=400, detail="Full name must be at least 2 characters.")
        current_user.full_name = name_clean

    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    if payload.theme is not None:
        current_user.theme = payload.theme

    if payload.preferred_provider is not None:
        current_user.preferred_provider = payload.preferred_provider

    if payload.notification_preferences is not None:
        current_user.notification_preferences_json = json.dumps(payload.notification_preferences)

    current_user.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    log_audit_event(db, "user.update_profile", user_id=current_user.id, user_email=current_user.email, status="success")

    return UserDetailResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        avatar_url=current_user.avatar_url,
        theme=current_user.theme,
        preferred_provider=current_user.preferred_provider,
        notification_preferences=parse_user_notification_prefs(current_user),
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect.")

    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long.")

    current_user.hashed_password = hash_password(payload.new_password)
    current_user.updated_at = datetime.datetime.utcnow()
    db.commit()

    log_audit_event(db, "user.change_password", user_id=current_user.id, user_email=current_user.email, status="success")
    return {"message": "Password updated successfully."}

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    if not check_rate_limit(f"forgot:{ip}", max_requests=5, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many password reset requests. Please try again later.")

    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    # Generic response for privacy/anti-enumeration
    success_msg = "If an account with that email exists, we've sent password reset instructions."

    if not user:
        return {"message": success_msg}

    # Generate real expiring PasswordResetToken (1 hour expiration)
    token_str = secrets.token_urlsafe(32)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token_str,
        expires_at=datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    )
    db.add(reset_token)
    db.commit()

    reset_url = f"{settings.APP_URL}/reset-password?token={token_str}"
    log_audit_event(
        db,
        "auth.forgot_password",
        user_id=user.id,
        user_email=user.email,
        ip_address=ip,
        status="success",
        details={"reset_url": reset_url}
    )

    return {"message": success_msg, "reset_token_dev": token_str if settings.DEBUG else None}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    token_record = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == payload.token,
        PasswordResetToken.is_used == False
    ).first()

    if not token_record or token_record.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired password reset link.")

    user = token_record.user
    if not user:
        raise HTTPException(status_code=400, detail="User associated with token not found.")

    user.hashed_password = hash_password(payload.new_password)
    user.updated_at = datetime.datetime.utcnow()
    token_record.is_used = True
    db.commit()

    log_audit_event(db, "auth.reset_password", user_id=user.id, user_email=user.email, ip_address=ip, status="success")
    return {"message": "Password reset successfully. You may now sign in."}

@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, request: Request, db: Session = Depends(get_db)):
    ip = get_client_ip(request)
    token_record = db.query(EmailVerificationToken).filter(
        EmailVerificationToken.token == payload.token,
        EmailVerificationToken.is_used == False
    ).first()

    if not token_record or token_record.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired email verification token.")

    user = token_record.user
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.is_verified = True
    token_record.is_used = True
    db.commit()

    log_audit_event(db, "auth.verify_email", user_id=user.id, user_email=user.email, ip_address=ip, status="success")
    return {"message": "Email address verified successfully!"}

@router.delete("/account")
def delete_account(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id
    user_email = current_user.email
    db.delete(current_user)
    db.commit()

    log_audit_event(db, "user.delete_account", user_id=user_id, user_email=user_email, status="success")
    return {"message": "Account and all associated documents deleted successfully."}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_audit_event(db, "auth.logout", user_id=current_user.id, user_email=current_user.email, status="success")
    return {"message": "Logged out successfully."}
