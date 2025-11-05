from app.mcp_tools.get_employee_status import get_employee_onboarding_status
from app.mcp_tools.schedule_meeting import schedule_intro_meeting
from app.mcp_tools.analyze_feedback import analyze_new_hire_feedback

def enrich_prompt(prompt: str, employee_id: int) -> str:
    prompt_lower = prompt.lower()

    if "onboarding status" in prompt_lower:
        status = get_employee_onboarding_status(employee_id)
        return f"My onboarding status is: {status}. Can you explain what this phase means and what I should do next?"

    elif "training modules" in prompt_lower:
        modules = schedule_intro_meeting(employee_id, mentor_id=101, topic="Orientation")
        return f"Here are my assigned training modules: {modules}. Can you help me prioritize or summarize them?"

    elif "feedback summary" in prompt_lower:
        feedback_text = "The onboarding experience was good overall."
        feedback = analyze_new_hire_feedback(feedback_text)
        return f"Here's the feedback I received: {feedback}. Can you help me understand what to improve?"

    return prompt