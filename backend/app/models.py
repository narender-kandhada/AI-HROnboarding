from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime 
import uuid


class Employee(Base):
    __tablename__ = "employees"

    emp_id = Column(String(50), primary_key=True, index=True, unique=True)
    name = Column(String(100))
    email = Column(String(100))
    role = Column(String(255), nullable=False)
    department = Column(String(255))
    status = Column(String(50), default="pending")
    uuid_token = Column(String(36), unique=True, default=lambda: str(uuid.uuid4()))

    folder_name = Column(String(255), nullable=True)
  # Optional: track onboarding state

    tasks = relationship("Task", back_populates="employee")         # ✅ For Task
    documents = relationship("Document", back_populates="employee") # ✅ For Document
    feedbacks = relationship("Feedback", back_populates="employee") # ✅ For Feedback
    personal_info = relationship("EmployeePersonalInfo", backref="employee", uselist=False)
    it_accounts = relationship("ITAccount", back_populates="employee", uselist=False)
    module_progress = relationship("TaskModuleProgress", back_populates="employee")

class HR(Base):
    __tablename__ = "hr_users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True)
    password_hash = Column(String(255))
    name = Column(String(100), nullable=False) 


class EmployeePersonalInfo(Base):
    __tablename__ = "employee_personal_info"  # ✅ Renamed to avoid confusion

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), ForeignKey("employees.emp_id"))
    role = Column(String(50))  # ✅ Moved here
    name = Column(String(100))
    dob = Column(String(20))
    gender = Column(String(20))
    mobile = Column(String(15))
    email = Column(String(100))
    family1_name = Column(String(100))
    family1_relation = Column(String(50))
    family1_mobile = Column(String(15))
    family2_name = Column(String(100))
    family2_relation = Column(String(50))
    family2_mobile = Column(String(15))
    aadhaar_number = Column(String(20))
    aadhaar_file = Column(String(255))
    pan_number = Column(String(20))
    pan_file = Column(String(255))
    bank_number = Column(String(30))
    bank_file = Column(String(255))
    ifsc_code = Column(String(20))
    nda_file = Column(String(255), nullable=True)


class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    assigned_to_id = Column(String(50), ForeignKey("employees.emp_id"))
    status = Column(String(50), default="pending")
    employee = relationship("Employee", back_populates="tasks")
    module_progress = relationship("TaskModuleProgress", back_populates="task", cascade="all, delete-orphan")


class TaskModule(Base):
    """Defines subtasks/modules within a main task"""
    __tablename__ = "task_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    task_title = Column(String(255), nullable=False, index=True)  # Links to Task.title
    module_key = Column(String(100), nullable=False)  # Unique key like "personal_info", "documents"
    module_name = Column(String(255), nullable=False)  # Display name like "Personal Information", "Upload Documents"
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)  # For ordering modules within a task
    is_required = Column(String(10), default="yes")  # "yes" or "no"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    progress_records = relationship("TaskModuleProgress", back_populates="module")


class TaskModuleProgress(Base):
    """Tracks progress of each module for each employee"""
    __tablename__ = "task_module_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), ForeignKey("employees.emp_id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)  # Optional link to Task
    module_id = Column(Integer, ForeignKey("task_modules.id"), nullable=False, index=True)
    status = Column(String(50), default="pending")  # pending, in_progress, completed
    progress_percent = Column(Integer, default=0)  # 0-100
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    employee = relationship("Employee")
    task = relationship("Task", back_populates="module_progress")
    module = relationship("TaskModule", back_populates="progress_records")
    
    # Unique constraint: one progress record per employee per module
    __table_args__ = (
        UniqueConstraint('employee_id', 'module_id', name='uq_employee_module'),
    )

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    url = Column(String(2048), nullable=True)
    employee_id = Column(String(50), ForeignKey("employees.emp_id"))
    employee = relationship("Employee", back_populates="documents")

class TrainingModule(Base):
    __tablename__ = "training_modules"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), ForeignKey("employees.emp_id"), nullable=False)
    token = Column(String(36), nullable=False)  # ✅ Add length
    message = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="feedbacks")

class ITAccount(Base):
    """Track IT account credentials for employees - Company Email and Password only"""
    __tablename__ = "it_accounts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), ForeignKey("employees.emp_id"), nullable=False, unique=True)
    
    # Company email and credentials
    company_email = Column(String(255), nullable=False)
    company_password = Column(Text, nullable=False)  # Store hashed (for login verification)
    # Optional: encrypted version for email sharing (may not exist in older databases)
    company_password_encrypted = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    employee = relationship("Employee", back_populates="it_accounts")

class EmailAccount(Base):
    """Store standard email accounts for sending onboarding and credential emails"""
    __tablename__ = "email_accounts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True)
    password = Column(Text, nullable=False)  # Store encrypted
    display_name = Column(String(255), nullable=True)  # Display name for the email account
    is_default = Column(String(10), default="no")  # "yes" or "no" - only one can be default
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = Column(Text, nullable=True)  # Optional notes about the account

