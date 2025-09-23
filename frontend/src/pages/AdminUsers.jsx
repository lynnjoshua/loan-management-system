import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';

function AdminUsers() {
  const { role, token, username, isInitialized } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('AuthContext values:', { role, token, username, isInitialized });

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      // Wait for auth to be initialized
      if (!isInitialized) {
        return;
      }
      
      // Check if user is admin
      if (!token || role !== 'ADMIN') {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        console.log('Attempting to fetch users from API...');
        
        const response = await API.get('/users/');
        console.log('API response:', response);
        
        setUsers(response.data);
      } catch (err) {
        console.error('API error:', err);
        if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response?.status === 403) {
          setError('Access denied. Admin privileges required.');
        } else {
          setError('Failed to fetch users. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [role, token, isInitialized]);

  // Show loading while auth is initializing
  if (!isInitialized) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <p>Initializing authentication...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Debug info */}
      {/* <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold">Debug Information:</h2>
        <p>User Role: {role || 'No role'}</p>
        <p>Username: {username || 'No username'}</p>
        <p>Token Present: {token ? 'Yes' : 'No'}</p>
        <p>Auth Initialized: {isInitialized ? 'Yes' : 'No'}</p>
        <p>Token from localStorage: {localStorage.getItem('token') ? 'Yes' : 'No'}</p>
      </div> */}
      
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-green-50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Username</th>
                <th className="px-4 py-2 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-2 text-center">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-2 border">{user.id}</td>
                    <td className="px-4 py-2 border">{user.username}</td>
                    <td className="px-4 py-2 border">{user.role}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;