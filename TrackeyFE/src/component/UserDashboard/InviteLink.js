import React, { useState } from 'react';
import { FaWhatsapp, FaCopy } from 'react-icons/fa';
import { supabase } from '../../supabaseClient'; // adjust the path based on your setup

const InviteGenerator = () => {
  const [inviteLink, setInviteLink] = useState('');
  const [shopName, setShopName] = useState(''); // Store shop_name for WhatsApp message
  const [loading, setLoading] = useState(false);

  const storeId = localStorage.getItem('store_id');

  const generateInvite = async () => {
    if (!storeId) {
      alert('Store ID not found. Please login.');
      return;
    }

    setLoading(true);

    // Fetch shop_name from Supabase (unchanged)
    const { data, error } = await supabase
      .from('stores')
      .select('shop_name')
      .eq('id', storeId)
      .single();

    setLoading(false);

    if (error || !data) {
      console.error('Error fetching shop name:', error);
      alert('Unable to fetch shop name.');
      return;
    }

    const encodedShopName = encodeURIComponent(data.shop_name);
    const link = `${window.location.origin}/team-signup?store_id=${storeId}&shop_name=${encodedShopName}`;
    setInviteLink(link);
    setShopName(data.shop_name); // Store shop_name for WhatsApp
  };

  const copyToClipboard = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      alert('Link copied to clipboard!');
    }
  };

  const shareViaWhatsApp = () => {
    if (inviteLink && shopName) {
      const message = encodeURIComponent(
        `Hello!!! and Welcome to the Team, you have been invited to join ${shopName}'s Team. Click the link to get started on Sellytics: ${inviteLink}`
      );
      window.open(`https://wa.me/?text=${message}`, '_blank');
    } else {
      alert('Please generate an invite link first.');
    }
  };

  return (
    <div className="p-4 dark:bg-gray-800 dark:text-white rounded shadow max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-200 mb-4">
        Create Invite
      </h2>
      <button
        onClick={generateInvite}
        disabled={loading}
        className="px-4 py-2 bg-indigo-800 text-white rounded hover:bg-indigo-700 mb-4"
      >
        {loading ? 'Generating...' : 'Generate Invite Link'}
      </button>

      {inviteLink && (
        <div className="space-y-2">
          <label className="block text-indigo-800 dark:text-indigo-200">
            Share this Invite Link with your team:
          </label>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 p-2 border rounded text-sm dark:bg-gray-800 dark:text-white"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={copyToClipboard}
              className="flex items-center justify-center px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm dark:bg-indigo-600 dark:text-white"
            >
              <FaCopy className="mr-2" /> Copy
            </button>
            <button
              onClick={shareViaWhatsApp}
              className="flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              <FaWhatsapp className="mr-2" /> WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteGenerator;