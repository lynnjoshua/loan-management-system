# LoanFriend - Loan Management System

A comprehensive full-stack loan management system built with Django REST Framework and React. The system provides complete loan lifecycle management including user registration with KYC approval, loan applications, EMI calculations with amortization schedules, payment processing, and administrative controls.

## Features

### User Management
- **User Registration** with detailed KYC profile information (PAN, Aadhaar, bank details, address)
- **Admin Approval Workflow** - Users remain inactive until approved by administrators
- **Role-Based Access Control** - Separate USER and ADMIN roles with distinct permissions
- **JWT Authentication** - Secure token-based authentication with automatic refresh

### Loan Management
- **Loan Applications** - Users can apply for loans between ₹1,000 and ₹100,000
- **Flexible Tenure** - 3 to 24 months repayment period
- **Fixed Interest Rate** - 10% yearly interest on all loans
- **Loan Limit Enforcement** - Maximum ₹100,000 per user across pending/approved loans
- **Admin Controls** - Approve, reject, or delete loan applications
- **Status Tracking** - PENDING, APPROVED, REJECTED, REJECTED_LIMIT, FORECLOSED, REPAID

### Financial Calculations
- **EMI Calculation** - Automatic calculation using: `P × r × (1+r)^n / ((1+r)^n - 1)`
- **Amortization Schedule** - Complete month-by-month breakdown showing:
  - EMI number and due date
  - Principal and interest components
  - Remaining balance after each payment
- **High-Precision Decimals** - Eliminates floating-point rounding errors

### Payment Processing
- **EMI Payments** - Mock payment gateway for monthly installments
- **Payment History** - Complete audit trail of all transactions
- **Foreclosure** - Early loan settlement option with outstanding balance calculation
- **Duplicate Prevention** - Ensures only one payment per EMI

### Communication & Notifications
- **Email System** - Custom email templates for loan updates
- **WhatsApp Integration** - Twilio-based WhatsApp messaging to users
- **Pre-built Templates** - Approval notifications, payment reminders, document requests
- **Admin-Triggered** - Controlled communication from admin panel

## Tech Stack

### Backend
- **Framework**: Django 5.2.6
- **API**: Django REST Framework 3.15.2
- **Authentication**: Simple JWT (djangorestframework-simplejwt)
- **Database**: SQLite (development), PostgreSQL-ready for production
- **Communication**: Twilio (WhatsApp), Django Email
- **Additional**: django-cors-headers, django-filter, Pillow, python-dotenv

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 6.0.11
- **Routing**: React Router v7.1.4
- **HTTP Client**: Axios 1.7.9
- **Styling**: TailwindCSS 3.4.17
- **Icons**: Lucide React 0.468.0
- **Notifications**: SweetAlert2 11.15.2
- **Token Handling**: jwt-decode 4.0.0

## Project Structure

```
loan-management-system/
├── backend/
│   ├── config/                 # Django project settings
│   │   ├── settings.py        # JWT, CORS, database configuration
│   │   ├── urls.py            # Root URL routing
│   │   └── wsgi.py            # WSGI application
│   ├── users/                 # User management app
│   │   ├── models.py          # User and UserProfile models
│   │   ├── views.py           # Registration, login, user approval
│   │   ├── serializers.py     # JWT custom serializers
│   │   └── urls.py            # Authentication endpoints
│   ├── loans/                 # Loan management app
│   │   ├── models.py          # Loan and Payment models
│   │   ├── views.py           # Loan CRUD, payments, admin actions
│   │   ├── serializers.py     # Loan and payment serializers
│   │   ├── services.py        # EMI calculations, amortization logic
│   │   ├── permissions.py     # Custom permission classes
│   │   ├── notifications.py   # Email and WhatsApp utilities
│   │   └── urls.py            # Loan endpoints
│   ├── manage.py              # Django management CLI
│   ├── requirements.txt       # Python dependencies
│   └── db.sqlite3             # SQLite database (dev)
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # Route components
│   │   │   ├── Login.jsx              # User login
│   │   │   ├── Signup.jsx             # User registration
│   │   │   ├── Dashboard2.jsx         # User dashboard
│   │   │   ├── LoanForm.jsx           # Loan application form
│   │   │   ├── AdminLogin.jsx         # Admin authentication
│   │   │   ├── AdminDashboard.jsx     # Admin overview
│   │   │   ├── AdminLoanlist.jsx      # Loan management
│   │   │   ├── AdminUsers.jsx         # User management
│   │   │   └── AdminApprove.jsx       # Approval queue
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Navbar.jsx, AdminNavbar.jsx
│   │   │   ├── LoanCard.jsx, LoansList.jsx
│   │   │   ├── StatsCard.jsx, DashboardHeader.jsx
│   │   │   ├── ScheduleModal.jsx      # Amortization viewer
│   │   │   ├── NewLoanModal.jsx
│   │   │   ├── ContactModal.jsx
│   │   │   └── [Other components]
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # JWT and user state management
│   │   ├── api/
│   │   │   └── axios.js      # API client with interceptors
│   │   ├── hooks/            # Custom React hooks
│   │   ├── utils/            # Helper functions
│   │   ├── App.jsx           # Main routing configuration
│   │   └── main.jsx          # React entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── Readme/
    └── README.md             # This file
```

