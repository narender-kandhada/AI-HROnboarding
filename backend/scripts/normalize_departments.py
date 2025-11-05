"""
Script to normalize department names in the database
This will merge duplicates like "HR" and "hr" into a single normalized format
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Employee

def normalize_department(dept):
    """Normalize department name"""
    if not dept:
        return None
    # Trim whitespace
    trimmed = dept.strip()
    if not trimmed:
        return None
    
    # Common department acronyms that should be all caps
    acronyms = ["HR", "IT", "AI", "ML", "UI", "UX", "QA", "R&D"]
    upper = trimmed.upper()
    if upper in acronyms:
        return upper
    
    # Otherwise, capitalize first letter of each word
    return " ".join(word.capitalize() for word in trimmed.split())

def normalize_all_departments():
    """Normalize all department names in the database"""
    db = SessionLocal()
    
    try:
        # Get all employees
        employees = db.query(Employee).all()
        
        print(f"Found {len(employees)} employees")
        
        # Track changes
        changes = {}
        updated_count = 0
        
        for emp in employees:
            if not emp.department:
                continue
            
            original = emp.department
            normalized = normalize_department(original)
            
            if normalized and normalized != original:
                if normalized not in changes:
                    changes[normalized] = []
                changes[normalized].append(original)
                emp.department = normalized
                updated_count += 1
        
        # Commit changes
        if updated_count > 0:
            db.commit()
            print(f"\n✅ Normalized {updated_count} employee departments")
            print("\nChanges made:")
            for normalized, originals in changes.items():
                unique_originals = list(set(originals))
                if len(unique_originals) > 1:
                    print(f"  '{normalized}' <- {unique_originals}")
                else:
                    print(f"  '{normalized}' <- '{unique_originals[0]}'")
        else:
            print("\n✅ All departments are already normalized")
        
        # Show final department list
        final_depts = db.query(Employee.department).distinct().all()
        final_depts = [d[0] for d in final_depts if d[0]]
        final_depts.sort()
        
        print(f"\n📊 Final department list ({len(final_depts)} departments):")
        for dept in final_depts:
            count = db.query(Employee).filter(Employee.department == dept).count()
            print(f"  - {dept}: {count} employee(s)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Department Normalization Script")
    print("=" * 60)
    print("\nThis script will normalize department names to avoid duplicates.")
    print("Examples:")
    print("  - 'hr', 'HR', 'Hr' -> 'HR'")
    print("  - 'design', 'Design', 'DESIGN' -> 'Design'")
    print("  - 'software development' -> 'Software Development'")
    print("\n" + "=" * 60)
    
    response = input("\nDo you want to proceed? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        normalize_all_departments()
        print("\n✅ Done!")
    else:
        print("\n❌ Cancelled")

