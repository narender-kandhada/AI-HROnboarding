def analyze_new_hire_feedback(feedback_text: str) -> dict:
    sentiment = "positive" if "good" in feedback_text else "neutral"
    return {"feedback_text": feedback_text, "sentiment": sentiment}
