from fastapi import APIRouter, Depends, Form, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.database import get_db
from app import models
from app.utils.token import SECRET_KEY, ALGORITHM
from app.utils.email import send_onboarding_email
from sqlalchemy.orm import Session
import os
import uuid

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/hr-login")
router = APIRouter(prefix="/pre-onboarding", tags=["pre-onboarding"])

def get_current_hr(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/")
def pre_onboard_employee(
    emp_id: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    db: Session = Depends(get_db),
    hr_email: str = Depends(get_current_hr)
):
    # Check if emp_id already exists
    existing = db.query(models.Employee).filter(models.Employee.emp_id == emp_id.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Employee with emp_id '{emp_id}' already exists")
    
    # 1. Create employee record
    employee = models.Employee(emp_id=emp_id.upper(), name=name, email=email)
    db.add(employee)
    db.commit()
    db.refresh(employee)

    # 2. Generate folder name and path
    safe_name = name.strip().lower().replace(" ", "-")
    unique_id = str(uuid.uuid4())
    folder_name = f"{safe_name}-{unique_id}"
    folder_path = os.path.join("uploads", folder_name)

    # 3. Create folder
    try:
        os.makedirs(folder_path, exist_ok=True)
        print(f"📁 Created folder: {folder_path}")
    except Exception as e:
        print(f"❌ Folder creation failed: {e}")
        raise HTTPException(status_code=500, detail="Could not create employee folder")

    # 4. Save folder name to DB
    employee.folder_name = folder_name
    db.commit()

    # 5. Send onboarding email
    onboarding_link = f"http://localhost:3000/onboarding/{employee.emp_id}" 
    nda_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../assets/NDA Form.pdf"))

    try:
        send_onboarding_email(
            hr_email=hr_email,
            hr_name="HR Team",
            to_email=email,
            employee_name=name,
            link=onboarding_link,
            nda_path=nda_path
        )
    except Exception as e:
        print(f"❌ Failed to send onboarding email: {e}")

    # 6. Return response
    return {
        "status": "email_sent",
        "employee_id": employee.emp_id,
        "folder_name": folder_name,
        "onboarding_link": onboarding_link
    }

