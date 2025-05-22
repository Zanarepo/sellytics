// StoreOwnerDashboard.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const StoreOwnerDashboard = () => {
  const navigate = useNavigate();
  const storeId = localStorage.getItem('store_id');

  // Flag to indicate if form is in edit mode.
  const [isEditing, setIsEditing] = useState(false);
  // State to hold store details.
  const [storeDetails, setStoreDetails] = useState({
    shop_name: '',
    full_name: '',
    email_address: '',
    nature_of_business: '',
    phone_number: '',
    physical_address: '',
    state: '',
    business_logo: '',
    default_currency: '',
  });
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState('');

  // Separate state for the logo file (if uploaded)
  const [logoFile, setLogoFile] = useState(null);
  // Placeholder logo if no logo is provided.
  //const placeholderLogo = 'https://via.placeholder.com/150';

  // Fetch store details from the database.
  useEffect(() => {
    const fetchStoreDetails = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();
      if (error) {
        console.error('Error fetching store details:', error.message);
      } else {
        setStoreDetails(data);
      }
    };

    if (storeId) {
      fetchStoreDetails();
    }
  }, [storeId]);

  // Handler for input changes.
  const handleInputChange = (e) => {
    setStoreDetails({
      ...storeDetails,
      [e.target.name]: e.target.value,
    });
  };

  // Handler for file input changes.

  // Utility function to hash password using SHA-256.
  const hashPassword = async (plainText) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  // Update store details.
  const handleUpdateDetails = async (e) => {
    e.preventDefault();

    // If a new logo file is uploaded, handle the file upload first.
    let logoUrl = storeDetails.business_logo;
    if (logoFile) {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${storeId}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, logoFile, { upsert: true });
      if (uploadError) {
        setNotification(`Logo upload failed: ${uploadError.message}`);
        return;
      }
      // Get public URL of the uploaded image.
      const { publicURL, error: urlError } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);
      if (urlError) {
        setNotification(`Error getting logo URL: ${urlError.message}`);
        return;
      }
      logoUrl = publicURL;
    }

    const { error } = await supabase
      .from('stores')
      .update({
        shop_name: storeDetails.shop_name,
        full_name: storeDetails.full_name,
        email_address: storeDetails.email_address,
        nature_of_business: storeDetails.nature_of_business,
        phone_number: storeDetails.phone_number,
        physical_address: storeDetails.physical_address,
        state: storeDetails.state,
        business_logo: logoUrl,
        default_currency: storeDetails.default_currency,
      })
      .eq('id', storeId);
    if (error) {
      setNotification(`Error updating details: ${error.message}`);
    } else {
      setNotification('Store details updated successfully!');
      setIsEditing(false);
      setLogoFile(null);
    }
  };

  // Update password after hashing it using SHA-256.
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const hashedPassword = await hashPassword(password);
    const { error } = await supabase
      .from('stores')
      .update({ password: hashedPassword })
      .eq('id', storeId);
    if (error) {
      setNotification(`Error updating password: ${error.message}`);
    } else {
      setNotification('Password updated successfully!');
      setPassword('');
    }
  };

  // Logout handler.
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('store_id');
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 dark:bg-gray-900 dark:text-white mt">
      {/* Header with Logo and Logout */}
      <div className="flex flex-col items-center mb-6">
       {/* Header with Logo and Logout  <img
          src={storeDetails.business_logo || placeholderLogo}
          alt="Business Logo"
          className="w-32 h-32 object-cover rounded-full border mb-4"
        />*/}
        <h1 className="text-3xl font-bold text-indigo-800 mb-2 dark:bg-gray-900 dark:text-white">
          My Store Profile
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {notification && (
        <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">
          {notification}
        </div>
      )}

      {/* Details Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-boldfont-bold text-indigo-800 dark:text-white">
            Store Details
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
            >
              Edit
            </button>
          )}
        </div>

        <form onSubmit={handleUpdateDetails} className="space-y-4">
          {/* Shop Name */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">Shop Name</label>
            <input
              type="text"
              name="shop_name"
              value={storeDetails.shop_name}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`p-2 border rounded mt-1 ${
                isEditing ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
              }`}
              placeholder="Enter your shop name"
            />
          </div>

          {/* Full Name */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={storeDetails.full_name}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`p-2 border rounded mt-1 ${
                isEditing ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
              }`}
              placeholder="Enter your full name"
            />
          </div>

          {/* Email Address */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              name="email_address"
              value={storeDetails.email_address}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`p-2 border rounded mt-1 ${
                isEditing ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
              }`}
              placeholder="Enter your email address"
            />
          </div>

          {/* Nature of Business */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">
              Nature of Business
            </label>
            <input
              type="text"
              name="nature_of_business"
              value={storeDetails.nature_of_business}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`p-2 border rounded mt-1 ${
                isEditing ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
              }`}
              placeholder="e.g., Retail, Services"
            />
          </div>

          {/* Phone Number */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input
              type="text"
              name="phone_number"
              value={storeDetails.phone_number}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`p-2 border rounded mt-1 ${
                isEditing ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
              }`}
              placeholder="Enter your phone number"
            />
          </div>

          {/* Physical Address */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">
              Physical Address
            </label>
            <textarea
              name="physical_address"
              value={storeDetails.physical_address}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={`p-2 border rounded mt-1 resize-none ${
                isEditing ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
              }`}
              placeholder="Enter your address"
            ></textarea>
          </div>

          {/* State */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">
              State / Region
            </label>
            {isEditing ? (
              <select
                name="state"
                value={storeDetails.state}
                onChange={handleInputChange}
                className="p-2 border rounded mt-1 bg-white "
              >
                <option value="">Select your state/region</option>
                <option value="lagos">Lagos</option>
                <option value="abuja">Abuja</option>
                <option value="rivers">Rivers</option>
                <option value="kaduna">Kaduna</option>
                {/* Add additional options as needed */}
              </select>
            ) : (
              <input
                type="text"
                name="state"
                value={storeDetails.state}
                readOnly
                className="p-2 border rounded mt-1 bg-gray-100 dark:bg-gray-800 dark:text-white"
              />
            )}
          </div>

          {/* Default Currency */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">
              Default Currency
            </label>
            {isEditing ? (
              <select
                name="default_currency"
                value={storeDetails.default_currency}
                onChange={handleInputChange}
                className="p-2 border rounded mt-1 bg-white"
              >
                <option value="">Select currency</option>
                <option value="NGN">Naira (NGN)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                {/* Add more currencies if needed */}
              </select>
            ) : (
              <input
                type="text"
                name="default_currency"
                value={storeDetails.default_currency}
                readOnly
                className="p-2 border rounded mt-1 bg-gray-100 dark:bg-gray-800 dark:text-white"
              />
            )}
          </div>

          {/* Business Logo 
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">
              Business Logo*/}
          {/* </label>
            {isEditing ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="p-2 border rounded mt-1"
                />
                <input
                  type="text"
                  name="business_logo"
                  value={storeDetails.business_logo}
                  onChange={handleInputChange}
                  placeholder="Or enter logo URL"
                  className="p-2 border rounded mt-1 bg-white"
                />
              </>
            ) : (
              <img
                src={storeDetails.business_logo || placeholderLogo}
                alt="Business Logo"
                className="w-32 h-32 object-cover rounded border mt-1"
              />
            )}
          </div>

          {/* Submit button for details */}
          {isEditing && (
            <button
              type="submit"
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 w-full"
            >
              Save Changes
            </button>
          )}
        </form>
      </div>

      {/* Password Change Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mt-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1 bg-white dark:bg-gray-800 dark:text-white"
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 w-full"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default StoreOwnerDashboard;
