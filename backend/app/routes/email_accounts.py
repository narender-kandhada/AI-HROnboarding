from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import EmailAccount
from app.dependencies import get_current_hr_user
from app.utils.security import encrypt_password, decrypt_password, hash_password, verify_password
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/email-accounts", tags=["email-accounts"])

class EmailAccountCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None
    is_default: Optional[str] = "no"
    notes: Optional[str] = None

class EmailAccountUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    display_name: Optional[str] = None
    is_default: Optional[str] = None
    notes: Optional[str] = None

@router.get("/")
def get_all_email_accounts(
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Get all email accounts (HR only)"""
    accounts = db.query(EmailAccount).all()
    return [
        {
            "id": acc.id,
            "email": acc.email,
            "display_name": acc.display_name,
            "is_default": acc.is_default,
            "created_at": acc.created_at,
            "updated_at": acc.updated_at,
            "notes": acc.notes
        }
        for acc in accounts
    ]

@router.get("/default")
def get_default_email_account(
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Get default email account (HR only)"""
    account = db.query(EmailAccount).filter(EmailAccount.is_default == "yes").first()
    if not account:
        # Return first account if no default set
        account = db.query(EmailAccount).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="No email accounts configured")
    
    return {
        "id": account.id,
        "email": account.email,
        "display_name": account.display_name,
        "is_default": account.is_default
    }

@router.post("/")
def create_email_account(
    account_data: EmailAccountCreate,
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Create new email account (HR only)"""
    # Check if email already exists
    existing = db.query(EmailAccount).filter(EmailAccount.email == account_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email account already exists")
    
    # If this is set as default, unset all other defaults
    if account_data.is_default == "yes":
        db.query(EmailAccount).filter(EmailAccount.is_default == "yes").update({"is_default": "no"})
        db.commit()
    
    # Encrypt password using Fernet (symmetric encryption for email sending)
    try:
        encrypted_password = encrypt_password(account_data.password)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to encrypt password: {str(e)}. Please ensure IT_ENCRYPTION_KEY is set in .env")
    
    # Create account
    new_account = EmailAccount(
        email=account_data.email,
        password=encrypted_password,
        display_name=account_data.display_name,
        is_default=account_data.is_default,
        notes=account_data.notes
    )
    
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    
    return {"message": "Email account created successfully", "account_id": new_account.id}

@router.put("/{account_id}")
def update_email_account(
    account_id: int,
    account_data: EmailAccountUpdate,
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Update email account (HR only)"""
    account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    # Update fields
    if account_data.email is not None:
        # Check if new email already exists
        existing = db.query(EmailAccount).filter(
            EmailAccount.email == account_data.email,
            EmailAccount.id != account_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
        account.email = account_data.email
    
    if account_data.password is not None:
        try:
            account.password = encrypt_password(account_data.password)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to encrypt password: {str(e)}. Please ensure IT_ENCRYPTION_KEY is set in .env")
    
    if account_data.display_name is not None:
        account.display_name = account_data.display_name
    
    if account_data.is_default is not None:
        # If setting as default, unset all other defaults
        if account_data.is_default == "yes":
            db.query(EmailAccount).filter(
                EmailAccount.is_default == "yes",
                EmailAccount.id != account_id
            ).update({"is_default": "no"})
            db.commit()
        account.is_default = account_data.is_default
    
    if account_data.notes is not None:
        account.notes = account_data.notes
    
    account.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(account)
    
    return {"message": "Email account updated successfully"}

@router.post("/{account_id}/set-default")
def set_default_email_account(
    account_id: int,
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Set email account as default (HR only)"""
    account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    # Unset all other defaults
    db.query(EmailAccount).filter(EmailAccount.is_default == "yes").update({"is_default": "no"})
    db.commit()
    
    # Set this as default
    account.is_default = "yes"
    account.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(account)
    
    return {"message": f"Email account {account.email} set as default"}

@router.delete("/{account_id}")
def delete_email_account(
    account_id: int,
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Delete email account (HR only)"""
    account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    # Don't allow deleting if it's the only account
    total_accounts = db.query(EmailAccount).count()
    if total_accounts <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the only email account")
    
    db.delete(account)
    db.commit()
    
    # If deleted account was default, set first account as default
    if account.is_default == "yes":
        first_account = db.query(EmailAccount).first()
        if first_account:
            first_account.is_default = "yes"
            db.commit()
    
    return {"message": "Email account deleted successfully"}

@router.get("/{account_id}/verify-password")
def verify_email_account_password(
    account_id: int,
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Verify that email account password can be decrypted correctly (HR only)"""
    account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    # Try to decrypt password
    try:
        decrypted_password = decrypt_password(account.password)
        if decrypted_password:
            return {
                "status": "success",
                "message": "Password can be decrypted successfully",
                "email": account.email,
                "password_length": len(decrypted_password),
                "note": "Password is stored encrypted and can be retrieved for email sending"
            }
        else:
            raise HTTPException(status_code=500, detail="Password decryption returned None")
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Could not decrypt password: {str(e)}. Please ensure IT_ENCRYPTION_KEY is set correctly in .env file."
        )

@router.get("/{account_id}/test")
def test_email_account(
    account_id: int,
    test_email: str,
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Test email account by sending a test email (HR only)"""
    account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Email account not found")
    
    # Decrypt password for email sending
    try:
        decrypted_password = decrypt_password(account.password)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Could not decrypt password: {str(e)}. Please ensure IT_ENCRYPTION_KEY is set correctly in .env file."
        )
    
    # Send test email
    from app.utils.email import send_email_with_hostinger
    
    try:
        send_email_with_hostinger(
            from_email=account.email,
            from_password=decrypted_password,
            to_email=test_email,
            subject="Test Email from Sumeru Digitals",
            body=f"<p>This is a test email from {account.email}.</p><p>If you received this, the email configuration is working correctly!</p>"
        )
        return {"message": f"Test email sent successfully to {test_email}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send test email: {str(e)}")

