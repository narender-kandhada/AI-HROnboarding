"""
Script to seed task modules (subtasks) for each main onboarding task.
Run this after creating the task_modules and task_module_progress tables.
"""
import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

# Set dummy API keys to avoid config validation issues during seeding
os.environ["OPENAI_API_KEY"] = os.environ.get("OPENAI_API_KEY", "dummy")
os.environ["GEMINI_API_KEY"] = os.environ.get("GEMINI_API_KEY", "dummy")

from app.database import SessionLocal, engine
from app.models import Base, TaskModule
from sqlalchemy.exc import IntegrityError

def seed_task_modules():
    """Seed task modules for all onboarding tasks"""
    db = SessionLocal()
    
    try:
        # Define task modules for each main task
        task_modules = [
            # Personal Details Task Modules
            {
                "task_title": "Personal Details",
                "module_key": "basic_info",
                "module_name": "Basic Information",
                "description": "Fill in name, email, role, DOB, gender, mobile",
                "order_index": 1,
                "is_required": "yes"
            },
            {
                "task_title": "Personal Details",
                "module_key": "family_info",
                "module_name": "Family Details",
                "description": "Add family member information (2 contacts)",
                "order_index": 2,
                "is_required": "yes"
            },
            {
                "task_title": "Personal Details",
                "module_key": "aadhaar",
                "module_name": "Aadhaar Document",
                "description": "Enter Aadhaar number and upload document",
                "order_index": 3,
                "is_required": "yes"
            },
            {
                "task_title": "Personal Details",
                "module_key": "pan",
                "module_name": "PAN Document",
                "description": "Enter PAN number and upload document",
                "order_index": 4,
                "is_required": "yes"
            },
            {
                "task_title": "Personal Details",
                "module_key": "bank_details",
                "module_name": "Bank Account Details",
                "description": "Enter bank account number, IFSC code and upload document",
                "order_index": 5,
                "is_required": "yes"
            },
            {
                "task_title": "Personal Details",
                "module_key": "nda",
                "module_name": "NDA Form",
                "description": "Upload signed NDA form",
                "order_index": 6,
                "is_required": "yes"
            },
            {
                "task_title": "Personal Details",
                "module_key": "declaration",
                "module_name": "Declaration",
                "description": "Accept and submit declaration",
                "order_index": 7,
                "is_required": "yes"
            },
            
            # Joining Day Task Modules
            {
                "task_title": "Joining Day",
                "module_key": "email_setup",
                "module_name": "Email Setup",
                "description": "Set up company email account",
                "order_index": 1,
                "is_required": "yes"
            },
            {
                "task_title": "Joining Day",
                "module_key": "orientation",
                "module_name": "Orientation Session",
                "description": "Attend orientation session",
                "order_index": 2,
                "is_required": "yes"
            },
            {
                "task_title": "Joining Day",
                "module_key": "policy_acknowledgment",
                "module_name": "Policy Acknowledgment",
                "description": "Read and acknowledge company policies",
                "order_index": 3,
                "is_required": "yes"
            },
            
            # Training Task Modules
            {
                "task_title": "Training",
                "module_key": "company_culture",
                "module_name": "Company Culture Training",
                "description": "Complete company culture and values training",
                "order_index": 1,
                "is_required": "yes"
            },
            {
                "task_title": "Training",
                "module_key": "technical_training",
                "module_name": "Technical Training",
                "description": "Complete role-specific technical training",
                "order_index": 2,
                "is_required": "yes"
            },
            {
                "task_title": "Training",
                "module_key": "compliance_training",
                "module_name": "Compliance Training",
                "description": "Complete compliance and security training",
                "order_index": 3,
                "is_required": "yes"
            },
            
            # Department Introduction Task Modules
            {
                "task_title": "Department Introduction",
                "module_key": "org_chart",
                "module_name": "View Organization Chart",
                "description": "Review department organization structure",
                "order_index": 1,
                "is_required": "yes"
            },
            {
                "task_title": "Department Introduction",
                "module_key": "team_contact",
                "module_name": "Contact Team Members",
                "description": "Reach out and connect with team members",
                "order_index": 2,
                "is_required": "yes"
            },
            
            # Feedback Task Modules
            {
                "task_title": "Feedback",
                "module_key": "rating",
                "module_name": "Rating",
                "description": "Rate your onboarding experience (1-5 stars)",
                "order_index": 1,
                "is_required": "yes"
            },
            {
                "task_title": "Feedback",
                "module_key": "comments",
                "module_name": "Comments",
                "description": "Provide detailed feedback comments",
                "order_index": 2,
                "is_required": "yes"
            },
            {
                "task_title": "Feedback",
                "module_key": "submission",
                "module_name": "Submit Feedback",
                "description": "Submit your feedback",
                "order_index": 3,
                "is_required": "yes"
            },
        ]
        
        # Insert modules (skip if already exists)
        added_count = 0
        skipped_count = 0
        
        for module_data in task_modules:
            try:
                # Check if module already exists
                existing = db.query(TaskModule).filter(
                    TaskModule.task_title == module_data["task_title"],
                    TaskModule.module_key == module_data["module_key"]
                ).first()
                
                if existing:
                    print(f"⏭️  Skipping {module_data['task_title']} -> {module_data['module_name']} (already exists)")
                    skipped_count += 1
                    continue
                
                module = TaskModule(**module_data)
                db.add(module)
                added_count += 1
                print(f"✅ Added {module_data['task_title']} -> {module_data['module_name']}")
                
            except Exception as e:
                print(f"❌ Error adding {module_data['task_title']} -> {module_data['module_name']}: {e}")
                db.rollback()
                continue
        
        db.commit()
        print(f"\n📊 Summary: {added_count} modules added, {skipped_count} skipped")
        print("✅ Task modules seeded successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding task modules: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding task modules...")
    seed_task_modules()

