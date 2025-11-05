from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import FeedbackTokenBase
from app.models import Employee, Feedback
from datetime import datetime
from app import models, schemas

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.get("/")
def get_all_feedback(db: Session = Depends(get_db)):
    """Get all feedback submissions"""
    feedbacks = db.query(Feedback).all()
    return feedbacks

@router.get("/by-token/{token}")
def get_feedback_by_token(token: str, db: Session = Depends(get_db)):
    """Get the latest feedback submission for a specific employee by token"""
    employee = db.query(Employee).filter(Employee.uuid_token == token).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")
    
    # Get the latest feedback ordered by submitted_at descending
    feedback = db.query(Feedback).filter(Feedback.token == token).order_by(Feedback.submitted_at.desc()).first()
    if not feedback:
        return None
    
    return {
        "rating": feedback.rating,
        "message": feedback.message,
        "submitted_at": feedback.submitted_at.isoformat() if feedback.submitted_at else None
    }

@router.get("/employee/{employee_id}")
def get_feedback_by_employee_id(employee_id: str, db: Session = Depends(get_db)):
    """Get the latest feedback submission for a specific employee by employee ID"""
    employee = db.query(Employee).filter(Employee.emp_id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get the latest feedback ordered by submitted_at descending
    feedback = db.query(Feedback).filter(Feedback.employee_id == employee_id).order_by(Feedback.submitted_at.desc()).first()
    if not feedback:
        return None
    
    return {
        "rating": feedback.rating,
        "message": feedback.message,
        "submitted_at": feedback.submitted_at.isoformat() if feedback.submitted_at else None,
        "name": employee.name,
        "email": employee.email
    }

@router.post("/submit")
def submit_feedback(feedback: FeedbackTokenBase, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.uuid_token == feedback.token).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Invalid token")

    existing = db.query(Feedback).filter(Feedback.token == feedback.token).first()
    if existing:
        existing.message = feedback.message
        existing.rating = feedback.rating
        existing.submitted_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return {"id": existing.id, "rating": existing.rating}

    f = Feedback(
        employee_id=employee.emp_id,
        token=feedback.token,
        message=feedback.message,
        rating=feedback.rating
    )
    db.add(f)
    db.commit()
    db.refresh(f)

    return {"id": f.id, "rating": f.rating}