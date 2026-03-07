from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import false, true
from sqlalchemy.orm import Session, joinedload
from app.models import Employee, ITAccount
from app.database import get_db
from dotenv import load_dotenv
from app import models
import os

load_dotenv()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/hr-login")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
DEFAULT_HR_EMAIL = os.getenv("DEFAULT_HR_EMAIL", "test@user.com")

def get_current_hr_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Get current HR user from JWT token - uses IT accounts with HR department.
    Also supports default HR admin when database is empty.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        company_email = payload.get("sub")
        if company_email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Handle default HR admin (works without database data)
    if payload.get("is_default_hr") and company_email == DEFAULT_HR_EMAIL:
        class HREmployee:
            def __init__(self):
                self.emp_id = "DEFAULT_HR"
                self.email = DEFAULT_HR_EMAIL
                self.name = "HR Admin"
                self.department = "HR"
                self.employee = None
                self.it_account = None
        return HREmployee()

    # Find employee by company_email from IT accounts
    it_account = (
        db.query(models.ITAccount)
        .join(models.Employee)
        .filter(models.ITAccount.company_email == company_email)
        .options(joinedload(models.ITAccount.employee))
        .first()
    )
    
    if not it_account:
        raise HTTPException(status_code=401, detail="Invalid token - account not found")
    
    employee = it_account.employee
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Verify employee belongs to HR department
    if not employee.department or employee.department.upper() != "HR":
        raise HTTPException(
            status_code=403, 
            detail="Access denied. Only HR department employees can access this resource."
        )
    
    # Return employee object (with it_account for backward compatibility)
    # Create a simple object that mimics HR structure for compatibility
    class HREmployee:
        def __init__(self, employee, it_account):
            self.emp_id = employee.emp_id
            self.email = it_account.company_email
            self.name = employee.name
            self.department = employee.department
            self.employee = employee
            self.it_account = it_account
    
    return HREmployee(employee, it_account)

def complete_task(db: Session, employee_id: str, title: str):
    task = db.query(models.Task).filter_by(
        assigned_to_id=employee_id,
        title=title
    ).first()
    if task and task.status != "completed":
        task.status = "completed"
        db.commit()
        return True
    return False
