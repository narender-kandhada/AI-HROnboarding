import os
import uuid

def parse_pdf_for_data(file_path: str):
    return "Sample parsed text"

def create_employee_folder(name: str) -> str:
    safe_name = name.strip().lower().replace(" ", "-")
    folder_name = f"{safe_name}-{uuid.uuid4()}"
    base_dir = os.path.dirname(os.path.abspath(__file__))
    folder_path = os.path.join(base_dir, "..", "uploads", folder_name)
    os.makedirs(folder_path, exist_ok=True)
    print(f"📁 Folder created at: {folder_path}")
    return folder_name
