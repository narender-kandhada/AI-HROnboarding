from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/complete")
def complete_task(data: schemas.TaskCompleteRequest, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(models.Employee.uuid_token == data.token).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")

    task = db.query(models.Task).filter_by(
        assigned_to_id=employee.emp_id,
        title=data.task
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = "completed"
    db.commit()
    return {"status": "success", "task": data.task}

@router.get("/status/joining-day/{token}")
def get_joining_day_status(token: str, db: Session = Depends(get_db)):
    """Get joining day task status for an employee"""
    employee = db.query(models.Employee).filter(models.Employee.uuid_token == token).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    # Get module progress for joining day tasks
    joining_day_modules = db.query(models.TaskModule).filter(
        models.TaskModule.task_title == "Joining Day"
    ).all()
    
    # Get progress records for this employee
    progress_map = {}
    for module in joining_day_modules:
        progress = db.query(models.TaskModuleProgress).filter(
            models.TaskModuleProgress.employee_id == employee.emp_id,
            models.TaskModuleProgress.module_id == module.id
        ).first()
        if progress:
            progress_map[module.module_key] = progress.status == "completed"
        else:
            progress_map[module.module_key] = False
    
    return {
        "email_setup": progress_map.get("email_setup", False),
        "orientation_attended": progress_map.get("orientation", False),
        "policy_acknowledged": progress_map.get("policy_acknowledgment", False)
    }