import os
import re
from app.mcp_tools.task_tracker import (
    get_employee_info,
    get_personal_info_by_token,
    get_uploaded_documents_status,
    get_all_tasks_status,
    get_next_task,
    get_department_members_excluding_self,
    get_all_employees_summary,
    get_onboarding_analytics,
    get_department_onboarding_stats,
    get_feedback_summary,
    search_employee_by_name_or_email,
    get_employees_by_department,
    get_employees_by_status,
    get_employee_detailed_info,
    get_module_progress_by_token
)


def get_policy(name: str) -> str:
    base_path = os.path.join(os.path.dirname(__file__), "..", "assets", "policies")
    filename = f"{name.lower().replace(' ', '-')}.txt"
    filepath = os.path.join(base_path, filename)

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return f"Policy file '{filename}' not found."

def keyword_in_input(input_lower, keywords):
    return any(re.search(rf"\b{kw}\b", input_lower) for kw in keywords)

def detect_policy_topic(user_input: str) -> str:
    input_lower = user_input.lower()

    if keyword_in_input(input_lower, ["attendance", "absent", "late", "punch", "biometric", "work hours"]):
        return "Work Hours and Attendance"
    elif keyword_in_input(input_lower, ["conduct", "behavior", "ethics"]):
        return "code of conduct"
    elif keyword_in_input(input_lower, ["salary", "bonus", "benefits", "compensation"]):
        return "Compensation and Benefits"
    elif keyword_in_input(input_lower, ["confidential", "intellectual", "ip"]):
        return "Confidentiality and Intellectual Property"
    elif keyword_in_input(input_lower, ["exit", "resign", "transition", "notice period"]):
        return "Exit and Transition"
    elif keyword_in_input(input_lower, ["harassment", "posh", "grievance", "complaint"]):
        return "Harassment and Grievance Redressal (POSH)"
    elif keyword_in_input(input_lower, ["vpn", "security", "device", "laptop", "it usage"]):
        return "IT Usage and Security"
    elif keyword_in_input(input_lower, ["leave", "vacation", "holiday", "sick", "casual"]):
        return "Leave Policy"
    elif keyword_in_input(input_lower, ["performance", "appraisal", "review", "rating"]):
        return "Performance and Appraisal"
    elif keyword_in_input(input_lower, ["remote", "hybrid", "work from home", "wfh"]):
        return "Remote Work and Hybrid Guidelines"
    elif keyword_in_input(input_lower, ["travel", "expense", "reimbursement", "claim"]):
        return "Travel and Expense Reimbursement"
    else:
        return "Company Policy"

