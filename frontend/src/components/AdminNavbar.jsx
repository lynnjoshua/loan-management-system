import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

function AdminNavbar() {
  const { logout, user } = useContext(AuthContext);
  const location = useLocation();

  // Navigation items
  const navItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/loans', label: 'Loans' },
  ];

  return (
    <header className="bg-green-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between py-3">
          {/* Brand and toggle button */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <h1 className="text-2xl font-bold">Loan Management Admin</h1>
            <button className="md:hidden p-2 rounded-md hover:bg-green-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Navigation and user info */}
          <div className="w-full md:w-auto mt-4 md:mt-0 flex flex-col md:flex-row items-center">
            {/* Navigation links */}
            <nav className="w-full md:w-auto mb-4 md:mb-0">
              <ul className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`block px-3 py-2 rounded-md transition-colors ${
                        location.pathname === item.path
                          ? 'bg-green-700 text-white'
                          : 'text-white hover:bg-green-700'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* User info and logout */}
            <div className="flex items-center space-x-4 border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto justify-between md:justify-start">
              <span className="text-sm">Welcome, {user?.username || 'Admin'}</span>
              <button
                onClick={logout}
                className="bg-green-700 text-white px-4 py-2 rounded-lg shadow hover:bg-green-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminNavbar;