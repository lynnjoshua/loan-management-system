"""
Email and WhatsApp notification utilities for loan management system
"""
import logging
import re
from django.core.mail import send_mail, BadHeaderError
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_loan_email(loan, subject, message, admin_user):
    """
    Send an email to the loan user from an admin.

    Args:
        loan: Loan object
        subject: Email subject line
        message: Email message body (plain text)
        admin_user: Admin user sending the email

    Returns:
        tuple: (success: bool, error_message: str or None)
    """
    # Validate loan user has an email
    if not loan.user or not loan.user.email:
        return False, "User does not have an email address"

    recipient_email = loan.user.email

    # Validate subject and message
    if not subject or not subject.strip():
        return False, "Email subject cannot be empty"

    if not message or not message.strip():
        return False, "Email message cannot be empty"

    # Prepare email content
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [recipient_email]

    # Create a formatted email body
    email_body = f"""
{message}

---
Loan Details:
- Loan ID: #{loan.id}
- Amount: ₹{loan.amount:,.2f}
- Status: {loan.get_status_display()}
- Tenure: {loan.tenure} months
- Monthly EMI: ₹{loan.monthly_installment:,.2f}

---
This email was sent by {admin_user.username} from LoanFriend Loan Management System.
Please do not reply to this email.
    """.strip()

    try:
        # Send email using Django's send_mail
        sent_count = send_mail(
            subject=subject,
            message=email_body,
            from_email=from_email,
            recipient_list=recipient_list,
            fail_silently=False,
        )

        if sent_count > 0:
            logger.info(
                f"Email sent successfully to {recipient_email} "
                f"for loan #{loan.id} by admin {admin_user.username}"
            )
            return True, None
        else:
            logger.error(f"Email sending failed - send_mail returned 0")
            return False, "Email sending failed - no emails were sent"

    except BadHeaderError:
        error_msg = "Invalid header found in email"
        logger.error(f"BadHeaderError when sending email to {recipient_email}: {error_msg}")
        return False, error_msg

    except Exception as e:
        error_msg = str(e)
        logger.error(
            f"Error sending email to {recipient_email} for loan #{loan.id}: {error_msg}",
            exc_info=True
        )
        return False, f"Email sending failed: {error_msg}"


def get_email_context(loan):
    """
    Get context data for email templates

    Args:
        loan: Loan object

    Returns:
        dict: Context dictionary with loan and user data
    """
    context = {
        'loan_id': loan.id,
        'user_name': loan.user.get_full_name() or loan.user.username if loan.user else 'User',
        'amount': loan.amount,
        'tenure': loan.tenure,
        'interest_rate': loan.interest_rate,
        'monthly_installment': loan.monthly_installment,
        'total_payable': loan.total_payable,
        'status': loan.get_status_display(),
        'applied_date': loan.applied_date.strftime('%B %d, %Y'),
    }

    if loan.approved_date:
        context['approved_date'] = loan.approved_date.strftime('%B %d, %Y')

    return context


# Pre-defined email templates for common scenarios
EMAIL_TEMPLATES = {
    'approval': {
        'subject': 'Loan Application Approved - Loan #{loan_id}',
        'message': '''Dear {user_name},

Congratulations! Your loan application has been approved.

Your loan of ₹{amount} has been approved with the following details:
- Monthly EMI: ₹{monthly_installment}
- Tenure: {tenure} months
- Interest Rate: {interest_rate}%

You can now start making EMI payments through your dashboard.

Thank you for choosing LoanFriend!'''
    },
    'payment_reminder': {
        'subject': 'Payment Reminder - Loan #{loan_id}',
        'message': '''Dear {user_name},

This is a friendly reminder that your loan payment is due soon.

Loan Details:
- Loan ID: #{loan_id}
- Monthly EMI: ₹{monthly_installment}
- Status: {status}

Please ensure timely payment to avoid late fees.

Thank you!'''
    },
    'document_request': {
        'subject': 'Additional Documents Required - Loan #{loan_id}',
        'message': '''Dear {user_name},

We need additional documents to process your loan application (Loan #{loan_id}).

Please upload the required documents through your dashboard or contact us for assistance.

Thank you for your cooperation!'''
    }
}


def get_template_message(template_name, loan):
    """
    Get a pre-formatted email message from template

    Args:
        template_name: Name of the template (e.g., 'approval', 'payment_reminder')
        loan: Loan object

    Returns:
        tuple: (subject, message) or (None, None) if template not found
    """
    if template_name not in EMAIL_TEMPLATES:
        return None, None

    template = EMAIL_TEMPLATES[template_name]
    context = get_email_context(loan)

    subject = template['subject'].format(**context)
    message = template['message'].format(**context)

    return subject, message