## Prerequisites

- **Python**: 3.13+ (recommended)
- **Node.js**: 18+ (with npm or yarn)
- **Git**: For version control
- **Twilio Account** (optional): For WhatsApp notifications

## Installation & Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables** (Optional)

   Create a `.env` file in the backend directory:
   ```env
   # Email Configuration
   EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password

   # Twilio Configuration (for WhatsApp)
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

6. **Run database migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Create superuser (admin)**
   ```bash
   python manage.py createsuperuser
   ```
   - Enter username, email, and password
   - This creates an admin user with full access

8. **Run development server**
   ```bash
   python manage.py runserver
   ```
   Backend will be available at: `http://127.0.0.1:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure API URL** (Optional)

   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```

4. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Frontend will be available at: `http://localhost:5173`

## Running the Application

1. **Start Backend** (in backend directory):
   ```bash
   python manage.py runserver
   ```

2. **Start Frontend** (in frontend directory):
   ```bash
   npm run dev
   ```

3. **Access the Application**:
   - User Interface: `http://localhost:5173`
   - Admin Interface: `http://localhost:5173/admin/login`
   - Django Admin Panel: `http://127.0.0.1:8000/admin`
   - API Root: `http://127.0.0.1:8000/api`

## API Endpoints

### Authentication (`/api/auth/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register/` | Register new user with profile | No |
| POST | `/login/` | Login and get JWT tokens | No |
| POST | `/token/refresh/` | Refresh access token | No |
| GET | `/users/me/` | Get current user profile | Yes |
| GET | `/users/` | List all users | Admin |
| POST | `/users/<id>/approve/` | Approve user account | Admin |
| POST | `/users/<id>/suspend/` | Suspend user account | Admin |
| GET | `/users/<id>/profile/` | Get specific user profile | Admin |

### Loan Management (`/api/loans/`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | List loans (filtered by role) | Yes |
| POST | `/` | Create new loan application | Yes |
| GET | `/<id>/` | Get loan details | Yes |
| DELETE | `/<id>/` | Delete loan (no payments) | Admin |
| GET | `/<id>/schedule/` | Get amortization schedule | Yes |
| GET | `/<id>/next-payment/` | Get next due payment | Yes |
| GET | `/<id>/payments/` | Get all loan payments | Yes |
| POST | `/<id>/pay/` | Make EMI payment | Yes |
| GET | `/<id>/foreclose/` | Preview foreclosure amount | Yes |
| POST | `/<id>/foreclose/` | Foreclose loan | Yes |
| POST | `/<id>/approve/` | Approve loan | Admin |
| POST | `/<id>/reject/` | Reject loan | Admin |
| POST | `/<id>/send-email/` | Send email notification | Admin |
| POST | `/<id>/send-whatsapp/` | Send WhatsApp message | Admin |

### Request/Response Examples

**User Registration:**
```json
POST /api/auth/register/
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone_number": "+919876543210",
  "bank_account_number": "1234567890123456",
  "ifsc_code": "SBIN0001234",
  "address_line_1": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pin_code": "400001",
  "date_of_birth": "1990-01-15",
  "pan_number": "ABCDE1234F",
  "aadhaar_number": "123456789012"
}
```

**Loan Application:**
```json
POST /api/loans/
{
  "amount": 50000,
  "tenure": 12
}

Response:
{
  "id": 1,
  "amount": "50000.00",
  "tenure": 12,
  "interest_rate": "10.00",
  "monthly_installment": "4398.26",
  "total_payable": "52779.12",
  "total_interest": "2779.12",
  "status": "PENDING",
  "applied_date": "2025-10-16T10:30:00Z",
  "amortization_schedule": [...]
}
```

