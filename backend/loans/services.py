from decimal import Decimal, getcontext, ROUND_HALF_UP
from datetime import date

# Set high precision for financial calculations (avoids rounding errors)
getcontext().prec = 28  # 28 decimal places for intermediate math

def _round_to_paise(value: Decimal) -> Decimal:
    """
    Round to 2 decimal places (like Indian rupees and paise)
    Example: ₹100.456 becomes ₹100.46
    """
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def calculate_emi(loan_amount: Decimal, months: int, yearly_interest: Decimal):
    """
    Calculate EMI (Equated Monthly Installment) using compound interest formula
    Formula: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
    
    Simple Explanation:
    - P = Loan Amount (Principal)
    - r = Monthly Interest Rate (Yearly Rate ÷ 12 ÷ 100)
    - n = Number of Months (Tenure)
    
    Returns: (monthly_emi, total_amount, total_interest)
    """
    principal = Decimal(loan_amount)
    tenure = int(months)
    
    # Convert yearly interest to monthly decimal (10% yearly → 0.833% monthly)
    monthly_rate = (Decimal(yearly_interest) / Decimal("100")) / Decimal("12")
    
    # Special case: If interest is 0%, just divide loan by months
    if monthly_rate == 0:
        emi = principal / Decimal(tenure)
        total_amount = principal
    else:
        # Compound interest formula
        power = (Decimal("1") + monthly_rate) ** Decimal(tenure)
        emi = principal * monthly_rate * power / (power - Decimal("1"))
        total_amount = emi * Decimal(tenure)
    
    total_interest = total_amount - principal
    
    # Round to rupees and paise (2 decimal places)
    return (_round_to_paise(emi), 
            _round_to_paise(total_amount), 
            _round_to_paise(total_interest))

def _add_months_safe(start_date: date, months_to_add: int) -> date:
    """
    Safely add months to a date (handles month-end issues)
    Example: Jan 31 + 1 month = Feb 28 (not invalid Feb 31)
    """
    # Calculate new year and month
    new_year = start_date.year + (start_date.month - 1 + months_to_add) // 12
    new_month = (start_date.month - 1 + months_to_add) % 12 + 1
    
    # Try to keep the same day, but adjust if invalid (like Feb 30)
    original_day = start_date.day
    
    # Check valid days in descending order (31, 30, 29, 28)
    for day_option in (31, 30, 29, 28):
        try:
            return date(new_year, new_month, min(original_day, day_option))
        except ValueError:
            continue  # Try next smaller day
    
    # Fallback (should rarely happen)
    return date(new_year, new_month, 28)


#------- Amortization Schedule Generation --------

def generate_amortization_schedule(loan_amount: Decimal, months: int,
                                   yearly_interest: Decimal, start_date: date = None):
    """
    Returns a list of monthly payment entries that are JSON-serializable:
    - due_date as ISO string "YYYY-MM-DD"
    - amounts as floats
    """
    # If you have a calculate_emi function, call it; otherwise compute EMI here.
    # This assumes calculate_emi(loan_amount, months, yearly_interest) exists and returns
    # (emi_decimal, total_payable_decimal, total_interest_decimal)
    emi, total_payable, total_interest = calculate_emi(loan_amount, months, yearly_interest)

    monthly_rate = (Decimal(yearly_interest) / Decimal("100")) / Decimal("12")

    if start_date is None:
        start_date = date.today()

    schedule = []
    remaining_balance = Decimal(loan_amount)
    emi_value = _round_to_paise(emi)

    for month in range(1, months + 1):
        interest = _round_to_paise(remaining_balance * monthly_rate)
        principal = _round_to_paise(emi_value - interest)

        # If last month, clear out any small rounding residue
        if month == months:
            principal = remaining_balance
            emi_value = _round_to_paise(principal + interest)

        remaining_balance = _round_to_paise(remaining_balance - principal)

        # Convert date to ISO string and Decimal to float so JSON can handle it
        # EMI starts from next month after approval (month, not month-1)
        due_date_iso = _add_months_safe(start_date, month).isoformat()

        schedule.append({
            "emi_number": month,
            "due_date": due_date_iso,                    # string like "2025-09-26"
            "emi_amount": float(_round_to_paise(emi_value)),   # float like 4500.12
            "principal": float(principal),
            "interest": float(interest),
            "remaining_balance": float(remaining_balance)
        })

    return schedule