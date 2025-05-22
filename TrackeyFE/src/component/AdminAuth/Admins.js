import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AdminCreate() {
  const [form, setForm] = useState({ fullname: '', email: '', role: 'admin', password: '' });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const navigate = useNavigate();

  // Helper: convert buffer to hex
  const arrayBufferToHex = (buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  // Hash password using SHA-256
  const hashPassword = async (plain) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToHex(hash);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification('');
    try {
      const hashed = await hashPassword(form.password);
      const { error } = await supabase.from('admins').insert([{ ...form, password: hashed }]);
      if (error) throw error;
      setNotification('Admin account created successfully!');
      setForm({ fullname: '', email: '', role: 'admin', password: '' });
      setTimeout(() => navigate('/admin-dashboard'), 1000);
    } catch (err) {
      setNotification(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Create Admin Account</h2>
        {notification && (
          <div className="mb-4 text-center text-indigo-700">{notification}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="mb-1">Full Name</label>
            <input
              type="text"
              name="fullname"
              value={form.fullname}
              onChange={handleChange}
              required
              className="border px-3 py-2 rounded focus:outline-none focus:ring"
              placeholder="Enter full name"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="border px-3 py-2 rounded focus:outline-none focus:ring"
              placeholder="Enter email address"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="border px-3 py-2 rounded focus:outline-none focus:ring"
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <div className="flex flex-col relative">
            <label className="mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="border px-3 py-2 rounded focus:outline-none focus:ring"
              placeholder="Create a password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
