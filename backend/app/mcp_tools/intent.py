def is_onboarding_related(message: str) -> bool:
    keywords = [
        "onboarding", "joining", "training", "feedback", "personal details",
        "documents", "aadhaar", "pan", "bank proof", "nda", "manager", "buddy",
        "team", "dashboard", "tasks", "HR", "department", "form", "upload",
        "next button", "badge", "completion", "progress", "analytics", "statistics",
        "track", "employees", "summary", "report", "overview", "status"
    ]
    msg = message.lower()
    return any(kw in msg for kw in keywords)

def is_hr_query(message: str) -> bool:
    """Detect if query is from HR/admin perspective"""
    hr_keywords = [
        "all employees", "onboarding status", "completion rate", "analytics",
        "dashboard overview", "department stats", "feedback summary", "task statistics",
        "track onboarding", "employee details", "pending employees", "completed employees",
        "how many", "show me", "list", "report", "summary", "breakdown"
    ]
    msg = message.lower()
    return any(kw in msg for kw in hr_keywords)

def extract_search_query(message: str) -> dict:
    """Extract actionable queries from message"""
    msg = message.lower()
    
    # Search for specific employee
    if "search for" in msg or "find employee" in msg or "show employee" in msg:
        # Try to extract name or email
        parts = msg.split("search for")
        if len(parts) > 1:
            search_term = parts[1].strip().split()[0]
            return {"type": "search_employee", "query": search_term}
    
    # Department query
    if "department" in msg:
        for dept in ["engineering", "sales", "marketing", "hr", "finance", "operations"]:
            if dept in msg:
                return {"type": "department_stats", "department": dept.capitalize()}
    
    # Status query
    if "pending" in msg or "not completed" in msg:
        return {"type": "status_filter", "status": "pending"}
    elif "completed" in msg or "done" in msg:
        return {"type": "status_filter", "status": "completed"}
    
    return {"type": "general"}