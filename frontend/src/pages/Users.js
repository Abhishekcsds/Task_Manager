import React, { useState, useEffect } from 'react';
import { userAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getAll()
      .then(res => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await userAPI.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? res.data.user : u));
    } catch (err) { alert(err.response?.data?.message || 'Failed to update role'); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await userAPI.delete(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete user'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="task-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="mini-avatar" style={{ width: 32, height: 32, fontSize: 14, background: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                      {u.name?.[0]}
                    </div>
                    {u.name}
                    {u._id === currentUser?._id && <span className="badge badge-admin" style={{ fontSize: 10 }}>You</span>}
                  </div>
                </td>
                <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{u.email}</td>
                <td>
                  {u._id === currentUser?._id ? (
                    <span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span>
                  ) : (
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u._id, e.target.value)}
                      style={{ padding: '4px 8px', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <option>Admin</option>
                      <option>Member</option>
                    </select>
                  )}
                </td>
                <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  {u._id !== currentUser?._id && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
