from sqlalchemy.orm import Session, joinedload
from app.database import SessionLocal
from app.database import get_db
from app.models import Employee, Task, EmployeePersonalInfo, Feedback, TrainingModule, TaskModule, TaskModuleProgress
from sqlalchemy import func
import os

# 🔹 Get employee info by token
def get_employee_info(token: str) -> dict:
    db: Session = SessionLocal()
    employee = db.query(Employee).filter(Employee.uuid_token == token).first()
    if not employee:
        raise ValueError("Invalid token")

    return {
        "emp_id": employee.emp_id,
        "name": employee.name,
        "email": employee.email,
        "department": employee.department,
        "folder": employee.folder_name
    }

# 🔹 Get completed task titles for an employee
def get_completed_tasks(employee_id: str) -> list:
    db: Session = SessionLocal()
    tasks = db.query(Task).filter(
        Task.assigned_to_id == employee_id,
        Task.status == "completed"
    ).all()

    return [task.title for task in tasks]

def get_personal_info_by_token(token: str) -> EmployeePersonalInfo:
    db: Session = SessionLocal()

    employee = db.query(Employee).filter(Employee.uuid_token == token).first()
    if not employee:
        raise ValueError("Invalid token")

    info = db.query(EmployeePersonalInfo).filter_by(employee_id=employee.emp_id).first()
    if not info:
        raise ValueError("Personal info not found")

    return info

def get_uploaded_documents_status(token: str) -> dict:
    emp = get_employee_info(token)
    folder_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads", emp["folder"])

    keywords = {
        "aadhaar": ["aadhaar"],
        "pan": ["pan"],
        "bank_proof": ["bank", "account"],
        "nda": ["nda"]
    }

    status = {}
    try:
        uploaded_files = os.listdir(folder_path)
    except FileNotFoundError:
        return {doc: "folder not found" for doc in keywords}

    for doc_type, substrings in keywords.items():
        found = any(any(sub in f.lower() for sub in substrings) for f in uploaded_files)
        status[doc_type] = "uploaded" if found else "missing"

    return status

def get_all_tasks_status(token: str) -> dict:
    emp = get_employee_info(token)
    completed = get_completed_tasks(emp["emp_id"])
    # Pre-Onboarding is now handled by admin, not a task for employees
    all_tasks = ["Personal Details", "Joining Day", "Training", "Department Introduction", "Feedback"]
    pending = [t for t in all_tasks if t not in completed]
    percent = round((len(completed) / len(all_tasks)) * 100)
    return {
        "completed": completed,
        "pending": pending,
        "percent": percent
    }

def get_next_task(token: str) -> str:
    status = get_all_tasks_status(token)
    return status["pending"][0] if status["pending"] else "None 🎉"

def get_department_members_excluding_self(department: str, token: str) -> list:
    db: Session = next(get_db())
    
    # Get the current employee using the token
    current_employee = db.query(Employee).filter(Employee.uuid_token == token).first()
    if not current_employee:
        return []

    # Query all employees in the same department, excluding the current one
    members = db.query(Employee).filter(
        Employee.department == department,
        Employee.emp_id != current_employee.emp_id
    ).all()

    # Return a simplified list of member info
    return [
        {
            "emp_id": emp.emp_id,
            "name": emp.name,
            "email": emp.email,
            "role": emp.role,
            "status": emp.status,
            "uuid_token": emp.uuid_token
        }
        for emp in members
    ]

# 🔹 HR-Specific Functions

def get_all_employees_summary() -> dict:
    """Get summary of all employees for HR dashboard"""
    db: Session = SessionLocal()
    employees = db.query(Employee).all()
    
    total = len(employees)
    completed = len([e for e in employees if e.status == "completed"])
    pending = len([e for e in employees if e.status == "pending"])
    
    # Get departments
    departments = {}
    for emp in employees:
        if emp.department:
            if emp.department not in departments:
                departments[emp.department] = {"total": 0, "completed": 0, "pending": 0}
            departments[emp.department]["total"] += 1
            if emp.status == "completed":
                departments[emp.department]["completed"] += 1
            else:
                departments[emp.department]["pending"] += 1
    
    return {
        "total": total,
        "completed": completed,
        "pending": pending,
        "departments": departments
    }

