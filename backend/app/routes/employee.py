from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from app import models, schemas
from app.database import get_db
from app.utils.email import send_onboarding_email
from app.dependencies import get_current_hr_user
from app.utils.document_parser import create_employee_folder
import os
import uuid
import re

router = APIRouter(prefix="/employees", tags=["employees"])

def normalize_department(dept):
    """Normalize department name to avoid duplicates"""
    if not dept:
        return None
    # Trim whitespace
    trimmed = dept.strip()
    if not trimmed:
        return None
    
    # Common department acronyms that should be all caps
    acronyms = ["HR", "IT", "AI", "ML", "UI", "UX", "QA", "R&D"]
    upper = trimmed.upper()
    if upper in acronyms:
        return upper
    
    # Otherwise, capitalize first letter of each word
    return " ".join(word.capitalize() for word in trimmed.split())

# Get all employees
@router.get("/")
def get_all_employees(db: Session = Depends(get_db)):
    """Get all employees with their personal info, tasks, and IT accounts"""
    employees = db.query(models.Employee).options(
        joinedload(models.Employee.personal_info),
        joinedload(models.Employee.tasks),
        joinedload(models.Employee.it_accounts)
    ).all()
    return employees

# Create employee and send onboarding email
@router.post("/", response_model=schemas.EmployeeCreate)
def create_employee(
    employee: schemas.EmployeeCreate,
    db: Session = Depends(get_db),
    current_hr_user = Depends(get_current_hr_user)
):
    # Check if emp_id already exists
    existing = db.query(models.Employee).filter(models.Employee.emp_id == employee.emp_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Employee with emp_id '{employee.emp_id}' already exists")
    
    db_employee = models.Employee(
        emp_id=employee.emp_id,
        name=employee.name,
        email=employee.email,
        role=employee.role,
        department=normalize_department(employee.department) if employee.department else None,
        status="pending",
        uuid_token=str(uuid.uuid4())
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)

    # 🔧 Create folder using utility
    try:
        folder_name = create_employee_folder(employee.name)
        print(f"📁 Created folder: {folder_name}")
    except Exception as e:
        print(f"❌ Folder creation failed: {e}")
        raise HTTPException(status_code=500, detail="Could not create employee folder")

    # 💾 Save folder name to DB
    db_employee.folder_name = folder_name
    db.commit()

    # Initialize onboarding tasks for the new employee
    task_titles = [
        "Personal Details",
        "Joining Day",
        "Training",
        "Department Introduction",
        "Feedback"
    ]

    for title in task_titles:
        task = models.Task(
            title=title,
            assigned_to_id=db_employee.emp_id,
            status="pending"
        )
        db.add(task)

    db.commit()

    # Construct onboarding dashboard link
    dashboard_link = f"{os.getenv('FRONTEND_BASE_URL')}/dashboard/{db_employee.uuid_token}"
    nda_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../assets/NDA Form.pdf"))

    try:
        send_onboarding_email(
            employee_name=db_employee.name,
            to_email=db_employee.email,
            link=dashboard_link,
            hr_email=current_hr_user.email,
            hr_name=current_hr_user.name,
            nda_path=nda_path
        )
    except Exception as e:
        print(f"❌ Failed to send onboarding email: {e}")

    return db_employee

# Get employee
@router.get("/{employee_id}")
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.emp_id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@router.get("/by-token/{token}")
def get_employee_by_token(token: str, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.uuid_token == token).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")
    if employee.status == "disabled":
        raise HTTPException(status_code=403, detail="Employee account is disabled. Please contact HR.")
    return employee

# Submit personal info with file uploads
@router.post("/by-token/{token}/personal-info")
async def submit_personal_info_by_token(
    token: str,
    role: str = Form(...),
    name: str = Form(...),
    dob: str = Form(...),
    gender: str = Form(...),
    mobile: str = Form(...),
    email: str = Form(...),
    family1_name: str = Form(...),
    family1_relation: str = Form(...),
    family1_mobile: str = Form(...),
    family2_name: str = Form(...),
    family2_relation: str = Form(...),
    family2_mobile: str = Form(...),
    aadhaar_number: str = Form(...),
    pan_number: str = Form(...),
    bank_number: str = Form(...),
    ifsc_code: str = Form(...),
    aadhaar_file: UploadFile = File(...),
    pan_file: UploadFile = File(...),
    bank_file: UploadFile = File(...),
    nda_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Check if employee is disabled
    employee = db.query(models.Employee).filter(models.Employee.uuid_token == token).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")
    if employee.status == "disabled":
        raise HTTPException(status_code=403, detail="Employee account is disabled. Please contact HR.")

    # Validation: Aadhaar must be exactly 12 digits
    aadhaar_cleaned = re.sub(r'\s', '', aadhaar_number)
    if not re.match(r'^\d{12}$', aadhaar_cleaned):
        raise HTTPException(status_code=400, detail="Aadhaar number must be exactly 12 digits")

    # Validation: PAN must be in format "XXXXX1234X"
    pan_cleaned = re.sub(r'\s', '', pan_number).upper()
    if not re.match(r'^[A-Z]{5}\d{4}[A-Z]$', pan_cleaned):
        raise HTTPException(status_code=400, detail="PAN number must be in format XXXXX1234X (5 letters, 4 digits, 1 letter)")

    # Validation: Check all files are PDFs
    files_to_check = [
        ("Aadhaar", aadhaar_file),
        ("PAN", pan_file),
        ("Bank", bank_file),
        ("NDA", nda_file)
    ]
    
    for file_label, file in files_to_check:
        if not file.filename:
            raise HTTPException(status_code=400, detail=f"{file_label} file is required")
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail=f"{file_label} file must be a PDF")

    employee_id = employee.emp_id

    # Route uploads into the employee's personal folder
    upload_dir = os.path.join(os.path.dirname(__file__), "../uploads", employee.folder_name)
    os.makedirs(upload_dir, exist_ok=True)

    # Check if existing personal info exists for file replacement
    existing_info = db.query(models.EmployeePersonalInfo).filter_by(employee_id=employee_id).first()
    
    # Delete existing files if they exist
    if existing_info:
        for old_file_path in [existing_info.aadhaar_file, existing_info.pan_file, existing_info.bank_file, existing_info.nda_file]:
            if old_file_path and os.path.exists(old_file_path):
                try:
                    os.remove(old_file_path)
                    print(f"✅ Deleted old file: {old_file_path}")
                except Exception as e:
                    print(f"⚠️ Could not delete old file {old_file_path}: {e}")

    # Use fixed filenames for replacement (using emp_id)
    safe_emp_id = employee_id.replace("/", "_").replace("\\", "_")  # Sanitize for filename
    aadhaar_path = os.path.join(upload_dir, f"{safe_emp_id}_aadhaar.pdf")
    pan_path = os.path.join(upload_dir, f"{safe_emp_id}_pan.pdf")
    bank_path = os.path.join(upload_dir, f"{safe_emp_id}_bank.pdf")
    nda_path = os.path.join(upload_dir, f"{safe_emp_id}_nda.pdf")

    with open(aadhaar_path, "wb") as f:
        f.write(await aadhaar_file.read())
    with open(pan_path, "wb") as f:
        f.write(await pan_file.read())
    with open(bank_path, "wb") as f:
        f.write(await bank_file.read())
    with open(nda_path, "wb") as f:
        f.write(await nda_file.read())

    # Update existing info or create new one
    if existing_info:
        # Update existing record
        existing_info.role = role
        existing_info.name = name
        existing_info.dob = dob
        existing_info.gender = gender
        existing_info.mobile = mobile
        existing_info.email = email
        existing_info.family1_name = family1_name
        existing_info.family1_relation = family1_relation
        existing_info.family1_mobile = family1_mobile
        existing_info.family2_name = family2_name
        existing_info.family2_relation = family2_relation
        existing_info.family2_mobile = family2_mobile
        existing_info.aadhaar_number = aadhaar_number
        existing_info.aadhaar_file = aadhaar_path
        existing_info.pan_number = pan_number
        existing_info.pan_file = pan_path
        existing_info.bank_number = bank_number
        existing_info.bank_file = bank_path
        existing_info.ifsc_code = ifsc_code
        existing_info.nda_file = nda_path
        db.commit()
        info = existing_info
    else:
        # Create new record
        info = models.EmployeePersonalInfo(
            employee_id=employee_id,
            role=role,
            name=name,
            dob=dob,
            gender=gender,
            mobile=mobile,
            email=email,
            family1_name=family1_name,
            family1_relation=family1_relation,
            family1_mobile=family1_mobile,
            family2_name=family2_name,
            family2_relation=family2_relation,
            family2_mobile=family2_mobile,
            aadhaar_number=aadhaar_number,
            aadhaar_file=aadhaar_path,
            pan_number=pan_number,
            pan_file=pan_path,
            bank_number=bank_number,
            bank_file=bank_path,
            ifsc_code=ifsc_code,
            nda_file=nda_path
        )
        db.add(info)
        db.commit()
        db.refresh(info)
    
    employee = db.query(models.Employee).filter_by(emp_id=employee_id).first()
    if employee:
        employee.status = "completed"
        db.commit()

    task = db.query(models.Task).filter_by(
        assigned_to_id=employee_id,
        title="Personal Details"
    ).first()

    if task:
        task.status = "completed"
        db.commit()

    return {"status": "success", "data": info}

# Get personal info for an employee
@router.get("/{employee_id}/personal-info")
def get_personal_info(employee_id: str, db: Session = Depends(get_db)):
    info = db.query(models.EmployeePersonalInfo).filter_by(employee_id=employee_id).first()
    if not info:
        raise HTTPException(status_code=404, detail="Personal info not found")
    return info

@router.get("/department/{department_name}/exclude/{token}")
def get_department_members_excluding_self(department_name: str, token: str, db: Session = Depends(get_db)):
    new_employee = db.query(models.Employee).filter(models.Employee.uuid_token == token).first()
    if not new_employee:
        raise HTTPException(status_code=404, detail="Invalid token")

    members = db.query(models.Employee).filter(
        models.Employee.department == department_name,
        models.Employee.emp_id != new_employee.emp_id
    ).all()

    return [
        {
            "emp_id": emp.emp_id,
            "name": emp.name,
            "email": emp.email,
            "role": emp.role,
            "status": emp.status,
            "department": emp.department,
            "uuid_token": emp.uuid_token
        }
        for emp in members
    ]

@router.get("/by-token/{token}/personal-info")
def get_personal_info_by_token(token: str, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.uuid_token == token).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")

    info = db.query(models.EmployeePersonalInfo).filter_by(employee_id=employee.emp_id).first()
    if not info:
        raise HTTPException(status_code=404, detail="Personal info not found")

    return info

@router.get("/{employee_id}/completed-tasks")
def get_completed_tasks(employee_id: str, db: Session = Depends(get_db)):
    tasks = db.query(models.Task).filter_by(
        assigned_to_id=employee_id,
        status="completed"
    ).all()

    completed_titles = [task.title for task in tasks]
    return {"tasks": completed_titles}

@router.put("/{employee_id}/status")
def update_employee_status(
    employee_id: str,
    status: str,
    db: Session = Depends(get_db),
    current_hr_user = Depends(get_current_hr_user)
):
    """
    Update employee status (enable/disable) - HR only
    Status values: "active", "disabled", "pending", "completed"
    """
    if status not in ["active", "disabled", "pending", "completed"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be: active, disabled, pending, or completed")
    
    employee = db.query(models.Employee).filter(models.Employee.emp_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    employee.status = status
    db.commit()
    db.refresh(employee)
    
    return {
        "message": f"Employee status updated to {status}",
        "employee_id": employee_id,
        "status": employee.status
    }