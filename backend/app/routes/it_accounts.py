from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ITAccount, Employee
from app.dependencies import get_current_hr_user
from app.utils.security import encrypt_password, decrypt_password, hash_password, verify_password
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/it-accounts", tags=["it-accounts"])

class ITAccountCreate(BaseModel):
    employee_id: str
    company_email: EmailStr
    company_password: str

class ITAccountUpdate(BaseModel):
    company_email: Optional[str] = None  # Changed from EmailStr to str for more flexibility
    company_password: Optional[str] = None
    
    class Config:
        # Allow empty body or at least one field
        pass

@router.get("/")
def get_all_it_accounts(
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Get all IT accounts (HR only)"""
    accounts = db.query(ITAccount).all()
    result = []
    for acc in accounts:
        employee = db.query(Employee).filter(Employee.emp_id == acc.employee_id).first()
        result.append({
            "id": acc.id,
            "employee_id": acc.employee_id,
            "employee_name": employee.name if employee else "Unknown",
            "company_email": acc.company_email,
            "created_at": acc.created_at,
            "updated_at": acc.updated_at
        })
    return result

@router.get("/employee/{employee_id}")
def get_employee_it_account(
    employee_id: str,
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Get IT account for specific employee (HR only)"""
    # Allow HR to view IT accounts even if employee is disabled (for management purposes)
    account = db.query(ITAccount).filter(ITAccount.employee_id == employee_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="IT account not found")
    
    employee = db.query(Employee).filter(Employee.emp_id == employee_id).first()
    return {
        "id": account.id,
        "employee_id": account.employee_id,
        "employee_name": employee.name if employee else "Unknown",
        "company_email": account.company_email,
        "created_at": account.created_at,
        "updated_at": account.updated_at
    }

@router.get("/employee/{employee_id}/password")
def get_employee_password(
    employee_id: str,
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Get password for employee (HR only) - returns encrypted version if available"""
    # Check if employee is disabled
    employee = db.query(Employee).filter(Employee.emp_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if employee.status == "disabled":
        raise HTTPException(status_code=403, detail="Cannot access IT account for disabled employee")
    
    account = db.query(ITAccount).filter(ITAccount.employee_id == employee_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="IT account not found")
    
    # Try to decrypt if encrypted version exists
    decrypted_password = None
    if account.company_password_encrypted:
        decrypted_password = decrypt_password(account.company_password_encrypted)
    
    return {
        "employee_name": employee.name if employee else "Unknown",
        "company_email": account.company_email,
        "company_password": decrypted_password,  # Will be None if not encrypted
        "note": "Password is stored hashed for security. Encrypted version available only if created with encryption."
    }

@router.post("/")
def create_it_account(
    account_data: ITAccountCreate,
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Create IT account for employee (HR only)"""
    # Check if employee exists
    employee = db.query(Employee).filter(Employee.emp_id == account_data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if account already exists
    existing = db.query(ITAccount).filter(ITAccount.employee_id == account_data.employee_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="IT account already exists for this employee")
    
    # Hash password for login verification (secure, one-way)
    hashed_password = hash_password(account_data.company_password)
    
    # Optionally encrypt for email sharing (if you need to send password via email)
    encrypted_password = encrypt_password(account_data.company_password)
    
    # Create account
    new_account = ITAccount(
        employee_id=account_data.employee_id,
        company_email=account_data.company_email,
        company_password=hashed_password,  # Hashed for login
        company_password_encrypted=encrypted_password  # Encrypted for email sharing (optional)
    )
    
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    
    # Send email credentials to employee (use plain password from input, not decrypted)
    try:
        from app.utils.email import send_email_credentials
        send_email_credentials(
            to_email=employee.email,
            employee_name=employee.name,
            company_email=account_data.company_email,
            company_password=account_data.company_password  # Use plain password from input
        )
        print(f"✅ Email credentials sent to {employee.email}")
    except Exception as e:
        print(f"⚠️ Failed to send email credentials: {e}")
        # Don't fail the request if email fails
    
    return {"message": "IT account created successfully", "account_id": new_account.id}

@router.put("/employee/{employee_id}")
def update_it_account(
    employee_id: str,
    account_data: ITAccountUpdate,
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Update IT account for employee (HR only)"""
    account = db.query(ITAccount).filter(ITAccount.employee_id == employee_id).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="IT account not found")
    
    # Check if at least one field is provided
    if account_data.company_email is None and account_data.company_password is None:
        raise HTTPException(
            status_code=422, 
            detail="At least one field (company_email or company_password) must be provided for update"
        )
    
    # Validate and update email
    if account_data.company_email is not None:
        # Validate email format
        from email_validator import validate_email, EmailNotValidError
        try:
            valid = validate_email(account_data.company_email)
            account.company_email = valid.email
        except EmailNotValidError as e:
            raise HTTPException(status_code=422, detail=f"Invalid email format: {str(e)}")
    
    # Update password
    if account_data.company_password is not None:
        if not account_data.company_password.strip():
            raise HTTPException(status_code=422, detail="Password cannot be empty")
        # Hash password for login verification
        account.company_password = hash_password(account_data.company_password)
        # Optionally encrypt for later retrieval/email
        account.company_password_encrypted = encrypt_password(account_data.company_password)
    
    account.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(account)
    
    return {"message": "IT account updated successfully"}

@router.delete("/employee/{employee_id}")
def delete_it_account(
    employee_id: str,
    db: Session = Depends(get_db),
    hr_user = Depends(get_current_hr_user)
):
    """Delete IT account (HR only)"""
    account = db.query(ITAccount).filter(ITAccount.employee_id == employee_id).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="IT account not found")
    
    db.delete(account)
    db.commit()
    
    return {"message": "IT account deleted successfully"}
