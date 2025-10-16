import { useEffect, useState } from "react";
import API from "../api/axios";

const AdminApprove = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      // Get all users (admin endpoint) and filter by profile status
      const response = await API.get("/auth/users/");
      
      // Filter users with PENDING status in their profile
      const pending = response.data.filter(user => 
        user.profile && user.profile.status === 'PENDING'
      );
      setPendingUsers(pending);
    } catch (error) {
      console.error("Failed to fetch pending users", error);
      alert("Failed to load pending users. Make sure you're logged in as admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (userId) => {
    if (!confirm("Approve this user? They will be able to login immediately.")) return;

    try {
      // Call the approve endpoint with POST method
      await API.post(`/auth/users/${userId}/approve/`, {});

      // Refresh the list
      fetchPendingUsers();
      alert("User approved successfully!");
    } catch (error) {
      console.error("Approve failed", error);
      const errorMsg = error?.response?.data?.detail || "Approval failed. User might already be approved or you don't have permission.";
      alert(errorMsg);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Pending User Approvals</h2>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading pending users...</p>
        </div>
      ) : null}
      
      {!loading && pendingUsers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No pending users waiting for approval 🎉</p>
        </div>
      ) : null}
      
      <div className="space-y-4">
        {pendingUsers.map((user) => (
          <div key={user.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{user.username}</h3>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">Registered: {new Date(user.date_joined).toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleApprove(user.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
            
            {/* Profile Information for Review */}
            {user.profile && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="font-medium text-gray-700 mb-2">Profile Information:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Phone:</span> {user.profile.phone_number || 'Not provided'}
                  </div>
                  <div>
                    <span className="font-medium">City:</span> {user.profile.city || 'Not provided'}
                  </div>
                  <div>
                    <span className="font-medium">PAN:</span> {user.profile.pan_number || 'Not provided'}
                  </div>
                  <div>
                    <span className="font-medium">Aadhaar:</span> {user.profile.aadhaar_number ? 'Provided' : 'Not provided'}
                  </div>
                  {user.profile.address_line_1 && (
                    <div className="md:col-span-2">
                      <span className="font-medium">Address:</span> {user.profile.full_address}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApprove;