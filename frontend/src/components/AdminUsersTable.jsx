import React from 'react';

const AdminUsersTable = ({ users = [], isLoading = false }) => {
  if (isLoading) {
    return <p>Loading users...</p>;
  }

  if (users.length === 0) {
    return <p>No users found</p>;
  }

  return (
    <div className="overflow-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Username</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Role</th>
            <th className="p-2 border">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="text-center">
              <td className="p-2 border">{u.id}</td>
              <td className="p-2 border">{u.username}</td>
              <td className="p-2 border">{u.email || 'N/A'}</td>
              <td className="p-2 border">{u.role || 'N/A'}</td>
              <td className="p-2 border">
                {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(AdminUsersTable);
