from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.utils.document_parser import create_employee_folder
import os
import uuid

router = APIRouter(prefix="/training", tags=["training"])

@router.post("/submit-proof")
async def submit_training_proof(
    token: str = Form(...),
    posh_certification: UploadFile = File(None),
    it_access: UploadFile = File(None),
    collaboration_training: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # 🔍 Get employee and check status
    employee = db.query(models.Employee).filter(models.Employee.uuid_token == token).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")
    if employee.status == "disabled":
        raise HTTPException(status_code=403, detail="Employee account is disabled. Please contact HR.")

    # Validation: Check all files are PDFs if provided
    files_to_check = [
        ("POSH Certification", posh_certification),
        ("IT Access", it_access),
        ("Collaboration Training", collaboration_training)
    ]
    
    for file_label, file in files_to_check:
        if file and file.filename and not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail=f"{file_label} file must be a PDF")

    # 📁 Ensure employee folder exists
    folder_name = employee.folder_name
    if not folder_name:
        folder_name = create_employee_folder(employee.name)
        employee.folder_name = folder_name
        db.commit()

    upload_dir = os.path.join(os.path.dirname(__file__), "../uploads", folder_name)
    os.makedirs(upload_dir, exist_ok=True)

    # 🧾 Save POSH Certification with file replacement
    if posh_certification and posh_certification.filename:
        # Delete old file if exists
        safe_emp_id = employee.emp_id.replace("/", "_").replace("\\", "_")
        old_posh = os.path.join(upload_dir, f"{safe_emp_id}_posh_certification.pdf")
        if os.path.exists(old_posh):
            os.remove(old_posh)
            print(f"✅ Deleted old POSH file: {old_posh}")
        
        posh_path = os.path.join(upload_dir, f"{safe_emp_id}_posh_certification.pdf")
        with open(posh_path, "wb") as f:
            f.write(await posh_certification.read())
        print(f"✅ POSH Certification saved: {posh_path}")

    # 🧾 Save IT Access Proof with file replacement
    if it_access and it_access.filename:
        # Delete old file if exists
        safe_emp_id = employee.emp_id.replace("/", "_").replace("\\", "_")
        old_it = os.path.join(upload_dir, f"{safe_emp_id}_it_access.pdf")
        if os.path.exists(old_it):
            os.remove(old_it)
            print(f"✅ Deleted old IT Access file: {old_it}")
        
        it_path = os.path.join(upload_dir, f"{safe_emp_id}_it_access.pdf")
        with open(it_path, "wb") as f:
            f.write(await it_access.read())
        print(f"✅ IT Access Proof saved: {it_path}")

    # 🧾 Save Collaboration Training Proof with file replacement
    if collaboration_training and collaboration_training.filename:
        # Delete old file if exists
        safe_emp_id = employee.emp_id.replace("/", "_").replace("\\", "_")
        old_collab = os.path.join(upload_dir, f"{safe_emp_id}_collaboration_training.pdf")
        if os.path.exists(old_collab):
            os.remove(old_collab)
            print(f"✅ Deleted old Collaboration Training file: {old_collab}")
        
        collab_path = os.path.join(upload_dir, f"{safe_emp_id}_collaboration_training.pdf")
        with open(collab_path, "wb") as f:
            f.write(await collaboration_training.read())
        print(f"✅ Collaboration Training Proof saved: {collab_path}")

    return {"status": "success", "message": "All available files saved"}

@router.get("/status/{token}")
def get_training_status(token: str, db: Session = Depends(get_db)):
    """Get training modules status for an employee by token"""
    employee = db.query(models.Employee).filter(models.Employee.uuid_token == token).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    # Check if files exist in the upload directory
    folder_name = employee.folder_name
    upload_dir = None
    file_status = {
        "posh_certification": False,
        "it_access": False,
        "collaboration_training": False
    }
    
    if folder_name:
        upload_dir = os.path.join(os.path.dirname(__file__), "../uploads", folder_name)
        safe_emp_id = employee.emp_id.replace("/", "_").replace("\\", "_")
        
        if os.path.exists(upload_dir):
            file_status["posh_certification"] = os.path.exists(
                os.path.join(upload_dir, f"{safe_emp_id}_posh_certification.pdf")
            )
            file_status["it_access"] = os.path.exists(
                os.path.join(upload_dir, f"{safe_emp_id}_it_access.pdf")
            )
            file_status["collaboration_training"] = os.path.exists(
                os.path.join(upload_dir, f"{safe_emp_id}_collaboration_training.pdf")
            )
    
    # Also check module progress
    training_modules = db.query(models.TaskModule).filter(
        models.TaskModule.task_title == "Training"
    ).all()
    
    progress_map = {}
    for module in training_modules:
        progress = db.query(models.TaskModuleProgress).filter(
            models.TaskModuleProgress.employee_id == employee.emp_id,
            models.TaskModuleProgress.module_id == module.id
        ).first()
        if progress:
            progress_map[module.module_key] = progress.status == "completed"
        else:
            progress_map[module.module_key] = False
    
    # Combine file status with module progress
    # If either file exists OR module is completed, consider it done
    result = {
        "posh_certification": file_status["posh_certification"] or progress_map.get("company_culture", False),
        "it_access": file_status["it_access"] or progress_map.get("technical_training", False),
        "collaboration_training": file_status["collaboration_training"] or progress_map.get("compliance_training", False)
    }
    
    return result