from fastapi import APIRouter, Body
from app.mcp_tools.prompt_builder import build_prompt
from app.mcp_tools.grounding import detect_policy_topic
import requests

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

def ask_local_llm(prompt: str, model_name: str = "phi") -> str:
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": model_name, "prompt": prompt, "stream": False},
            timeout=6
        )
        return response.json().get("response", "").strip()
    except Exception as e:
        return f"Error: {str(e)}"

@router.post("/ask")
def ask_bot(payload: dict = Body(...)):
    prompt = payload.get("prompt")
    employee_id = payload.get("employee_id")

    if not prompt or not employee_id:
        return {"error": "Missing prompt or employee_id"}

    enriched_prompt = build_prompt(prompt, token=employee_id, task="Joining Day")
    response_text = ask_local_llm(enriched_prompt, model_name="phi")

    # Fallback to Mistral if Phi fails or gives weak response
    if not response_text or len(response_text) < 20 or "SUPA Chat is taking longer" in response_text:
        response_text = ask_local_llm(enriched_prompt, model_name="mistral")
        model_used = "mistral"
    else:
        model_used = "phi"

    return {
        "response": response_text,
        "model_used": model_used,
        "policy_topic": detect_policy_topic(prompt),
        "task": "Joining Day"
    }