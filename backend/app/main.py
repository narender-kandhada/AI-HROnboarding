from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os

from app.database import engine, Base, SessionLocal
from app.routes import (
    employee, hr, documents, training, feedback, tasks,
    test_grounding, it_accounts, email_accounts, auth, module_progress
)
from app.models import Employee, ITAccount
from app.utils.security import (
    create_access_token,
    verify_password,
    pwd_context
)
from app.chat_api import router as chat_router

load_dotenv()

app = FastAPI(title="AI HR Onboarding Backend")

# ------------------------------------------------------------------
# CORS CONFIG
# ------------------------------------------------------------------
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
if ALLOWED_ORIGINS_ENV:
    allowed_origins = [o.strip() for o in ALLOWED_ORIGINS_ENV.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:3001",
        "http://localhost:5173",
        "https://ai-hr-onboarding.vercel.app",
        "http://hronboarding.sumerudigital.com",
    ]

print(f"🌐 CORS Allowed Origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# LOGIN REQUEST SCHEMA (JSON)
# ------------------------------------------------------------------
class HRLoginRequest(BaseModel):
    email: str
    password: str

# ------------------------------------------------------------------
# HR LOGIN (JSON BASED)
# ------------------------------------------------------------------
# DEFAULT HR CREDENTIALS (works even with empty database)
# ------------------------------------------------------------------
DEFAULT_HR_EMAIL = os.getenv("DEFAULT_HR_EMAIL", "test@user.com")
DEFAULT_HR_PASSWORD = os.getenv("DEFAULT_HR_PASSWORD", "123456")

# ------------------------------------------------------------------
@app.post("/auth/hr_login_post")
async def hr_login_post(payload: HRLoginRequest):
    # Check default HR credentials first (works without database data)
    if payload.email == DEFAULT_HR_EMAIL and payload.password == DEFAULT_HR_PASSWORD:
        token = create_access_token({"sub": DEFAULT_HR_EMAIL, "is_default_hr": True})
        return {
            "message": "Login successful",
            "email": DEFAULT_HR_EMAIL,
            "name": "HR Admin",
            "access_token": token,
        }

    db = SessionLocal()
    try:
        it_account = (
            db.query(ITAccount)
            .join(Employee)
            .filter(ITAccount.company_email == payload.email)
            .first()
        )

        if not it_account or not it_account.employee:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        employee = it_account.employee
        if employee.department.upper().strip() != "HR":
            raise HTTPException(status_code=403, detail="HR access only")

        # Password verification
        valid = verify_password(payload.password, it_account.company_password)

        if not valid:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({"sub": it_account.company_email})

        return {
            "message": "Login successful",
            "email": it_account.company_email,
            "name": employee.name,
            "access_token": token,
        }

    finally:
        db.close()

# ------------------------------------------------------------------
# 🚨 TEMPORARY: BOOTSTRAP FIRST HR USER (RUN ONCE)
# ------------------------------------------------------------------
@app.post("/bootstrap/hr")
def bootstrap_hr():
    db = SessionLocal()

    existing = db.query(Employee).filter(Employee.department == "HR").first()
    if existing:
        return {"message": "HR already exists"}

    employee = Employee(
        name="Admin HR",
        department="HR",
        email="hr@company.com"
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    it_account = ITAccount(
        employee_id=employee.id,
        company_email="hr@company.com",
        company_password=pwd_context.hash("Admin@123")
    )
    db.add(it_account)
    db.commit()

    return {
        "message": "HR user created",
        "email": "hr@company.com",
        "password": "Admin@123"
    }

# ------------------------------------------------------------------
# STARTUP
# ------------------------------------------------------------------
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

# ------------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------------
app.include_router(employee.router)
app.include_router(hr.router)
app.include_router(documents.router)
app.include_router(training.router)
app.include_router(feedback.router)
app.include_router(tasks.router)
app.include_router(module_progress.router)
app.include_router(test_grounding.router)
app.include_router(chat_router)
app.include_router(it_accounts.router)
app.include_router(email_accounts.router)
app.include_router(auth.router)

# ------------------------------------------------------------------
# ROOT
# ------------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "AI HR Onboarding Backend running"}
