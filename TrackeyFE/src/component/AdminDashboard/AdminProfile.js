import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

// Hash password using SHA-256
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

const AdminProfile = () => {
  const navigate = useNavigate();
  const adminId = localStorage.getItem('admin_id');

  const [admin, setAdmin] = useState({
    fullname: '',
    email: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
  });

  const [notification, setNotification] = useState('');

  const fetchAdminDetails = useCallback(async () => {
    if (!adminId) return;
    const { data, error } = await supabase
      .from('admins')
      .select('fullname, email')
      .eq('id', adminId)
      .single();

    if (error) {
      console.error('Error fetching admin details:', error.message);
    } else {
      setAdmin({
        fullname: data.fullname,
        email: data.email,
      });
    }
  }, [adminId]);

  useEffect(() => {
    fetchAdminDetails();
  }, [fetchAdminDetails]);

  const handleInputChange = (e) => {
    setAdmin({
      ...admin,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!adminId) {
      setNotification('Admin record not found.');
      return;
    }

    const { error } = await supabase
      .from('admins')
      .update({
        fullname: admin.fullname,
        email: admin.email,
      })
      .eq('id', adminId);

    if (error) {
      setNotification(`Error updating details: ${error.message}`);
    } else {
      setNotification('Profile updated successfully!');
      setIsEditing(false);
      fetchAdminDetails();
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordData.current || !passwordData.new) {
      setNotification('Please fill in both password fields.');
      return;
    }

    const { data, error } = await supabase
      .from('admins')
      .select('password')
      .eq('id', adminId)
      .single();

    if (error || !data) {
      setNotification('Failed to verify current password.');
      return;
    }

    const currentHash = await hashPassword(passwordData.current);

    if (currentHash !== data.password) {
      setNotification('Current password is incorrect.');
      return;
    }

    const newHash = await hashPassword(passwordData.new);

    const { error: updateError } = await supabase
      .from('admins')
      .update({ password: newHash })
      .eq('id', adminId);

    if (updateError) {
      setNotification('Failed to update password.');
    } else {
      setNotification('Password changed successfully!');
      setPasswordData({ current: '', new: '' });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto p-0">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-800 mb-2">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {notification && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded text-center">
          {notification}
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-2xl font-bold text-indigo-800 dark:text-white mb-4">
          My Profile
        </h2>
        <form onSubmit={handleUpdateDetails} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              type="text"
              name="fullname"
              value={admin.fullname}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`p-2 border rounded mt-1 ${
                isEditing ? 'bg-white' : 'bg-gray-100'
              }`}
              placeholder="Your Full Name"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">Email Address</label>
            <input
              type="email"
              name="email"
              value={admin.email}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`p-2 border rounded mt-1 ${
                isEditing ? 'bg-white' : 'bg-gray-100'
              }`}
              placeholder="Your Email"
            />
          </div>

          {isEditing ? (
            <div className="flex flex-col sm:flex-row sm:space-x-4">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 w-full sm:w-auto"
              >
                Update Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  fetchAdminDetails();
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full sm:w-auto mt-2 sm:mt-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 mt-4 w-full sm:w-auto"
            >
              Edit Profile
            </button>
          )}
        </form>
      </div>

      {/* Password Change Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mt-6">
        <h2 className="text-2xl font-bold text-indigo-800 dark:text-white mb-4">
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <input
            type="password"
            placeholder="Current Password"
            value={passwordData.current}
            onChange={(e) =>
              setPasswordData({ ...passwordData, current: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
          <input
            type="password"
            placeholder="New Password"
            value={passwordData.new}
            onChange={(e) =>
              setPasswordData({ ...passwordData, new: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
