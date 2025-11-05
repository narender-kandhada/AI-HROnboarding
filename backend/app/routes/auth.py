from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.security import verify_password, hash_password, encrypt_password, decrypt_password
from app.utils.token import create_access_token
from app.dependencies import get_current_hr_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["auth"])

class PasswordResetRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str

@router.get("/me")
def get_current_user(
    current_hr_user = Depends(get_current_hr_user)
):
    """
    Get current logged-in HR user details
    """
    role = "HR"
    if hasattr(current_hr_user, 'employee') and current_hr_user.employee:
        role = getattr(current_hr_user.employee, 'role', 'HR')
    
    return {
        "name": current_hr_user.name,
        "email": current_hr_user.email,
        "role": role,
        "department": current_hr_user.department,
        "emp_id": current_hr_user.emp_id
    }

@router.post("/reset-password")
def reset_password(
    reset_data: PasswordResetRequest,
    db: Session = Depends(get_db),
    current_hr_user = Depends(get_current_hr_user)
):
    """
    Reset HR password - requires authentication token and old password verification
    User can only reset their own password
    """
    # Get current HR user (from token)
    # Note: get_current_hr_user returns HREmployee object with it_account
    if not hasattr(current_hr_user, 'it_account'):
        raise HTTPException(status_code=500, detail="Could not retrieve IT account")
    
    it_account = current_hr_user.it_account
    employee = current_hr_user.employee
    
    # Validate inputs
    if not reset_data.old_password:
        raise HTTPException(status_code=400, detail="Old password is required")
    
    if not reset_data.new_password:
        raise HTTPException(status_code=400, detail="New password is required")
    
    if len(reset_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long")
    
    if reset_data.new_password != reset_data.confirm_password:
        raise HTTPException(status_code=400, detail="New password and confirm password do not match")
    
    if reset_data.old_password == reset_data.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from old password")
    
    # Verify old password
    old_password_valid = False
    
    # Try hash verification first
    try:
        old_password_valid = verify_password(reset_data.old_password, it_account.company_password)
    except Exception:
        # Try decryption (old encrypted format)
        try:
            decrypted_password = decrypt_password(it_account.company_password)
            if decrypted_password:
                old_password_valid = (decrypted_password == reset_data.old_password)
        except Exception:
            old_password_valid = False
    
    if not old_password_valid:
        raise HTTPException(status_code=401, detail="Old password is incorrect")
    
    # Update password (hash it)
    hashed_password = hash_password(reset_data.new_password)
    encrypted_password = encrypt_password(reset_data.new_password)  # Optional for email sharing
    
    # Update in database
    it_account.company_password = hashed_password
    it_account.company_password_encrypted = encrypted_password
    it_account.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(it_account)
    
    return {
        "message": "Password reset successfully",
        "email": it_account.company_email
    }