# 🧩 Page Context Injection
def get_page_context(token: str, page: str) -> dict:
    page = page.lower()

    if page == "personal":
        info = get_personal_info_by_token(token)
        required_fields = [
            info.name, info.role, info.dob, info.mobile, info.gender, info.email,
            info.aadhaar_number, info.pan_number, info.bank_number, info.ifsc_code,
            info.family1_name, info.family1_relation, info.family1_mobile,
            info.family2_name, info.family2_relation, info.family2_mobile
        ]
        filled_fields = sum(1 for val in required_fields if val)
        percent = round((filled_fields / len(required_fields)) * 100)
        doc_status = get_uploaded_documents_status(token)
        
        # Get module progress for Personal Details task
        module_progress = get_module_progress_by_token(token, "Personal Details")
        modules_info = []
        if module_progress and isinstance(module_progress, dict) and "modules" in module_progress:
            modules_info = [
                f"{m['module_name']} ({'✓' if m['status'] == 'completed' else '○'})"
                for m in module_progress.get("modules", [])
            ]

        return {
            "Page": "personal-details",
            "Completion": f"{percent}%",
            "Required Documents": "Aadhaar, PAN, Bank Proof, NDA",
            "Save Behavior": "Save unlocks Next button",
            "Mandatory Fields": "Aadhaar and PAN are mandatory",
            "Document Status": doc_status,
            "Task Modules": ", ".join(modules_info) if modules_info else "basic_info, family_info, aadhaar, pan, bank_details, nda, declaration",
            "Module Progress": f"{module_progress.get('completed_modules', 0)}/{module_progress.get('total_modules', 7)} modules completed" if module_progress and isinstance(module_progress, dict) else "Modules: basic_info, family_info, aadhaar, pan, bank_details, nda, declaration"
        }

    elif page == "dashboard":
        status = get_all_tasks_status(token)
        # Get module progress summary
        all_module_progress = get_module_progress_by_token(token)
        module_summary = []
        if all_module_progress:
            for task_title, task_data in all_module_progress.items():
                if isinstance(task_data, dict):
                    module_summary.append(
                        f"{task_title}: {task_data.get('completed_modules', 0)}/{task_data.get('total_modules', 0)} modules"
                    )
        
        return {
            "Page": "Dashboard",
            "Completed Tasks": f"{len(status['completed'])} / 5",
            "Pending Tasks": ", ".join(status["pending"]) if status["pending"] else "None",
            "Badge Status": "Unlocked" if not status["pending"] else "Locked until all tasks complete",
            "Next Task": get_next_task(token),
            "Overall Completion": f"{status['percent']}%",
            "Task Modules Progress": "; ".join(module_summary) if module_summary else "Module tracking enabled for all tasks",
            "Main Tasks": "Personal Details, Joining Day, Training, Department Introduction, Feedback, PreReview (Final Review)",
            "Note": "Pre-Onboarding is handled by HR/Admin, not an employee task"
        }

    elif page == "joining-day":
        module_progress = get_module_progress_by_token(token, "Joining Day")
        modules_info = []
        if module_progress and isinstance(module_progress, dict) and "modules" in module_progress:
            modules_info = [
                f"{m['module_name']} ({'✓' if m['status'] == 'completed' else '○'})"
                for m in module_progress.get("modules", [])
            ]
        
        return {
            "Page": "Joining Day",
            "Checklist": "Set up company email, Attend orientation session, Complete policy acknowledgment",
            "Modules": ", ".join(modules_info) if modules_info else "email_setup, orientation, policy_acknowledgment",
            "Module Progress": f"{module_progress.get('completed_modules', 0)}/{module_progress.get('total_modules', 3)} modules completed" if module_progress and isinstance(module_progress, dict) else "3 modules: email_setup, orientation, policy_acknowledgment",
            "Timing": "Starts at 10 AM IST",
            "Location": "Sumeru Digitals HQ, 5th Floor",
            "Dress Code": "Smart casual",
            "Documents Required": "Signed NDA, Aadhaar, PAN"
        }

    elif page == "training":
        module_progress = get_module_progress_by_token(token, "Training")
        modules_info = []
        if module_progress and isinstance(module_progress, dict) and "modules" in module_progress:
            modules_info = [
                f"{m['module_name']} ({'✓' if m['status'] == 'completed' else '○'})"
                for m in module_progress.get("modules", [])
            ]
        
        return {
            "Page": "Training",
            "Training Modules": "POSH Certification, IT Systems Access, Collaboration Training",
            "Modules": ", ".join(modules_info) if modules_info else "company_culture (POSH), technical_training (IT Access), compliance_training (Collaboration)",
            "Module Progress": f"{module_progress.get('completed_modules', 0)}/{module_progress.get('total_modules', 3)} modules completed" if module_progress and isinstance(module_progress, dict) else "3 modules: company_culture, technical_training, compliance_training",
            "Completion Criteria": "Upload PDF proof for each training module",
            "File Format": "Only PDF files are accepted",
            "Support": "Reach out to HR or your buddy for help",
            "Estimated Time": "2–3 hours total"
        }

    elif page == "department-intro":
        employee = get_employee_info(token)
        team_members = get_department_members_excluding_self(employee["department"], token)
        module_progress = get_module_progress_by_token(token, "Department Introduction")
        modules_info = []
        if module_progress and isinstance(module_progress, dict) and "modules" in module_progress:
            modules_info = [
                f"{m['module_name']} ({'✓' if m['status'] == 'completed' else '○'})"
                for m in module_progress.get("modules", [])
            ]
        
        return {
            "Page": "Department Introduction",
            "Team Members": [m["name"] for m in team_members] if team_members else [],
            "Team Count": len(team_members) if team_members else 0,
            "Modules": ", ".join(modules_info) if modules_info else "org_chart (view organization chart), team_contact (contact team members)",
            "Module Progress": f"{module_progress.get('completed_modules', 0)}/{module_progress.get('total_modules', 2)} modules completed" if module_progress and isinstance(module_progress, dict) else "2 modules: org_chart, team_contact",
            "Features": "View organizational chart, See team members with details, Contact team via email, Copy email addresses",
            "Action": "Click 'View Details' on any team member to see their contact info, availability, and organization details"
        }

    elif page == "feedback":
        module_progress = get_module_progress_by_token(token, "Feedback")
        modules_info = []
        if module_progress and isinstance(module_progress, dict) and "modules" in module_progress:
            modules_info = [
                f"{m['module_name']} ({'✓' if m['status'] == 'completed' else '○'})"
                for m in module_progress.get("modules", [])
            ]
        
        return {
            "Page": "Feedback",
            "Purpose": "Share your onboarding experience",
            "Visibility": "Only HR and onboarding team can view your feedback",
            "Format": "Free text + star rating (1-5 stars)",
            "Modules": ", ".join(modules_info) if modules_info else "rating (provide 1-5 star rating), comments (write feedback text), submission (submit feedback)",
            "Module Progress": f"{module_progress.get('completed_modules', 0)}/{module_progress.get('total_modules', 3)} modules completed" if module_progress and isinstance(module_progress, dict) else "3 modules: rating, comments, submission",
            "Editable": "Feedback can be edited and updated - new submission replaces previous one",
            "Next Steps": "Submit to unlock final badge (PreReview page)"
        }
    
    elif page == "pre-review" or page == "prereview":
        employee = get_employee_info(token)
        status = get_all_tasks_status(token)
        all_module_progress = get_module_progress_by_token(token)
        
        return {
            "Page": "PreReview (Final Review)",
            "Purpose": "Review all onboarding information before completion",
            "Content": "Shows employee details, personal info, completed tasks, training modules, feedback, and all submitted documents",
            "Access": "Available after all 5 main tasks are completed (Personal Details, Joining Day, Training, Department Introduction, Feedback). Note: Pre-Onboarding is handled by HR/Admin.",
            "Overall Progress": f"{status['percent']}%",
            "Completed Tasks": ", ".join(status.get('completed', [])) if status.get('completed') else "None yet",
            "Total Main Tasks": "5 tasks (Pre-Onboarding is admin-only)",
            "Task Modules Summary": "; ".join([
                f"{task_title}: {task_data.get('completed_modules', 0)}/{task_data.get('total_modules', 0)} modules"
                for task_title, task_data in (all_module_progress.items() if all_module_progress else {})
                if isinstance(task_data, dict)
            ]) if all_module_progress else "All modules tracked per task",
            "Final Step": "This is the last step before onboarding completion"
        }

    # HR Dashboard Pages
    elif page == "hr-dashboard" or page == "hrdashboard":
        try:
            analytics = get_onboarding_analytics()
            summary = get_all_employees_summary()
            feedback_summary = get_feedback_summary()
            return {
                "Page": "HR Dashboard",
                "Total Employees": analytics["total_employees"],
                "Completed Onboarding": analytics["completed_employees"],
                "Pending Onboarding": analytics["pending_employees"],
                "Overall Completion Rate": f"{analytics['completion_rate']}%",
                "Average Days to Complete": analytics["average_days_to_complete"],
                "Departments": list(summary["departments"].keys()),
                "Feedback Average Rating": feedback_summary["average_rating"],
                "Total Feedback Count": feedback_summary["total"]
            }
        except Exception as e:
            return {"Page": "HR Dashboard", "Error": f"Could not load analytics: {str(e)}"}

    elif page == "track-onboarding" or page == "trackonboarding":
        try:
            analytics = get_onboarding_analytics()
            summary = get_all_employees_summary()
            return {
                "Page": "Track Onboarding",
                "Total Employees": analytics["total_employees"],
                "Completed": analytics["completed_employees"],
                "Pending": analytics["pending_employees"],
                "Task Statistics": analytics["task_statistics"],
                "Department Breakdown": summary["departments"]
            }
        except Exception as e:
            return {"Page": "Track Onboarding", "Error": f"Could not load stats: {str(e)}"}

    elif page == "employee-details" or page == "employeedetails":
        try:
            summary = get_all_employees_summary()
            return {
                "Page": "Employee Details",
                "Total Employees": summary["total"],
                "Completed": summary["completed"],
                "Pending": summary["pending"],
                "Departments": list(summary["departments"].keys())
            }
        except Exception as e:
            return {"Page": "Employee Details", "Error": f"Could not load data: {str(e)}"}

    return {
        "Page": page.capitalize(),
        "Note": "No structured context available for this page yet."
    }
