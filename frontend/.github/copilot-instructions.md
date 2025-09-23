# AI Agent Instructions for Loan Management System Frontend

## Project Overview
This is a React-based loan management system frontend built with Vite. The application handles user authentication, loan management, and administrative functions with a role-based access control system.

## Key Architecture Patterns

### Authentication Flow
- Uses Context API for auth state management (`src/context/AuthContext.jsx`)
- JWT tokens stored in localStorage with role-based access control
- Auto-attaches tokens to API requests via axios interceptors (`src/api/axios.js`)
- Example usage: `const { token, role, username } = useContext(AuthContext);`

### API Integration
- Centralized API setup in `src/api/axios.js`
- Base URL configured via environment variable: `VITE_API_URL`
- Default fallback: `http://127.0.0.1:8000/api`
- All API calls should use the `API` instance for consistent auth handling

### Component Structure
- Pages: Complex views in `src/pages/`
- Components: Reusable UI elements in `src/components/`
- Naming convention: PascalCase for components (e.g., `AdminDashboard.jsx`)
- Common pattern: Role-specific components prefixed with role name (e.g., `Admin*`)

### State Management
- Use AuthContext for auth-related state
- Local component state for UI-specific data
- Loading/error states follow pattern:
```jsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
```

## Development Workflow

### Setup
```bash
npm install
npm run dev
```

### Environment Configuration
- Create `.env` file with:
  ```
  VITE_API_URL=http://your-api-url
  ```

### Common Commands
- Development: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Preview build: `npm run preview`

## Key Integration Points

### Backend API Endpoints
- Authentication: `/api/login/`, `/api/register/`
- Loan Management: `/api/loans/`
- User Management: `/api/users/`

### Role-Based Access
- Two main roles: "ADMIN" and "USER"
- Admin-specific routes in `AdminDashboard.jsx`
- User-specific routes in `Dashboard.jsx`

## Common Patterns

### Error Handling
```jsx
try {
  // API call
} catch (err) {
  console.error("Error:", err?.response ?? err?.message ?? err);
  setError(err?.response?.data?.detail || "Friendly error message");
} finally {
  setLoading(false);
}
```

### Data Fetching
- Use useEffect for data fetching
- Include loading and error states
- Optional dependency on auth token for protected routes

### Form Handling
- Controlled components with useState
- Form submission with preventDefault()
- Disable submit button while processing