# ==================== WHATSAPP FUNCTIONS ====================

def format_phone_number_e164(phone_number):
    """
    Format phone number to E.164 format for Twilio

    Args:
        phone_number: Phone number string (e.g., "9876543210", "+919876543210")

    Returns:
        str: Formatted phone number with whatsapp: prefix (e.g., "whatsapp:+919876543210")
        None: If phone number is invalid
    """
    if not phone_number:
        return None

    # Remove all non-digit characters except +
    cleaned = re.sub(r'[^\d+]', '', str(phone_number))

    # If it doesn't start with +, assume it's Indian number and add +91
    if not cleaned.startswith('+'):
        # Validate Indian number has exactly 10 digits
        if len(cleaned) != 10:
            logger.warning(f"Invalid Indian phone number length: {len(cleaned)} digits (expected 10)")
            return None
        # Assume Indian number (you can modify this logic for your country)
        cleaned = f'+91{cleaned}'

    # Validate E.164 format (+ followed by 1-15 digits)
    if re.match(r'^\+\d{1,15}$', cleaned):
        return f'whatsapp:{cleaned}'

    return None


def send_loan_whatsapp(loan, message, admin_user):
    """
    Send a WhatsApp message to the loan user via Twilio

    Args:
        loan: Loan object
        message: WhatsApp message text
        admin_user: Admin user sending the message

    Returns:
        tuple: (success: bool, error_message: str or None)
    """
    # Validate loan user has a phone number
    if not loan.user:
        return False, "This loan has no associated user"

    # Get phone number from user profile
    try:
        if not hasattr(loan.user, 'profile') or not loan.user.profile:
            return False, "User does not have a profile with phone number"

        phone_number = loan.user.profile.phone_number
        if not phone_number:
            return False, "User does not have a phone number on file"
    except Exception as e:
        logger.error(f"Error accessing user profile for loan #{loan.id}: {str(e)}")
        return False, "Could not access user phone number"

    # Validate message
    if not message or not message.strip():
        return False, "WhatsApp message cannot be empty"

    # Format phone number to E.164 format
    formatted_phone = format_phone_number_e164(phone_number)
    if not formatted_phone:
        return False, f"Invalid phone number format: {phone_number}"

    # Check if Twilio is configured
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        return False, "Twilio is not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env"

    if not settings.TWILIO_WHATSAPP_FROM:
        return False, "Twilio WhatsApp sender number is not configured. Please add TWILIO_WHATSAPP_FROM to .env (e.g., whatsapp:+14155238886 for sandbox)"

    # Prepare WhatsApp message with loan details
    whatsapp_body = f"""
{message}

---
*Loan Details:*
• Loan ID: #{loan.id}
• Amount: ₹{loan.amount:,.2f}
• Status: {loan.get_status_display()}
• Monthly EMI: ₹{loan.monthly_installment:,.2f}

---
_Message sent by {admin_user.username} from LoanFriend Loan Management_
    """.strip()

    # Send WhatsApp message using Twilio
    try:
        from twilio.rest import Client
        from twilio.base.exceptions import TwilioRestException

        # Initialize Twilio client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        # Send message
        twilio_message = client.messages.create(
            body=whatsapp_body,
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=formatted_phone
        )

        logger.info(
            f"WhatsApp sent successfully to {formatted_phone} "
            f"for loan #{loan.id} by admin {admin_user.username}. "
            f"Twilio SID: {twilio_message.sid}"
        )

        return True, None

    except TwilioRestException as e:
        error_msg = f"Twilio API error: {e.msg}"
        logger.error(
            f"TwilioRestException when sending WhatsApp to {formatted_phone}: "
            f"Code {e.code}, Message: {e.msg}"
        )

        # Provide user-friendly error messages
        if e.code == 21211:
            return False, "Invalid phone number format"
        elif e.code == 21608:
            return False, "Phone number is not registered with WhatsApp or hasn't joined Twilio sandbox"
        elif e.code == 21606:
            return False, "Phone number cannot receive WhatsApp messages"
        else:
            return False, error_msg

    except ImportError:
        error_msg = "Twilio package is not installed. Run: pip install twilio"
        logger.error(error_msg)
        return False, error_msg

    except Exception as e:
        error_msg = str(e)
        logger.error(
            f"Error sending WhatsApp to {formatted_phone} for loan #{loan.id}: {error_msg}",
            exc_info=True
        )
        return False, f"WhatsApp sending failed: {error_msg}"
