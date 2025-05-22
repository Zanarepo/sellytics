// TeamManagement.js
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [notification, setNotification] = useState('');
  const [editingPasswordId, setEditingPasswordId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const storeId = localStorage.getItem('store_id');

  // Memoized function to fetch team members
  const fetchTeamMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from('store_users')
      .select('*')
      .eq('store_id', storeId);

    if (error) {
      console.error('Error fetching team members:', error.message);
    } else {
      setTeamMembers(data);
    }
  }, [storeId]);

  // useEffect that calls the memoized fetchTeamMembers function
  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Added missing handleRemove function
  const handleRemove = async (id) => {
    await supabase.from('store_users').delete().eq('id', id);
    fetchTeamMembers();
  };

  const handleSuspend = async (id) => {
    await supabase
      .from('store_users')
      .update({ role: 'suspended' })
      .eq('id', id);
    fetchTeamMembers();
  };

  const handleActivate = async (id) => {
    await supabase
      .from('store_users')
      .update({ role: 'attendant' })
      .eq('id', id);
    fetchTeamMembers();
  };

  const hashPassword = async (plainText) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.prototype.map
      .call(new Uint8Array(hashBuffer), (x) => ('00' + x.toString(16)).slice(-2))
      .join('');
  };

  const handlePasswordUpdate = async (id) => {
    const hashed = await hashPassword(newPassword);
    await supabase
      .from('store_users')
      .update({ password: hashed })
      .eq('id', id);
    setEditingPasswordId(null);
    setNewPassword('');
    fetchTeamMembers();
    setNotification('Password updated successfully!');
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-indigo-800 dark:text-white mb-4">
        Team Management
      </h2>

      {notification && (
        <div className="mb-4 p-2 text-green-600">{notification}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-full border">
          <thead>
            <tr className="bg-indigo-200 text-left dark:bg-gray-900 dark:text-white">
              <th className="p-2">Full Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr key={member.id} className="border-t dark:bg-gray-900 dark:text-white">
                <td className="p-2">{member.full_name}</td>
                <td className="p-2">{member.email_address}</td>
                <td className="p-2">{member.phone_number}</td>
                <td className="p-2">{member.role}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                  {member.role !== 'suspended' ? (
                    <button
                      onClick={() => handleSuspend(member.id)}
                      className="text-yellow-600 hover:underline"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(member.id)}
                      className="text-green-600 hover:underline"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => setEditingPasswordId(member.id)}
                    className="text-indigo-600 hover:underline dark:bg-gray-900 dark:text-gray-400"
                  >
                    Change Password
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingPasswordId && (
        <div className="mt-4 p-4 border rounded bg-gray-100 dark:bg-gray-800">
          <label className="block mb-2 text-indigo-800 dark:text-white">
            New Password:
          </label>
          <input
            type="password"
            className="p-2 w-full mb-2 border rounded"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            onClick={() => handlePasswordUpdate(editingPasswordId)}
            className="px-4 py-2 bg-indigo-800 text-white rounded"
          >
            Update Password
          </button>
          <button
            onClick={() => {
              setEditingPasswordId(null);
              setNewPassword('');
            }}
            className="ml-2 px-4 py-2 bg-gray-500 text-white rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
