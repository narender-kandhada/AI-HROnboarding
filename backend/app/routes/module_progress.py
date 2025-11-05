"""
API routes for tracking subtask/module progress
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/module-progress", tags=["module-progress"])


@router.post("/update")
def update_module_progress(
    data: schemas.TaskModuleProgressUpdate,
    db: Session = Depends(get_db)
):
    """Update progress for a specific module"""
    # Get employee by token
    employee = db.query(models.Employee).filter(
        models.Employee.uuid_token == data.token
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    # Get module by task_title and module_key
    module = db.query(models.TaskModule).filter(
        models.TaskModule.task_title == data.task_title,
        models.TaskModule.module_key == data.module_key
    ).first()
    
    if not module:
        raise HTTPException(
            status_code=404,
            detail=f"Module '{data.module_key}' not found for task '{data.task_title}'"
        )
    
    # Get or create progress record
    progress = db.query(models.TaskModuleProgress).filter(
        models.TaskModuleProgress.employee_id == employee.emp_id,
        models.TaskModuleProgress.module_id == module.id
    ).first()
    
    if not progress:
        # Get task if exists
        task = db.query(models.Task).filter(
            models.Task.assigned_to_id == employee.emp_id,
            models.Task.title == data.task_title
        ).first()
        
        progress = models.TaskModuleProgress(
            employee_id=employee.emp_id,
            task_id=task.id if task else None,
            module_id=module.id,
            status=data.status,
            progress_percent=data.progress_percent
        )
        db.add(progress)
    else:
        progress.status = data.status
        progress.progress_percent = data.progress_percent
    
    # Set completed_at if completed
    if data.status == "completed" and not progress.completed_at:
        progress.completed_at = datetime.utcnow()
    
    progress.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(progress)
    
    return {
        "status": "success",
        "module_key": data.module_key,
        "task_title": data.task_title,
        "progress_percent": progress.progress_percent,
        "module_status": progress.status
    }


@router.get("/employee/{token}")
def get_employee_module_progress(
    token: str,
    db: Session = Depends(get_db)
):
    """Get all module progress for an employee"""
    employee = db.query(models.Employee).filter(
        models.Employee.uuid_token == token
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    # Get all modules grouped by task
    all_modules = db.query(models.TaskModule).order_by(
        models.TaskModule.task_title,
        models.TaskModule.order_index
    ).all()
    
    # Get all progress records for this employee
    progress_records = db.query(models.TaskModuleProgress).filter(
        models.TaskModuleProgress.employee_id == employee.emp_id
    ).all()
    
    # Create a map of module_id -> progress
    progress_map = {p.module_id: p for p in progress_records}
    
    # Group modules by task
    tasks_dict = {}
    for module in all_modules:
        if module.task_title not in tasks_dict:
            tasks_dict[module.task_title] = {
                "task_title": module.task_title,
                "modules": [],
                "total_modules": 0,
                "completed_modules": 0
            }
        
        progress = progress_map.get(module.id)
        module_data = {
            "module_key": module.module_key,
            "module_name": module.module_name,
            "description": module.description,
            "status": progress.status if progress else "pending",
            "progress_percent": progress.progress_percent if progress else 0,
            "is_required": module.is_required == "yes",
            "completed_at": progress.completed_at.isoformat() if progress and progress.completed_at else None,
            "order_index": module.order_index
        }
        
        tasks_dict[module.task_title]["modules"].append(module_data)
        tasks_dict[module.task_title]["total_modules"] += 1
        if progress and progress.status == "completed":
            tasks_dict[module.task_title]["completed_modules"] += 1
    
    # Calculate progress percentages
    result = []
    for task_title, task_data in tasks_dict.items():
        total = task_data["total_modules"]
        completed = task_data["completed_modules"]
        progress_percent = int((completed / total * 100)) if total > 0 else 0
        
        # Get task status
        task = db.query(models.Task).filter(
            models.Task.assigned_to_id == employee.emp_id,
            models.Task.title == task_title
        ).first()
        
        result.append({
            "task_title": task_title,
            "status": task.status if task else "pending",
            "total_modules": total,
            "completed_modules": completed,
            "progress_percent": progress_percent,
            "modules": sorted(task_data["modules"], key=lambda x: x["order_index"])
        })
    
    return {"tasks": result}


@router.get("/task/{token}/{task_title}")
def get_task_progress(
    token: str,
    task_title: str,
    db: Session = Depends(get_db)
):
    """Get progress for a specific task"""
    employee = db.query(models.Employee).filter(
        models.Employee.uuid_token == token
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    # Get all modules for this task
    modules = db.query(models.TaskModule).filter(
        models.TaskModule.task_title == task_title
    ).order_by(models.TaskModule.order_index).all()
    
    if not modules:
        raise HTTPException(
            status_code=404,
            detail=f"No modules found for task '{task_title}'"
        )
    
    # Get progress records
    progress_records = db.query(models.TaskModuleProgress).filter(
        models.TaskModuleProgress.employee_id == employee.emp_id,
        models.TaskModuleProgress.module_id.in_([m.id for m in modules])
    ).all()
    
    progress_map = {p.module_id: p for p in progress_records}
    
    # Build response
    module_list = []
    completed_count = 0
    
    for module in modules:
        progress = progress_map.get(module.id)
        module_data = {
            "module_key": module.module_key,
            "module_name": module.module_name,
            "description": module.description,
            "status": progress.status if progress else "pending",
            "progress_percent": progress.progress_percent if progress else 0,
            "is_required": module.is_required == "yes",
            "completed_at": progress.completed_at.isoformat() if progress and progress.completed_at else None,
            "order_index": module.order_index
        }
        module_list.append(module_data)
        
        if progress and progress.status == "completed":
            completed_count += 1
    
    # Get task status
    task = db.query(models.Task).filter(
        models.Task.assigned_to_id == employee.emp_id,
        models.Task.title == task_title
    ).first()
    
    total_modules = len(modules)
    progress_percent = int((completed_count / total_modules * 100)) if total_modules > 0 else 0
    
    return schemas.TaskProgressResponse(
        task_title=task_title,
        status=task.status if task else "pending",
        total_modules=total_modules,
        completed_modules=completed_count,
        progress_percent=progress_percent,
        modules=module_list
    )

