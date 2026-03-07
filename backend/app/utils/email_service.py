import os
import base64
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.message import Message
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import (
    Mail, Attachment, FileContent, FileName, FileType, Disposition
)
from app.database import SessionLocal
from app.models import EmailAccount


load_dotenv()

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

# Gmail SMTP Settings (fallback)
GMAIL_SMTP_SERVER = os.getenv("GMAIL_SMTP_SERVER", "smtp.gmail.com")
GMAIL_SMTP_PORT = int(os.getenv("GMAIL_SMTP_PORT", "587"))

def get_app_password_for_email(email: str) -> str:
    """Look up the Gmail App Password for a sender email from .env"""
    key = f"HR_APP_PASSWORD_{email}"
    password = os.getenv(key)
    if not password:
        raise ValueError(
            f"No app password found in .env for '{email}'. "
            f"Add this line to your .env file: {key}=<your-16-char-gmail-app-password>"
        )
    return password.strip()

def get_default_email_account(db: Session = None) -> EmailAccount:
    """Get the default email account from database"""
    if db is None:
        db = SessionLocal()
    
    try:
        account = db.query(EmailAccount).filter(EmailAccount.is_default == "yes").first()
        if not account:
            account = db.query(EmailAccount).first()
        return account
    except Exception as e:
        print(f"❌ Error fetching email account: {e}")
        return None
    finally:
        if db is not None:
            db.close()

def get_email_account_by_id(account_id: int, db: Session = None) -> EmailAccount:
    """Get email account by ID"""
    if db is None:
        db = SessionLocal()
    
    try:
        account = db.query(EmailAccount).filter(EmailAccount.id == account_id).first()
        return account
    except Exception as e:
        print(f"❌ Error fetching email account: {e}")
        return None
    finally:
        if db is not None:
            db.close()

# --------------- SendGrid HTTP API ---------------

def _send_via_sendgrid(
    from_email: str,
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None,
):
    """Send email via SendGrid Web API (HTTP-based, works on Render free tier)"""
    if not SENDGRID_API_KEY:
        raise ValueError("SENDGRID_API_KEY not set in environment variables")

    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=subject,
        html_content=body,
    )

    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, "rb") as f:
            file_data = f.read()
        attachment = Attachment(
            FileContent(base64.b64encode(file_data).decode()),
            FileName(os.path.basename(attachment_path)),
            FileType("application/pdf"),
            Disposition("attachment"),
        )
        message.attachment = attachment

    sg = SendGridAPIClient(SENDGRID_API_KEY)
    response = sg.send(message)
    print(f"✅ Email sent to {to_email} from {from_email} via SendGrid (status: {response.status_code})")
    return True

# --------------- Gmail SMTP (fallback) ---------------

def _send_via_gmail_smtp(
    from_email: str,
    app_password: str,
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None,
):
    """Send email using Gmail SMTP — used as fallback when SendGrid is unavailable"""
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email
    msg.attach(MIMEText(body, "html"))

    if attachment_path and os.path.exists(attachment_path):
        try:
            with open(attachment_path, "rb") as f:
                pdf = MIMEApplication(f.read(), _subtype="pdf")
                pdf.add_header("Content-Disposition", "attachment", filename=os.path.basename(attachment_path))
                msg.attach(pdf)
        except Exception as e:
            print(f"⚠️ Could not attach file {attachment_path}: {e}")

    if GMAIL_SMTP_PORT == 465:
        with smtplib.SMTP_SSL(GMAIL_SMTP_SERVER, GMAIL_SMTP_PORT) as server:
            server.login(from_email, app_password)
            server.send_message(msg)
    else:
        with smtplib.SMTP(GMAIL_SMTP_SERVER, GMAIL_SMTP_PORT) as server:
            server.starttls()
            server.login(from_email, app_password)
            server.send_message(msg)

    print(f"✅ Email sent to {to_email} from {from_email} via Gmail SMTP")
    return True

# --------------- Public API (same signatures as before) ---------------

def send_email_with_gmail(
    from_email: str,
    app_password: str,
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None,
    save_to_sent: bool = True
):
    """Send email — tries SendGrid HTTP API first, falls back to Gmail SMTP"""
    # Try SendGrid first (works on Render free tier)
    if SENDGRID_API_KEY:
        try:
            return _send_via_sendgrid(from_email, to_email, subject, body, attachment_path)
        except Exception as e:
            print(f"⚠️ SendGrid failed, falling back to Gmail SMTP: {e}")

    # Fallback to Gmail SMTP
    try:
        return _send_via_gmail_smtp(from_email, app_password, to_email, subject, body, attachment_path)
    except smtplib.SMTPAuthenticationError as e:
        error_msg = (
            f"Gmail authentication failed for sender '{from_email}'. "
            "Use a Gmail App Password (16 characters) for that same sender account, "
            "remove spaces, and ensure 2-Step Verification is enabled."
        )
        print(f"❌ {error_msg} SMTP details: {e}")
        raise ValueError(error_msg)
    except Exception as e:
        print(f"❌ Gmail SMTP error: {e}")
        raise

def send_onboarding_email(hr_email: str, hr_name: str, to_email: str, employee_name: str, link: str, nda_path: str, email_account_id: int = None):
    """Send onboarding email using SendGrid (primary) or Gmail SMTP (fallback)"""
    subject = "Welcome to Sumeru Digitals — Start Your Onboarding"
    body = f"""
    <p>Hi {employee_name},</p>
    <p>{hr_name} has invited you to begin onboarding.</p>
    <p>Please click the link below to get started:</p>
    <p><a href="{link}">{link}</a></p>
    <p>Please review and fill out the attached NDA form.</p>
    <p>If you have any questions, feel free to reach out to {hr_email}.</p>
    <p>Best regards,<br>The HR Team</p>
    """

    db = SessionLocal()
    try:
        if email_account_id:
            account = get_email_account_by_id(email_account_id, db)
        else:
            account = get_default_email_account(db)
        
        if not account:
            raise ValueError("No email account configured. Please add an email account in HR Dashboard.")
        
        app_password = get_app_password_for_email(account.email)
        
        send_email_with_gmail(
            from_email=account.email,
            app_password=app_password,
            to_email=to_email,
            subject=subject,
            body=body,
            attachment_path=nda_path
        )
    finally:
        db.close()

def send_email_credentials(
    to_email: str,
    employee_name: str,
    company_email: str,
    company_password: str,
    email_account_id: int = None
):
    """Send company email credentials to employee"""
    subject = "Your Sumeru Digitals Company Email Credentials"
    body = f"""
    <p>Hi {employee_name},</p>
    <p>Your company email account has been set up. Here are your credentials:</p>
    <p><strong>Email:</strong> {company_email}</p>
    <p><strong>Password:</strong> {company_password}</p>
    <p><strong>Important:</strong> Please change your password after your first login for security.</p>
    <p>If you have any questions or need assistance, please contact HR.</p>
    <p>Best regards,<br>The IT Team</p>
    """

    db = SessionLocal()
    try:
        if email_account_id:
            account = get_email_account_by_id(email_account_id, db)
        else:
            account = get_default_email_account(db)
        
        if not account:
            raise ValueError("No email account configured. Please add an email account in HR Dashboard.")
        
        app_password = get_app_password_for_email(account.email)
        
        send_email_with_gmail(
            from_email=account.email,
            app_password=app_password,
            to_email=to_email,
            subject=subject,
            body=body
        )
    finally:
        db.close()