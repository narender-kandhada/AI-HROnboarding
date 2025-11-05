from app.mcp_tools.grounding import get_policy, detect_policy_topic
from app.mcp_tools.task_tracker import get_employee_info
from app.mcp_tools.intent import is_hr_query
import json

def build_prompt(user_input: str, token: str, page_context: dict) -> str:
    topic = detect_policy_topic(user_input)
    policy_text = get_policy(topic)
    
    # Handle HR context vs Employee context
    is_hr = is_hr_query(user_input) or page_context.get("Page", "").lower() in ["hr dashboard", "track onboarding", "employee details"]
    
    context_blob = "\n".join([f"{k}: {v}" for k, v in page_context.items()])
    
    try:
        if is_hr:
            # HR context - no employee info needed
            prompt = f"""
You are SUPA, an AI assistant helping HR at Sumeru Digitals with onboarding management.

Current Context:
{context_blob}

Relevant Policy:
{policy_text}

User asked: {user_input}

Please provide concise, data-driven insights based on the context above. Focus on analytics, statistics, and actionable recommendations.
Format: Use bullets points, include specific numbers/percentages, suggest next steps.
""".strip()
        else:
            # Employee context
            employee = get_employee_info(token)
            prompt = f"""
You are SUPA, an AI assistant helping employees at Sumeru Digitals with their onboarding.

Employee: {employee['name']}
Department: {employee['department']}

Page Context:
{context_blob}

Relevant Policy:
{policy_text}

IMPORTANT SYSTEM INFORMATION:
- The onboarding system uses a TASK MODULES system: Each main task (Personal Details, Joining Day, Training, etc.) is divided into smaller subtask modules for granular tracking.
- Module Progress: Employees can see which specific modules they've completed within each task (e.g., "Personal Details" has modules: basic_info, family_info, aadhaar, pan, bank_details, nda, declaration).
- PreReview Page: A final review page that shows all onboarding data after completing all 5 main tasks. It's accessible from the Dashboard as the "Final Review" card.
- Main Tasks: Personal Details, Joining Day, Training, Department Introduction, Feedback, PreReview (Final Review). Note: Pre-Onboarding is handled by HR/Admin, not an employee task.
- Tasks can be edited: Employees can return to tasks and update their information (e.g., feedback can be edited and resubmitted).

User asked: {user_input}

Please respond with concise, actionable guidance (3–4 bullet points max) tailored to this employee's onboarding journey. Be friendly and helpful. When discussing tasks, mention specific modules if relevant. Reference the PreReview page when appropriate.
""".strip()
    except Exception as e:
        # Fallback if employee lookup fails
        prompt = f"""
You are SUPA, an AI assistant at Sumeru Digitals helping employees with onboarding.

Context:
{context_blob}

IMPORTANT SYSTEM INFORMATION:
- The onboarding system uses a TASK MODULES system: Each main task is divided into smaller subtask modules for granular tracking.
- Main Tasks: Personal Details, Joining Day, Training, Department Introduction, Feedback, PreReview (Final Review). Note: Pre-Onboarding is handled by HR/Admin, not an employee task.
- PreReview Page: Final review page accessible after completing all 5 main tasks.
- Tasks can be edited: Employees can return to tasks and update their information.

User asked: {user_input}

Please provide helpful, concise guidance about onboarding tasks and modules.
""".strip()

    print(prompt)
    return prompt