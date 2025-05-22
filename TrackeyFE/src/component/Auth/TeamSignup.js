import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TeamMemberSignup = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email_address: '',
    phone_number: '',
    role: 'attendant',
    password: '',
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sId = params.get('store_id');
    if (sId) {
      setStoreId(parseInt(sId, 10));
    } else {
      toast.error('Missing store identifier in invite.');
    }
  }, [location.search]);

  const arrayBufferToHex = (buffer) =>
    Array.prototype.map
      .call(new Uint8Array(buffer), (x) => ('00' + x.toString(16)).slice(-2))
      .join('');

  const hashPassword = async (plainText) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToHex(hashBuffer);
  };

  const validate = () => {
    const { full_name, email_address, password } = formData;
    if (!full_name.trim()) {
      toast.error('Full name is required');
      return false;
    }
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email_address)) {
      toast.error('Valid email is required');
      return false;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const checkDuplicate = async () => {
    // check existing user by email or phone for this store
    const { data, error } = await supabase
      .from('store_users')
      .select('id')
      .or(
        `and(store_id.eq.${storeId},email_address.eq.${formData.email_address}),and(store_id.eq.${storeId},phone_number.eq.${formData.phone_number})`
      )
      .limit(1);

    if (error) {
      toast.error('Error checking duplicates: ' + error.message);
      return true;
    }
    if (data.length > 0) {
      toast.error('A user with that email already exists for this store.');
      return true;
    }
    return false;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!storeId) return;
    if (!validate()) return;
    setLoading(true);

    // duplicate check
    const isDuplicate = await checkDuplicate();
    if (isDuplicate) {
      setLoading(false);
      return;
    }

    try {
      const hashedPassword = await hashPassword(formData.password);

      const { error: insertError } = await supabase
        .from('store_users')
        .insert({
          store_id: storeId,
          full_name: formData.full_name,
          email_address: formData.email_address,
          phone_number: formData.phone_number || null,
          role: formData.role,
          password: hashedPassword,
        });

      if (insertError) {
        toast.error(insertError.message);
      } else {
        toast.success('Signup successful! Redirecting...');
        setTimeout(() => navigate('/login'), 1000);
      }
    } catch (err) {
      toast.error('Unexpected error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-700 rounded shadow mt-24">
      <ToastContainer position="top-center" />
      <h2 className="text-2xl font-bold text-indigo-800 dark:text-indigo-200 mb-4">
        Join the Team
      </h2>
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-indigo-800 dark:text-indigo-200">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-indigo-800 dark:text-indigo-200">Email Address</label>
          <input
            type="email"
            name="email_address"
            value={formData.email_address}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-indigo-800 dark:text-indigo-200">Phone Number</label>
          <input
            type="text"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-indigo-800 dark:text-indigo-200">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="attendant">Attendant</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-indigo-800 dark:text-indigo-200">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 text-white rounded ${loading ? 'bg-gray-400' : 'bg-indigo-800 hover:bg-indigo-700'}`}
        >
          {loading ? 'Signing up...' : 'Join the Team'}
        </button>
      </form>
    </div>
  );
};

export default TeamMemberSignup;
