from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Employee, Task

router = APIRouter(prefix="/hr", tags=["hr"])

@router.get("/onboarding_status")
def onboarding_status(db: Session = Depends(get_db)):
    employees = db.query(Employee).all()
    return [{"emp_id": e.emp_id, "name": e.name, "status": e.status} for e in employees]

@router.post("/assign_task")
def assign_task(title: str, employee_id: str, db: Session = Depends(get_db)):
    task = Task(title=title, assigned_to_id=employee_id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"task_id": task.id, "title": task.title}
