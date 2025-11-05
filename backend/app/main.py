from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import subprocess
import logging


from app.database import engine, Base, SessionLocal
from app.routes import employee, hr, documents, training, feedback, tasks, test_grounding, it_accounts, email_accounts, auth, module_progress
from app.models import Feedback
from app.utils.security import create_access_token
from app.chat_api import router as chat_router 



load_dotenv()
APP_PASSWORD = os.getenv("APP_PASSWORD")    

app = FastAPI(title="AI HR Onboarding Backend")

# ✅ CORS setup - Get allowed origins from environment or use defaults
# Note: When allow_credentials=True, you cannot use allow_origins=["*"]
# You must specify exact origins

# Get allowed origins from environment variable (comma-separated)
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
if ALLOWED_ORIGINS_ENV:
    # Split by comma and strip whitespace
    allowed_origins = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(",") if origin.strip()]
else:
    # Default origins for development and production
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "https://hronboarding.sumerudigital.com",
        "http://hronboarding.sumerudigital.com",
    ]

print(f"🌐 CORS Allowed Origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ✅ HR login endpoint - Uses IT accounts with HR department
@app.post("/auth/hr_login_post")
async def hr_login_post(email: str = Form(...), password: str = Form(...)):
    from sqlalchemy.orm import joinedload
    from app.models import ITAccount, Employee
    from app.utils.security import verify_password, decrypt_password
    import traceback
    
    db = SessionLocal()
    try:
        # Find IT account by company_email
        try:
            it_account = (
                db.query(ITAccount)
                .join(Employee)
                .filter(ITAccount.company_email == email)
                .options(joinedload(ITAccount.employee))
                .first()
            )
        except Exception as e:
            print(f"❌ Database query error: {e}")
            print(traceback.format_exc())
            db.close()
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )
        
        if not it_account:
            print(f"❌ No IT account found for email: {email}")
            db.close()
            raise HTTPException(
                status_code=401, 
                detail="Invalid HR credentials. No IT account found. Please ensure the employee has an IT account created with this company email."
            )
        
        # Check if employee belongs to HR department (case-insensitive)
        employee = it_account.employee
        if not employee:
            print(f"❌ No employee linked to IT account for email: {email}")
            db.close()
            raise HTTPException(
                status_code=401,
                detail="Invalid HR credentials. Employee not found for this IT account."
            )
        
        if not employee.department:
            print(f"❌ Employee {employee.name} has no department set")
            db.close()
            raise HTTPException(
                status_code=403,
                detail="Access denied. Employee department is not set. Please set department to 'HR'."
            )
        
        # Check department (case-insensitive)
        department_upper = employee.department.upper().strip() if employee.department else ""
        if department_upper != "HR":
            print(f"❌ Employee {employee.name} department is '{employee.department}' (normalized: '{department_upper}'), not 'HR'")
            db.close()
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. Only HR department employees can login. Current department: '{employee.department}'"
            )
        
        # Verify password - try hash verification first, fallback to decryption if old format
        password_valid = False
        try:
            # Try hash verification (new format)
            password_valid = verify_password(password, it_account.company_password)
            print(f"✅ Password verification using hash: {password_valid}")
        except Exception as hash_error:
            print(f"⚠️ Hash verification failed (password is encrypted, not hashed): {hash_error}")
            # Try decryption (old encrypted format) as fallback
            try:
                decrypted_password = decrypt_password(it_account.company_password)
                if decrypted_password:
                    password_valid = (decrypted_password == password)
                    print(f"✅ Password verification using decryption: {password_valid}")
                    if password_valid:
                        print("⚠️ WARNING: Password stored in old encrypted format. Please update password to use secure hashing.")
                        print("💡 TIP: Use PUT /it-accounts/employee/{employee_id} to update password and convert to hash format.")
                    else:
                        print(f"❌ Decrypted password does not match. Decrypted: '{decrypted_password[:5]}...' (first 5 chars)")
                else:
                    print("❌ Decryption returned None - IT_ENCRYPTION_KEY might be wrong")
                    password_valid = False
            except Exception as decrypt_error:
                print(f"❌ Decryption failed: {decrypt_error}")
                print(traceback.format_exc())
                print("💡 TIP: Check if IT_ENCRYPTION_KEY in .env matches the key used to encrypt this password")
                password_valid = False
        
        if not password_valid:
            print(f"❌ Password mismatch for {email}")
            # Provide more detailed error message
            password_format = "unknown"
            if it_account.company_password.startswith("$2b$") or it_account.company_password.startswith("$2a$"):
                password_format = "hashed"
            else:
                password_format = "encrypted or invalid format"
            
            db.close()
            raise HTTPException(
                status_code=401, 
                detail=f"Invalid HR credentials. Password verification failed. Password stored as: {password_format}. Please verify the password is correct or update the IT account password."
            )
        
        # Create token with company_email
        try:
            token = create_access_token(data={"sub": it_account.company_email})
        except Exception as token_error:
            print(f"❌ Token creation error: {token_error}")
            print(traceback.format_exc())
            db.close()
            raise HTTPException(
                status_code=500,
                detail=f"Token creation failed: {str(token_error)}"
            )
        
        return JSONResponse(content={
            "message": "Login successful",
            "email": it_account.company_email,
            "name": employee.name,
            "access_token": token
        })
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"❌ Unexpected error during HR login: {e}")
        print(traceback.format_exc())
        db.close()
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
    finally:
        if db:
            db.close()

# ✅ Startup logic: create tables
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Note: HR login now uses IT accounts with HR department - no seeding needed

def warmup_models():
    try:
        subprocess.Popen(["ollama", "run", "phi"])
        subprocess.Popen(["ollama", "run", "mistral"])
        logging.info("✅ Models warming up...")

    except Exception as e:
        print("⚠️ Failed to warm up models:", e)


# ✅ Route registration
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



# ✅ Root endpoint
@app.get("/")
def root():
    return {"message": "AI HR Onboarding Backend running"}