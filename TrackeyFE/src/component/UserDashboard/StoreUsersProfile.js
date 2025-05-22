// StoreUserProfile.js
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const StoreUserProfile = () => {
  const navigate = useNavigate();
  // Retrieve user_id and store_id from local storage.
  const userId = localStorage.getItem('user_id');
  const storeId = localStorage.getItem('store_id');

  // State for store user details from store_users table.
  const [user, setUser] = useState({
    full_name: '',
    email_address: '',
    phone_number: '',
  });

  // State for store details (store name) from stores table.
  const [storeDetails, setStoreDetails] = useState({
    shop_name: '',
  });

  // UI state for editing and notifications.
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState('');

  // Fetch store user details using the userId.
  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('store_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user details:', error.message);
    } else if (data) {
      setUser({
        full_name: data.full_name,
        email_address: data.email_address,
        phone_number: data.phone_number,
      });
    }
  }, [userId]);

  // Fetch store details (i.e. shop name) from the stores table.
  const fetchStoreDetails = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('stores')
      .select('shop_name')
      .eq('id', storeId)
      .single();

    if (error) {
      console.error('Error fetching store details:', error.message);
    } else if (data) {
      setStoreDetails({
        shop_name: data.shop_name,
      });
    }
  }, [storeId]);

  // Fetch details on component mount.
  useEffect(() => {
    fetchUserDetails();
    fetchStoreDetails();
  }, [fetchUserDetails, fetchStoreDetails]);

  // Handle changes for form fields.
  const handleInputChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  // Update the user details.
  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!userId) {
      setNotification('User record not found.');
      return;
    }
    const { error } = await supabase
      .from('store_users')
      .update({
        full_name: user.full_name,
        email_address: user.email_address,
        phone_number: user.phone_number,
      })
      .eq('id', userId);
    if (error) {
      setNotification(`Error updating details: ${error.message}`);
    } else {
      setNotification('Profile updated successfully!');
      setIsEditing(false);
      fetchUserDetails(); // Refresh user details.
    }
  };

  // Logout: sign out via supabase, clear local storage and redirect.
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user_id');
    localStorage.removeItem('store_id');
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header: store name and logout button */}
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-800 mb-2">
          {storeDetails.shop_name || 'Your Store Name'}'s Outlet
        </h1>
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

      {/* Profile Details Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="text-2xl font-bold text-indigo-800 dark:text-white mb-4">
          My Profile
        </h2>
        <form onSubmit={handleUpdateDetails} className="space-y-4">
          {/* Full Name */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={user.full_name}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`p-2 border rounded mt-1 ${
                isEditing ? 'bg-white' : 'bg-gray-100'
              }`}
              placeholder="Your Full Name"
            />
          </div>
          {/* Email Address */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">Email Address</label>
            <input
              type="email"
              name="email_address"
              value={user.email_address}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`p-2 border rounded mt-1 ${
                isEditing ? 'bg-white' : 'bg-gray-100'
              }`}
              placeholder="Your Email"
            />
          </div>
          {/* Phone Number */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">Phone Number</label>
            <input
              type="text"
              name="phone_number"
              value={user.phone_number}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`p-2 border rounded mt-1 ${
                isEditing ? 'bg-white' : 'bg-gray-100'
              }`}
              placeholder="Your Phone Number"
            />
          </div>

          {/* Edit / Update Controls */}
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
                  fetchUserDetails(); // Reset unsaved changes.
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
    </div>
  );
};

export default StoreUserProfile;
