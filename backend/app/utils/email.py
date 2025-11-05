import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.message import Message
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import EmailAccount
from app.utils.security import decrypt_password

load_dotenv()

# Gmail SMTP Settings
GMAIL_SMTP_SERVER = os.getenv("GMAIL_SMTP_SERVER", "smtp.gmail.com")
GMAIL_SMTP_PORT = int(os.getenv("GMAIL_SMTP_PORT", "587"))  # TLS port (587) or SSL (465)
# Note: Gmail uses email address as username and app password as password

def get_default_email_account(db: Session = None) -> EmailAccount:
    """Get the default email account from database"""
    if db is None:
        db = SessionLocal()
    
    try:
        account = db.query(EmailAccount).filter(EmailAccount.is_default == "yes").first()
        if not account:
            # If no default, get the first one
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

def save_to_sent_folder(from_email: str, from_password: str, msg: Message):
    """Save email copy to Sent folder using IMAP (Optional - Gmail supports IMAP)"""
    # Note: Gmail supports IMAP for saving to Sent folder
    # For now, we'll skip this as it requires additional IMAP configuration
    # Emails sent via Gmail SMTP are tracked in Gmail's Sent folder automatically
    print(f"ℹ️ Email sent successfully via Gmail SMTP. It will appear in Gmail's Sent folder.")

def send_email_with_gmail(
    from_email: str,
    app_password: str,
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None,
    save_to_sent: bool = True
):
    """Send email using Gmail SMTP with app password"""
    try:
        # Create multipart email
        msg = MIMEMultipart()
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email

        # Attach HTML body
        msg.attach(MIMEText(body, "html"))

        # Attach file if provided
        if attachment_path and os.path.exists(attachment_path):
            try:
                with open(attachment_path, "rb") as f:
                    pdf = MIMEApplication(f.read(), _subtype="pdf")
                    pdf.add_header("Content-Disposition", "attachment", filename=os.path.basename(attachment_path))
                    msg.attach(pdf)
            except Exception as e:
                print(f"⚠️ Could not attach file {attachment_path}: {e}")

        # Send email using Gmail SMTP
        # Gmail uses TLS on port 587 or SSL on port 465
        if GMAIL_SMTP_PORT == 465:
            # SSL connection
            with smtplib.SMTP_SSL(GMAIL_SMTP_SERVER, GMAIL_SMTP_PORT) as server:
                server.login(from_email, app_password)  # Gmail uses email as username
                server.send_message(msg)
        else:
            # TLS connection (default for port 587)
            with smtplib.SMTP(GMAIL_SMTP_SERVER, GMAIL_SMTP_PORT) as server:
                server.starttls()  # Enable TLS
                server.login(from_email, app_password)  # Gmail uses email as username
                server.send_message(msg)
        
        print(f"✅ Email sent to {to_email} from {from_email} via Gmail SMTP")
        
        # Save to Sent folder if requested (Gmail automatically saves to Sent folder)
        if save_to_sent:
            save_to_sent_folder(from_email, app_password, msg)
        
        return True
    except Exception as e:
        print(f"❌ Gmail SMTP error: {e}")
        raise

def send_onboarding_email(hr_email: str, hr_name: str, to_email: str, employee_name: str, link: str, nda_path: str, email_account_id: int = None):
    """Send onboarding email using Gmail SMTP and database email account"""
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

    # Get email account from database
    db = SessionLocal()
    try:
        if email_account_id:
            account = get_email_account_by_id(email_account_id, db)
        else:
            account = get_default_email_account(db)
        
        if not account:
            raise ValueError("No email account configured. Please add an email account in HR Dashboard.")
        
        # Decrypt app password (stored as password in database) for email sending
        try:
            app_password = decrypt_password(account.password)
        except Exception as e:
            error_msg = f"Could not decrypt Gmail app password: {str(e)}"
            print(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        # Send email using Gmail SMTP
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

    # Get email account from database
    db = SessionLocal()
    try:
        if email_account_id:
            account = get_email_account_by_id(email_account_id, db)
        else:
            account = get_default_email_account(db)
        
        if not account:
            raise ValueError("No email account configured. Please add an email account in HR Dashboard.")
        
        # Decrypt app password (stored as password in database) for email sending
        try:
            app_password = decrypt_password(account.password)
        except Exception as e:
            error_msg = f"Could not decrypt Gmail app password: {str(e)}"
            print(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        # Send email using Gmail SMTP
        send_email_with_gmail(
            from_email=account.email,
            app_password=app_password,
            to_email=to_email,
            subject=subject,
            body=body
        )
    finally:
        db.close()