**Make Payment:**
```json
POST /api/loans/1/pay/
{
  "emi_number": 1
}

Response:
{
  "message": "Payment successful for EMI 1",
  "payment": {
    "id": 1,
    "amount": "4398.26",
    "payment_date": "2025-10-16T11:00:00Z",
    "emi_number": 1,
    "status": "SUCCESS",
    "gateway_reference": "PAY_123456789"
  }
}
```

## User Roles & Permissions

### USER Role
- Register and create profile
- Apply for loans (within limit)
- View own loans and payment history
- Make EMI payments
- View amortization schedules
- Request foreclosure
- Update profile information

### ADMIN Role
- All USER permissions
- Approve/reject user registrations
- Approve/reject loan applications
- View all users and their profiles
- View all loans across the system
- Delete loans (without payment history)
- Send email notifications to users
- Send WhatsApp messages to users
- Suspend user accounts
- Access full system statistics

## Database Models

### User
- Standard Django User model extended with:
- `role`: Choice field (ADMIN, USER)
- Built-in fields: username, email, password, is_active, date_joined

### UserProfile
- `user`: OneToOne with User
- `phone_number`: Contact number
- `bank_account_number`: Bank account for disbursements
- `ifsc_code`: Bank IFSC code
- `address_line_1`, `address_line_2`, `city`, `state`, `pin_code`: Address details
- `date_of_birth`: DOB for KYC
- `pan_number`, `aadhaar_number`: Identity documents
- `status`: PENDING, APPROVED, SUSPENDED
- `created_at`, `updated_at`: Timestamps

### Loan
- `user`: ForeignKey to User
- `amount`: Decimal (1,000 - 100,000)
- `tenure`: Integer (3 - 24 months)
- `interest_rate`: Decimal (default 10.00%)
- `monthly_installment`: Auto-calculated EMI
- `total_payable`: Amount + Interest
- `total_interest`: Total interest payable
- `status`: PENDING, APPROVED, REJECTED, REJECTED_LIMIT, FORECLOSED, REPAID
- `is_closed`: Boolean flag
- `applied_date`, `approved_date`: Timestamps
- `approved_by`: ForeignKey to Admin User
- `rejection_reason`: Text field
- `foreclosure_date`, `foreclosure_amount`: For early settlement
- `amortization_schedule`: JSON field with payment breakdown

### Payment
- `loan`: ForeignKey to Loan
- `amount`: Payment amount
- `payment_date`: Auto-timestamp
- `emi_number`: Which EMI (1-24)
- `status`: PENDING, SUCCESS, FAILED
- `payment_type`: EMI or FORECLOSURE
- `gateway_reference`: Mock gateway transaction ID
- `gateway_response`: JSON response from gateway
- Unique constraint: (loan, emi_number) - prevents duplicate payments

## Key Features Deep Dive

### EMI Calculation Formula

```python
# Monthly interest rate
r = (interest_rate / 100) / 12

# Number of payments
n = tenure

# EMI Formula
EMI = P × r × (1+r)^n / ((1+r)^n - 1)

# Where:
# P = Principal loan amount
# r = Monthly interest rate
# n = Number of months
```

**Example**: ₹50,000 loan for 12 months at 10% yearly:
- Monthly rate (r) = 10% / 12 = 0.00833
- EMI = ₹4,398.26
- Total payable = ₹52,779.12
- Total interest = ₹2,779.12

### Amortization Schedule

Each month's payment breakdown:

| EMI | Due Date | EMI Amount | Principal | Interest | Balance |
|-----|----------|------------|-----------|----------|---------|
| 1 | 2025-11-16 | ₹4,398.26 | ₹3,981.59 | ₹416.67 | ₹46,018.41 |
| 2 | 2025-12-16 | ₹4,398.26 | ₹4,014.76 | ₹383.50 | ₹42,003.65 |
| ... | ... | ... | ... | ... | ... |
| 12 | 2026-10-16 | ₹4,398.26 | ₹4,361.71 | ₹36.55 | ₹0.00 |

**Key Points**:
- Interest component decreases over time
- Principal component increases over time
- Uses high-precision Decimal arithmetic (28 decimal places)
- Handles month-end edge cases (Feb 30 → Feb 28/29)