def get_employee_detailed_info(employee_id: str) -> dict:
    """Get detailed information about an employee"""
    db: Session = SessionLocal()
    employee = db.query(Employee).filter(Employee.emp_id == employee_id).first()
    
    if not employee:
        return {}
    
    # Get personal info
    personal_info = db.query(EmployeePersonalInfo).filter_by(employee_id=employee_id).first()
    
    # Get tasks
    tasks = db.query(Task).filter(Task.assigned_to_id == employee_id).all()
    
    # Get feedback
    feedback = db.query(Feedback).filter(Feedback.employee_id == employee_id).first()
    
    # Get uploaded documents
    folder_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads", employee.folder_name) if employee.folder_name else None
    documents = []
    if folder_path and os.path.exists(folder_path):
        try:
            uploaded_files = os.listdir(folder_path)
            for file in uploaded_files:
                if file.endswith('.pdf'):
                    documents.append(file)
        except:
            pass
    
    return {
        "emp_id": employee.emp_id,
        "name": employee.name,
        "email": employee.email,
        "role": employee.role,
        "department": employee.department,
        "status": employee.status,
        "uuid_token": employee.uuid_token,
        "personal_info": {
            "mobile": personal_info.mobile if personal_info else None,
            "dob": personal_info.dob if personal_info else None,
            "gender": personal_info.gender if personal_info else None,
            "aadhaar_number": personal_info.aadhaar_number if personal_info else None,
            "pan_number": personal_info.pan_number if personal_info else None,
        } if personal_info else None,
        "tasks": [{"title": t.title, "status": t.status} for t in tasks],
        "documents": documents,
        "feedback": {
            "rating": feedback.rating,
            "message": feedback.message[:100] + "..." if feedback and len(feedback.message) > 100 else (feedback.message if feedback else None),
            "submitted_at": feedback.submitted_at.strftime("%Y-%m-%d") if feedback and feedback.submitted_at else None
        } if feedback else None
    }

def get_onboarding_analytics() -> dict:
    """Get comprehensive onboarding analytics for HR"""
    db: Session = SessionLocal()
    
    # Get all employees with their tasks
    employees = db.query(Employee).options(
        joinedload(Employee.tasks)
    ).all()
    
    total_employees = len(employees)
    completed_employees = len([e for e in employees if e.status == "completed"])
    
    # Calculate task completion rates
    all_tasks = ["Personal Details", "Joining Day", "Training", "Department Introduction", "Feedback"]
    task_stats = {}
    
    for task_title in all_tasks:
        assigned_count = 0
        completed_count = 0
        for emp in employees:
            task = next((t for t in emp.tasks if t.title == task_title), None)
            if task:
                assigned_count += 1
                if task.status == "completed":
                    completed_count += 1
        
        task_stats[task_title] = {
            "assigned": assigned_count,
            "completed": completed_count,
            "completion_rate": round((completed_count / assigned_count * 100) if assigned_count > 0 else 0, 1)
        }
    
    # Average completion time (mock data - would need timestamp tracking)
    avg_days_to_complete = 7  # Placeholder
    
    return {
        "total_employees": total_employees,
        "completed_employees": completed_employees,
        "pending_employees": total_employees - completed_employees,
        "completion_rate": round((completed_employees / total_employees * 100) if total_employees > 0 else 0, 1),
        "task_statistics": task_stats,
        "average_days_to_complete": avg_days_to_complete
    }

def get_department_onboarding_stats(department: str) -> dict:
    """Get onboarding statistics for a specific department"""
    db: Session = SessionLocal()
    
    employees = db.query(Employee).filter(Employee.department == department).all()
    
    total = len(employees)
    completed = len([e for e in employees if e.status == "completed"])
    
    # Get task completion by department
    task_stats = {}
    all_tasks = ["Personal Details", "Joining Day", "Training", "Department Introduction", "Feedback"]
    
    for task_title in all_tasks:
        completed_count = 0
        for emp in employees:
            task = next((t for t in emp.tasks if t.title == task_title), None)
            if task and task.status == "completed":
                completed_count += 1
        
        task_stats[task_title] = {
            "completed": completed_count,
            "total": total,
            "rate": round((completed_count / total * 100) if total > 0 else 0, 1)
        }
    
    return {
        "department": department,
        "total_employees": total,
        "completed": completed,
        "pending": total - completed,
        "completion_rate": round((completed / total * 100) if total > 0 else 0, 1),
        "task_stats": task_stats
    }

