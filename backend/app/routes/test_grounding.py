from fastapi import APIRouter
from app.mcp_tools.grounding import get_page_context
from app.mcp_tools.task_tracker import (
    get_employee_info,
    get_completed_tasks,
    get_personal_info_by_token,
    get_uploaded_documents_status,
    get_all_tasks_status,
    get_next_task
)


router = APIRouter(prefix="/test", tags=["Grounding Test"])

@router.get("/employee/{token}")
def test_employee_info(token: str):
    return get_employee_info(token)

@router.get("/tasks/completed/{token}")
def test_completed_tasks(token: str):
    emp = get_employee_info(token)
    return {"tasks": get_completed_tasks(emp["id"])}

@router.get("/personal/{token}")
def test_personal_info(token: str):
    return get_personal_info_by_token(token)

@router.get("/documents/{token}")
def test_documents(token: str):
    return get_uploaded_documents_status(token)

@router.get("/tasks/all/{token}")
def test_all_tasks(token: str):
    return get_all_tasks_status(token)

@router.get("/next-task/{token}")
def test_next_task(token: str):
    return {"next_task": get_next_task(token)}

@router.get("/context/{token}/{page}")
def test_page_context(token: str, page: str):
    return get_page_context(token, page)

@router.get("/context/{token}/department")
def test_department_context(token: str):
    from app.mcp_tools.task_tracker import get_page_context
    return get_page_context(token, "department")
