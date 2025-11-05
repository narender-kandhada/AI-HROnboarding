from fastapi import Request, APIRouter
import requests
import logging
from requests.exceptions import ReadTimeout
from app.mcp_tools.prompt_builder import build_prompt
from app.mcp_tools.grounding import detect_policy_topic, get_page_context
from app.mcp_tools.intent import is_onboarding_related, is_hr_query, extract_search_query
from app.mcp_tools.task_tracker import (
    get_onboarding_analytics,
    get_all_employees_summary,
    search_employee_by_name_or_email,
    get_department_onboarding_stats,
    get_employees_by_status,
    get_employee_detailed_info
)


response_cache = {}
router = APIRouter(prefix="/chatbot", tags=["chatbot"])
logger = logging.getLogger("chat_api")

# 🧠 Utility Functions
def is_valid_response(text: str) -> bool:
    if not text:
        return False
    if "SUPA Chat is taking longer" in text or "encountered an error" in text:
        return False
    return len(text.strip()) > 20

def trim_response(text: str) -> str:
    lines = text.strip().split("\n")
    filtered = []
    for line in lines:
        lower = line.lower()
        if any(kw in lower for kw in ["regarding", "please feel free", "hope this helps", "let me know"]):
            continue
        if lower.startswith("dear") or "thank you" in lower:
            continue
        filtered.append(line.strip())
    return "\n".join(filtered[:4]) if len(filtered) > 4 else "\n".join(filtered)

def generate_llm_response(prompt: str) -> tuple[str, str]:
    for model in ["mistral", "phi"]:
        try:
            logger.info(f"Prompt sent to {model}:\n{prompt}")
            response = requests.post("http://localhost:11434/api/generate", json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0, "top_p": 1}
            }, timeout=30)
            text = response.json().get("response", "").strip()
            if len(text) >= 20:
                return trim_response(text), model
        except ReadTimeout:
            logger.warning(f"❌ {model} timed out")
        except Exception as e:
            logger.error(f"❌ {model} failed: {e}")
    return "SUPA Chat encountered an error. Please try again or contact HR.", "none"

def enrich_data_with_query(user_input: str, page_context: dict) -> dict:
    """Enrich page context with specific data based on query intent"""
    msg = user_input.lower()
    query_info = extract_search_query(user_input)
    
    try:
        # Check if it's an HR query and retrieve specific data
        if is_hr_query(user_input):
            if query_info["type"] == "search_employee":
                results = search_employee_by_name_or_email(query_info.get("query", ""))
                page_context["Search Results"] = results[:5]  # Limit to 5 results
                logger.info(f"Found {len(results)} employees matching '{query_info.get('query')}'")
                
            elif query_info["type"] == "department_stats":
                dept = query_info.get("department", "")
                stats = get_department_onboarding_stats(dept)
                page_context["Department Statistics"] = stats
                logger.info(f"Retrieved stats for {dept} department")
                
            elif query_info["type"] == "status_filter":
                status = query_info.get("status", "")
                employees = get_employees_by_status(status)
                page_context[f"{status.capitalize()} Employees"] = employees[:10]  # Limit to 10
                logger.info(f"Found {len(employees)} {status} employees")
                
            elif "analytics" in msg or "overview" in msg or "summary" in msg:
                analytics = get_onboarding_analytics()
                summary = get_all_employees_summary()
                page_context["Analytics"] = analytics
                page_context["Summary"] = summary
                logger.info("Retrieved onboarding analytics")
                
    except Exception as e:
        logger.error(f"Error enriching data: {e}")
    
    return page_context

# 🚀 Main Chat Endpoint
@router.post("/chat")
async def chat(request: Request):
    data = await request.json()
    logger.info(f"📥 Incoming request: {data}")

    user_input = data.get("message", "").strip().lower()
    token = data.get("token", "demo")
    page = data.get("page", "").lower()
    topic = detect_policy_topic(user_input)

    cache_key = f"{token}:{page}:{user_input}"
    if cache_key in response_cache:
        logger.debug(f"Cache hit for {cache_key}")
        return {
            "response": response_cache[cache_key],
            "model_used": "cached",
            "policy_topic": topic
        }

    if not is_onboarding_related(user_input):
        return {
        "response": "I'm here to help with onboarding only — tasks, documents, training, and team intros. For other topics, please reach out to your manager or HR.",
        "model_used": "none",
        "policy_topic": "none"
        }

    # Get base page context
    page_context = get_page_context(token, page)
    
    # Enrich with specific data based on query
    page_context = enrich_data_with_query(user_input, page_context)
    
    prompt = build_prompt(user_input, token, page_context)
    response_text, model_used = generate_llm_response(prompt)

    if is_valid_response(response_text):
        response_cache[cache_key] = response_text
    else:
        logger.warning(f"Invalid response for {cache_key}: {response_text}")

    logger.info(f"🧭 Detected policy topic: {topic}")
    return {
        "response": response_text,
        "model_used": model_used,
        "policy_topic": topic
    }