# scripts/backfill_folders.py

import sys
import os

# 👇 Add backend/ to sys.path so 'app' becomes importable
sys.path.append(os.path.abspath(os.path.dirname(__file__) + "/.."))

from app.database import SessionLocal
from app import models
from app.utils.document_parser import create_employee_folder

def backfill_employee_folders():
    db = SessionLocal()
    employees = db.query(models.Employee).filter(models.Employee.folder_name == None).all()

    for emp in employees:
        folder_name = create_employee_folder(emp.name)
        emp.folder_name = folder_name
        print(f"✅ Folder created for {emp.name}: {folder_name}")

    db.commit()
    db.close()

if __name__ == "__main__":
    backfill_employee_folders()