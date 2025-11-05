from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.dependencies import get_current_hr_user
import os

router = APIRouter(prefix="/documents", tags=["documents"])

@router.get("/employee/{employee_id}")
def get_employee_documents(employee_id: str, db: Session = Depends(get_db)):
    docs = db.query(models.Document).filter(models.Document.employee_id == employee_id).all()
    return [{"id": d.id, "name": d.name, "url": d.url} for d in docs]

@router.get("/employee/{employee_id}/files")
def get_employee_files(
    employee_id: str, 
    db: Session = Depends(get_db),
    current_hr_user = Depends(get_current_hr_user)
):
    """
    Get all uploaded files for an employee (HR only)
    Returns list of document files (personal docs + training docs)
    """
    employee = db.query(models.Employee).filter(models.Employee.emp_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    files = []
    
    if not employee.folder_name:
        return {"employee_id": employee_id, "files": files, "message": "No folder assigned to employee"}
    
    # Use the same path construction as employee.py and training.py
    base_dir = os.path.dirname(__file__)
    upload_dir = os.path.join(base_dir, "..", "uploads", employee.folder_name)
    
    # Normalize the path to handle any path issues
    upload_dir = os.path.abspath(upload_dir)
    
    print(f"🔍 Looking for files in: {upload_dir}")
    print(f"📁 Folder name from DB: {employee.folder_name}")
    print(f"📂 Path exists: {os.path.exists(upload_dir)}")
    
    if os.path.exists(upload_dir):
        try:
            uploaded_files = os.listdir(upload_dir)
            print(f"📄 Found {len(uploaded_files)} files in folder")
            for file in uploaded_files:
                if file.endswith('.pdf'):
                    file_path = os.path.join(upload_dir, file)
                    if os.path.exists(file_path):
                        file_size = os.path.getsize(file_path)
                        # Better display name formatting (sanitize employee_id for matching)
                        safe_emp_id = employee_id.replace("/", "_").replace("\\", "_")
                        display_name = file.replace(f"{safe_emp_id}_", "").replace(".pdf", "").replace("_", " ").title()
                        files.append({
                            "filename": file,
                            "display_name": display_name,
                            "size": file_size,
                            "type": "personal" if any(x in file for x in ["aadhaar", "pan", "bank", "nda"]) else "training"
                        })
        except Exception as e:
            print(f"❌ Error reading files: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"⚠️ Upload directory does not exist: {upload_dir}")
    
    return {"employee_id": employee_id, "files": files}

@router.get("/employee/{employee_id}/file/{filename}")
def view_employee_file(
    employee_id: str,
    filename: str,
    db: Session = Depends(get_db),
    current_hr_user = Depends(get_current_hr_user)
):
    """
    View/download a specific employee file (HR only)
    """
    employee = db.query(models.Employee).filter(models.Employee.emp_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if not employee.folder_name:
        raise HTTPException(status_code=404, detail="Employee folder not assigned")
    
    # Use the same path construction as employee.py and training.py
    base_dir = os.path.dirname(__file__)
    upload_dir = os.path.join(base_dir, "..", "uploads", employee.folder_name)
    upload_dir = os.path.abspath(upload_dir)
    
    if not os.path.exists(upload_dir):
        raise HTTPException(status_code=404, detail=f"Employee folder not found: {upload_dir}")
    
    file_path = os.path.join(upload_dir, filename)
    
    if not os.path.exists(file_path) or not filename.endswith('.pdf'):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Security: Ensure file belongs to this employee (sanitize employee_id for matching)
    safe_emp_id = employee_id.replace("/", "_").replace("\\", "_")
    if not filename.startswith(f"{safe_emp_id}_"):
        raise HTTPException(status_code=403, detail="Unauthorized file access")
    
    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'inline; filename="{filename}"'}
    )