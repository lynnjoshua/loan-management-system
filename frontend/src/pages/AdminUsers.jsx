import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api/axios';

function AdminUsers() {
  const { role, token, username, isInitialized } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState({});
  const [suspending, setSuspending] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Filter out admin users
  const filteredUsers = users.filter(user => user.role !== 'ADMIN');

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isInitialized) return;
      
      if (!token || role !== 'ADMIN') {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await API.get('/auth/users/');
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

  // Open user profile modal and fetch detailed profile data
  const openUserProfile = async (user) => {
    setSelectedUser(user);
    setProfileLoading(true);
    setProfileError('');
    setIsModalOpen(true);

    try {
      const response = await API.get(`/auth/users/${user.id}/profile/`);
      setSelectedUser(prev => ({
        ...prev,
        ...response.data,
        profile: response.data.profile
      }));
    } catch (err) {
      console.error('Profile fetch error:', err);
      setProfileError('Failed to load user profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setProfileError('');
  };

  // Approve user function
  const approveUser = async (userId) => {
    if (!token || role !== 'ADMIN') {
      setError('Access denied. Admin privileges required.');
      return;
    }

    try {
      setApproving(prev => ({ ...prev, [userId]: true }));
      setError('');

      await API.post(`/auth/users/${userId}/approve/`);
      
      // Update the user list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                is_active: true,
                profile: user.profile ? { ...user.profile, status: "APPROVED" } : null
              } 
            : user
        )
      );
      
      closeModal();
      
    } catch (err) {
      console.error('Approval error:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to approve user. Please try again.');
      }
    } finally {
      setApproving(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Suspend user function - UPDATED FOR NEW STATUS
  const suspendUser = async (userId) => {
    if (!token || role !== 'ADMIN') {
      setError('Access denied. Admin privileges required.');
      return;
    }

    try {
      setSuspending(prev => ({ ...prev, [userId]: true }));
      setError('');

      await API.post(`/auth/users/${userId}/suspend/`);
      
      // Update the user list with suspended status
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                is_active: false,
                profile: user.profile ? { ...user.profile, status: "SUSPENDED" } : null
              } 
            : user
        )
      );
      
    } catch (err) {
      console.error('Suspension error:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to suspend user. Please try again.');
      }
    } finally {
      setSuspending(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Get status display text and color
  const getStatusInfo = (user) => {
    if (user.profile?.status === 'SUSPENDED') {
      return { text: 'Suspended', color: 'bg-red-100 text-red-800' };
    }
    if (user.is_active) {
      return { text: 'Active', color: 'bg-green-100 text-green-800' };
    }
    return { text: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' };
  };

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

      {/* User Profile Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">User Profile: {selectedUser.username}</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Modal Body - User Profile Data */}
            <div className="p-6">
              {profileLoading ? (
                <div className="text-center py-8">
                  <p>Loading profile details...</p>
                </div>
              ) : profileError ? (
                <div className="text-center py-4">
                  <p className="text-red-500">{profileError}</p>
                </div>
              ) : (
                <>
                  {/* Basic User Information */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-green-600">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Username</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.username}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Account Status</label>
                        <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          selectedUser.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedUser.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Profile Status</label>
                        <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          selectedUser.profile?.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-800' 
                            : selectedUser.profile?.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedUser.profile?.status === 'SUSPENDED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedUser.profile?.status || 'No Status'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details - Show if profile exists */}
                  {selectedUser.profile && Object.keys(selectedUser.profile).length > 0 ? (
                    <>
                      {/* Contact Information */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-green-600">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Phone Number</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.profile.phone_number}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Date of Birth</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedUser.profile.date_of_birth 
                                ? new Date(selectedUser.profile.date_of_birth).toLocaleDateString()
                                : 'Not provided'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Bank Details */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-green-600">Bank Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Account Number</label>
                            <p className="mt-1 text-sm text-gray-900 font-mono">{selectedUser.profile.bank_account_number}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">IFSC Code</label>
                            <p className="mt-1 text-sm text-gray-900 font-mono">{selectedUser.profile.ifsc_code}</p>
                          </div>
                        </div>
                      </div>

                      {/* Identification */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-green-600">Identification</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">PAN Number</label>
                            <p className="mt-1 text-sm text-gray-900 font-mono">{selectedUser.profile.pan_number}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Aadhaar Number</label>
                            <p className="mt-1 text-sm text-gray-900 font-mono">{selectedUser.profile.aadhaar_number}</p>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-green-600">Address</h3>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Address Line 1</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.profile.address_line_1}</p>
                          </div>
                          {selectedUser.profile.address_line_2 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600">Address Line 2</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedUser.profile.address_line_2}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-600">City</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedUser.profile.city}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600">State</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedUser.profile.state}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600">PIN Code</label>
                              <p className="mt-1 text-sm text-gray-900">{selectedUser.profile.pin_code}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-green-600">Account Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Created At</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedUser.profile.created_at 
                                ? new Date(selectedUser.profile.created_at).toLocaleDateString()
                                : 'Not available'
                              }
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                            <p className="mt-1 text-sm text-gray-900">
                              {selectedUser.profile.updated_at 
                                ? new Date(selectedUser.profile.updated_at).toLocaleDateString()
                                : 'Not available'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500">No profile information available for this user.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center p-6 border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Close
              </button>
              
              <div className="space-x-2">
                {selectedUser.profile?.status === 'SUSPENDED' ? (
                  <button
                    onClick={() => approveUser(selectedUser.id)}
                    disabled={approving[selectedUser.id]}
                    className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium transition-colors ${
                      approving[selectedUser.id] ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {approving[selectedUser.id] ? 'Re-activating...' : 'Re-activate User'}
                  </button>
                ) : selectedUser.is_active ? (
                  <button
                    onClick={() => suspendUser(selectedUser.id)}
                    disabled={suspending[selectedUser.id]}
                    className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors ${
                      suspending[selectedUser.id] ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {suspending[selectedUser.id] ? 'Suspending...' : 'Suspend User'}
                  </button>
                ) : (
                  <button
                    onClick={() => approveUser(selectedUser.id)}
                    disabled={approving[selectedUser.id]}
                    className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium transition-colors ${
                      approving[selectedUser.id] ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {approving[selectedUser.id] ? 'Approving...' : 'Approve User'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-green-50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Username</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-2 text-center">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const statusInfo = getStatusInfo(user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border">{user.id}</td>
                      <td className="px-4 py-2 border">
                        <button
                          onClick={() => openUserProfile(user)}
                          className="text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          {user.username}
                        </button>
                      </td>
                      <td className="px-4 py-2 border">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                        {user.profile && (
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            user.profile.status === 'APPROVED' 
                              ? 'bg-green-100 text-green-800' 
                              : user.profile.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : user.profile.status === 'SUSPENDED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.profile.status || 'No Status'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 border">
                        {user.profile?.status === 'SUSPENDED' ? (
                          <button
                            onClick={() => approveUser(user.id)}
                            disabled={approving[user.id]}
                            className={`bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors ${
                              approving[user.id] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {approving[user.id] ? 'Re-activating...' : 'Re-activate'}
                          </button>
                        ) : user.is_active ? (
                          <button
                            onClick={() => suspendUser(user.id)}
                            disabled={suspending[user.id]}
                            className={`bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors ${
                              suspending[user.id] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {suspending[user.id] ? 'Suspending...' : 'Suspend'}
                          </button>
                        ) : (
                          <button
                            onClick={() => approveUser(user.id)}
                            disabled={approving[user.id]}
                            className={`bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors ${
                              approving[user.id] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {approving[user.id] ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;