from app.database import SessionLocal
from app import models

db = SessionLocal()

employees = db.query(models.Employee).all()

for emp in employees:
    # Check if Pre-Onboarding task exists
    if not emp.emp_id:
        print(f"⚠️  Employee {emp.name} has no emp_id, skipping...")
        continue
    
    pre_task = db.query(models.Task).filter_by(title="Pre-Onboarding", assigned_to_id=emp.emp_id).first()

    if not pre_task:
        print(f"🔧 Adding Pre-Onboarding task for {emp.name}")
        db.add(models.Task(title="Pre-Onboarding", assigned_to_id=emp.emp_id, status="completed"))

    # Update status if still pending
    if emp.status == "pending":
        print(f"🔄 Updating status for {emp.name} to 'personal-details'")
        emp.status = "personal-details"

db.commit()
db.close()
print("✅ Sync complete.")