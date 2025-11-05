from pydantic import BaseModel, EmailStr
from typing import Optional, List

class EmployeePersonalInfoCreate(BaseModel):
    role: str
    name: str
    dob: str
    gender: str
    mobile: str
    email: EmailStr
    family1_name: str
    family1_relation: str
    family1_mobile: str
    family2_name: str
    family2_relation: str
    family2_mobile: str
    aadhaar_number: str
    pan_number: str
    bank_number: str
    ifsc_code: str

class EmployeeCreate(BaseModel):
    emp_id: str
    name: str
    email: EmailStr
    role: str
    department: str

class EmployeeUpdate(BaseModel):
    name: Optional[str]
    role: Optional[str]
    status: Optional[str]

class TaskBase(BaseModel):
    title: str
    assigned_to_id: str
    status: Optional[str] = "pending"

class FeedbackTokenBase(BaseModel):
    token: str
    rating: int
    message: str

class TaskCompleteRequest(BaseModel):
    token: str
    task: str

class TaskModuleProgressUpdate(BaseModel):
    token: str
    task_title: str
    module_key: str
    status: Optional[str] = "completed"  # pending, in_progress, completed
    progress_percent: Optional[int] = 100

class TaskModuleProgressResponse(BaseModel):
    task_title: str
    module_key: str
    module_name: str
    status: str
    progress_percent: int
    is_required: bool
    completed_at: Optional[str] = None

class TaskProgressResponse(BaseModel):
    task_title: str
    status: str
    total_modules: int
    completed_modules: int
    progress_percent: int
    modules: List[TaskModuleProgressResponse]

class JoiningDayStatus(BaseModel):
    email_setup: bool
    orientation_attended: bool
    policy_acknowledged: bool

class ChatRequest(BaseModel):
    message: str
    token: str
