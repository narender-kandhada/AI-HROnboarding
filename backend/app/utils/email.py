import os
import smtplib
import imaplib
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

# Hostinger SMTP Settings
HOSTINGER_SMTP_SERVER = "smtp.hostinger.com"
HOSTINGER_SMTP_PORT = 465  # SSL port

# Hostinger IMAP Settings (for saving to Sent folder)
HOSTINGER_IMAP_SERVER = "imap.hostinger.com"
HOSTINGER_IMAP_PORT = 993  # SSL port

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
    """Save email copy to Sent folder using IMAP"""
    try:
        # Connect to IMAP server
        mail = imaplib.IMAP4_SSL(HOSTINGER_IMAP_SERVER, HOSTINGER_IMAP_PORT)
        mail.login(from_email, from_password)
        
        # Select Sent folder (try common names)
        sent_folders = ["Sent", "Sent Items", "INBOX.Sent"]
        sent_folder = None
        
        for folder in sent_folders:
            try:
                status, _ = mail.select(folder)
                if status == "OK":
                    sent_folder = folder
                    break
            except:
                continue
        
        # If no standard Sent folder found, try to list and find it
        if not sent_folder:
            try:
                status, folders = mail.list()
                if status == "OK":
                    for folder_info in folders:
                        folder_str = folder_info.decode()
                        # Parse folder name from IMAP LIST response
                        parts = folder_str.split(' "/" ')
                        if len(parts) > 1:
                            folder_name = parts[-1].strip('"')
                        else:
                            # Alternative parsing
                            folder_name = folder_str.split('"')[-2] if '"' in folder_str else None
                        
                        if folder_name and 'sent' in folder_name.lower():
                            try:
                                status, _ = mail.select(folder_name)
                                if status == "OK":
                                    sent_folder = folder_name
                                    break
                            except:
                                continue
            except Exception as e:
                print(f"⚠️ Error listing folders: {e}")
                pass
        
        if sent_folder:
            # Convert message to string and append to Sent folder
            msg_str = msg.as_string()
            mail.append(sent_folder, None, None, msg_str.encode('utf-8'))
            print(f"✅ Email saved to Sent folder: {sent_folder}")
        else:
            print("⚠️ Could not find Sent folder, email not saved to Sent (but was sent successfully)")
        
        mail.logout()
    except Exception as e:
        # Don't fail the whole operation if saving to Sent fails
        print(f"⚠️ Could not save email to Sent folder: {e} (email was sent successfully)")

def send_email_with_hostinger(
    from_email: str,
    from_password: str,
    to_email: str,
    subject: str,
    body: str,
    attachment_path: str = None,
    save_to_sent: bool = True
):
    """Send email using Hostinger SMTP and optionally save to Sent folder"""
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

        # Send email using Hostinger SMTP
        with smtplib.SMTP_SSL(HOSTINGER_SMTP_SERVER, HOSTINGER_SMTP_PORT) as server:
            server.login(from_email, from_password)
            server.send_message(msg)
        
        print(f"✅ Email sent to {to_email} from {from_email} via Hostinger")
        
        # Save to Sent folder if requested
        if save_to_sent:
            save_to_sent_folder(from_email, from_password, msg)
        
        return True
    except Exception as e:
        print(f"❌ Hostinger SMTP error: {e}")
        raise

def send_onboarding_email(hr_email: str, hr_name: str, to_email: str, employee_name: str, link: str, nda_path: str, email_account_id: int = None):
    """Send onboarding email using Hostinger and database email account"""
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
        
        # Decrypt password for email sending
        try:
            decrypted_password = decrypt_password(account.password)
        except Exception as e:
            error_msg = f"Could not decrypt email account password: {str(e)}"
            print(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        # Send email using Hostinger
        send_email_with_hostinger(
            from_email=account.email,
            from_password=decrypted_password,
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
    <p><strong>url -</strong> <a href="https://mail.hostinger.com/">https://mail.hostinger.com/</a></p>
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
        
        # Decrypt password for email sending
        try:
            decrypted_password = decrypt_password(account.password)
        except Exception as e:
            error_msg = f"Could not decrypt email account password: {str(e)}"
            print(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        # Send email using Hostinger
        send_email_with_hostinger(
            from_email=account.email,
            from_password=decrypted_password,
            to_email=to_email,
            subject=subject,
            body=body
        )
    finally:
        db.close()