### Loan Limit Enforcement

**Rule**: Maximum ₹100,000 per user across PENDING + APPROVED loans

**Validation Points**:
1. During loan creation (before saving)
2. During admin approval (before status change)

**Example**:
- User has ₹60,000 APPROVED loan
- User applies for ₹50,000 new loan
- Result: Application rejected with status REJECTED_LIMIT
- Reason: ₹60,000 + ₹50,000 = ₹110,000 > ₹100,000 limit

**Allowed Loans**:
- FORECLOSED loans don't count toward limit
- REPAID loans don't count toward limit
- REJECTED loans don't count toward limit

### Foreclosure Process

**Purpose**: Allow users to close loans early by paying remaining principal

**Calculation**:
```python
# Outstanding = Remaining principal only (not future interest)
outstanding = sum(schedule[remaining_emis]['principal'])
```

**Example**:
- Loan: ₹50,000 for 12 months
- Paid: 6 EMIs
- Remaining Principal: ₹25,123.45
- Foreclosure Amount: ₹25,123.45 (not ₹26,389.56 with interest)

**Process**:
1. User requests foreclosure preview (`GET /api/loans/<id>/foreclose/`)
2. System calculates outstanding principal
3. User confirms and pays (`POST /api/loans/<id>/foreclose/`)
4. Payment recorded with type=FORECLOSURE
5. Loan status changed to FORECLOSED
6. Remaining EMIs cleared

## Configuration

### JWT Settings (config/settings.py)

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
}
```

### CORS Settings

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:8000",
]
```

### Email Configuration

For Gmail SMTP:
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'  # Use App Password, not regular password
```

For development (console output):
```python
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

### Twilio WhatsApp Configuration

```python
# In .env file
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886  # Twilio Sandbox number
```

**Usage in code**:
```python
from twilio.rest import Client

client = Client(account_sid, auth_token)
message = client.messages.create(
    from_=twilio_whatsapp_from,
    body='Your loan has been approved!',
    to='whatsapp:+919876543210'
)
```

## Development Notes

### Database Migration

After model changes:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Creating Admin User

```bash
python manage.py createsuperuser
```

Then manually update the user's role to 'ADMIN' in Django admin or database.

### Running Tests

```bash
# Backend tests
python manage.py test

# Frontend tests
npm run test
```

### Production Checklist

- [ ] Change `DEBUG = False` in settings.py
- [ ] Set proper `SECRET_KEY` (use environment variable)
- [ ] Configure production database (PostgreSQL recommended)
- [ ] Set up proper email backend (SMTP)
- [ ] Configure Twilio for production WhatsApp
- [ ] Update `ALLOWED_HOSTS` with production domain
- [ ] Update CORS origins with production frontend URL
- [ ] Set up static file serving (whitenoise or CDN)
- [ ] Enable HTTPS and secure cookies
- [ ] Configure proper JWT token lifetimes
- [ ] Set up logging and monitoring
- [ ] Use environment variables for all secrets

### Common Issues

**Issue**: CORS errors when accessing API
- **Solution**: Ensure frontend URL is in `CORS_ALLOWED_ORIGINS`

**Issue**: Token expired errors
- **Solution**: Use refresh token endpoint to get new access token

**Issue**: Loan limit validation failing
- **Solution**: Check sum of user's PENDING + APPROVED loans

**Issue**: WhatsApp messages not sending
- **Solution**: Verify Twilio credentials and phone number format (E.164: +919876543210)

**Issue**: Amortization schedule showing incorrect balances
- **Solution**: System uses high-precision Decimals - verify tenure and amount inputs

## API Authentication

All authenticated endpoints require JWT token in header:

```javascript
// JavaScript example
const config = {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
};

axios.get('http://127.0.0.1:8000/api/loans/', config);
```

**Token Refresh Flow**:
1. Access token expires (401 error)
2. Send refresh token to `/api/auth/token/refresh/`
3. Receive new access token
4. Retry original request with new token

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- **Backend**: Follow PEP 8 guidelines
- **Frontend**: Use ESLint and Prettier configurations
- Write meaningful commit messages
- Add comments for complex logic
- Write unit tests for new features

## License

This project is licensed under the MIT License 

## Acknowledgments

- Django REST Framework for robust API development
- React team for excellent frontend framework
- Twilio for reliable communication APIs
- All contributors and testers

---

**Built with ❤️ by Lynn**

*Last Updated: October 2025*