def get_feedback_summary() -> dict:
    """Get summary of all employee feedback"""
    db: Session = SessionLocal()
    
    feedbacks = db.query(Feedback).all()
    
    if not feedbacks:
        return {"total": 0, "average_rating": 0, "count": 0}
    
    total = len(feedbacks)
    avg_rating = sum(f.rating for f in feedbacks) / total
    
    # Rating distribution
    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for fb in feedbacks:
        rating_dist[fb.rating] = rating_dist.get(fb.rating, 0) + 1
    
    return {
        "total": total,
        "average_rating": round(avg_rating, 2),
        "count": total,
        "rating_distribution": rating_dist
    }

def search_employee_by_name_or_email(search_term: str) -> list:
    """Search for employees by name or email"""
    db: Session = SessionLocal()
    
    employees = db.query(Employee).filter(
        (Employee.name.ilike(f"%{search_term}%")) |
        (Employee.email.ilike(f"%{search_term}%"))
    ).limit(10).all()
    
    return [
        {
            "emp_id": emp.emp_id,
            "name": emp.name,
            "email": emp.email,
            "department": emp.department,
            "role": emp.role,
            "status": emp.status
        }
        for emp in employees
    ]

def get_employees_by_department(department: str) -> list:
    """Get all employees in a department"""
    db: Session = SessionLocal()
    
    employees = db.query(Employee).filter(Employee.department == department).all()
    
    return [
        {
            "emp_id": emp.emp_id,
            "name": emp.name,
            "email": emp.email,
            "role": emp.role,
            "status": emp.status,
            "uuid_token": emp.uuid_token
        }
        for emp in employees
    ]

def get_employees_by_status(status: str) -> list:
    """Get all employees with a specific status"""
    db: Session = SessionLocal()
    
    employees = db.query(Employee).filter(Employee.status == status).all()
    
    return [
        {
            "emp_id": emp.emp_id,
            "name": emp.name,
            "email": emp.email,
            "department": emp.department,
            "role": emp.role,
            "status": emp.status
        }
        for emp in employees
    ]

def get_module_progress_by_token(token: str, task_title: str = None) -> dict:
    """Get module progress for an employee by token. If task_title is provided, filter to that task."""
    db: Session = SessionLocal()
    
    employee = db.query(Employee).filter(Employee.uuid_token == token).first()
    if not employee:
        raise ValueError("Invalid token")
    
    # Get modules (optionally filtered by task_title)
    query = db.query(TaskModule)
    if task_title:
        query = query.filter(TaskModule.task_title == task_title)
    modules = query.order_by(TaskModule.task_title, TaskModule.order_index).all()
    
    # Get progress records
    progress_records = db.query(TaskModuleProgress).filter(
        TaskModuleProgress.employee_id == employee.emp_id
    ).all()
    progress_map = {p.module_id: p for p in progress_records}
    
    # Group by task
    tasks_dict = {}
    for module in modules:
        if module.task_title not in tasks_dict:
            tasks_dict[module.task_title] = {
                "total_modules": 0,
                "completed_modules": 0,
                "modules": []
            }
        
        progress = progress_map.get(module.id)
        status = progress.status if progress else "pending"
        
        tasks_dict[module.task_title]["modules"].append({
            "module_key": module.module_key,
            "module_name": module.module_name,
            "status": status,
            "is_required": module.is_required == "yes"
        })
        tasks_dict[module.task_title]["total_modules"] += 1
        if status == "completed":
            tasks_dict[module.task_title]["completed_modules"] += 1
    
    # Calculate percentages
    for task_title, data in tasks_dict.items():
        total = data["total_modules"]
        completed = data["completed_modules"]
        data["progress_percent"] = int((completed / total * 100)) if total > 0 else 0
    
    return tasks_dict if not task_title else tasks_dict.get(task_title, {})
