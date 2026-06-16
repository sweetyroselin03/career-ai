import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

def send_otp_email(to_email: str, otp: str, purpose: str) -> bool:
    server = os.getenv("MAIL_SERVER", "smtp-relay.brevo.com")
    try:
        port = int(os.getenv("MAIL_PORT", 587))
    except ValueError:
        port = 587
        
    username = os.getenv("MAIL_USERNAME")
    password = os.getenv("MAIL_PASSWORD")
    sender = os.getenv("MAIL_DEFAULT_SENDER", "noreply@careerai.com")

    if not username or not password:
        logger.error("[EMAIL-SERVICE] MAIL_USERNAME or MAIL_PASSWORD environment variables are not set.")
        # Fallback to console print for development if SMTP variables are empty
        logger.warning(f"[EMAIL-SERVICE] DEVELOPMENT FALLBACK - Email to {to_email} with OTP: {otp} (Purpose: {purpose})")
        return True

    subject = ""
    purpose_text = ""
    
    if purpose == 'register':
        subject = "CareerAI - Verify Your Registration"
        purpose_text = "verify your registration and set up your CareerAI profile"
    elif purpose == 'login':
        subject = "CareerAI - OTP Authentication Code"
        purpose_text = "sign in to your CareerAI account"
    elif purpose == 'forgot_password':
        subject = "CareerAI - Password Reset OTP"
        purpose_text = "reset your CareerAI password"
    else:
        subject = "CareerAI - Security OTP Code"
        purpose_text = "verify your security credentials"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #f8fafc;
                color: #1e293b;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 550px;
                margin: 40px auto;
                background-color: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                padding: 32px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
            }}
            .logo {{
                font-size: 22px;
                font-weight: 800;
                color: #3b82f6;
                text-decoration: none;
                display: block;
                text-align: center;
                margin-bottom: 24px;
            }}
            .title {{
                font-size: 18px;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 16px;
                text-align: center;
            }}
            .message {{
                font-size: 14px;
                line-height: 1.6;
                color: #475569;
                margin-bottom: 24px;
                text-align: center;
            }}
            .otp-box {{
                background-color: #f1f5f9;
                border: 1px dashed #cbd5e1;
                border-radius: 12px;
                padding: 18px;
                text-align: center;
                margin: 24px 0;
            }}
            .otp-code {{
                font-size: 32px;
                font-weight: 800;
                letter-spacing: 6px;
                color: #0f172a;
                margin: 0;
            }}
            .validity {{
                font-size: 12px;
                color: #64748b;
                text-align: center;
                margin-top: 8px;
            }}
            .footer {{
                text-align: center;
                margin-top: 32px;
                font-size: 11px;
                color: #94a3b8;
                border-top: 1px solid #f1f5f9;
                padding-top: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <a href="#" class="logo">CareerAI Navigator</a>
            <div class="title">Verify Your Email Address</div>
            <div class="message">
                Hello, <br/><br/>
                We received a request to {purpose_text}. Please enter the following 6-digit verification code:
            </div>
            <div class="otp-box">
                <div class="otp-code">{otp}</div>
                <div class="validity">Expires in 10 minutes</div>
            </div>
            <div class="message" style="font-size: 12px; color: #64748b;">
                If you did not initiate this request, you can safely ignore this email.
            </div>
            <div class="footer">
                &copy; 2026 CareerAI. All rights reserved.<br/>
                Automated email. Please do not reply directly.
            </div>
        </div>
    </body>
    </html>
    """

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"CareerAI Navigator <{sender}>"
    msg['To'] = to_email
    msg.attach(MIMEText(html_content, 'html'))

    try:
        smtp = smtplib.SMTP(server, port)
        smtp.starttls()
        smtp.login(username, password)
        smtp.sendmail(sender, to_email, msg.as_string())
        smtp.quit()
        logger.info(f"[EMAIL-SERVICE] OTP email successfully sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"[EMAIL-SERVICE] Failed to send email to {to_email} via SMTP: {e}")
        # Return True for development environment, but log it
        if os.getenv("FLASK_ENV") == "development" or "localhost" in server:
            logger.warning(f"[EMAIL-SERVICE] Development fallback: {otp} printed due to SMTP failure.")
            return True
        return False
