import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AttendantsTable() {
  const [attendants, setAttendants] = useState([]);
  const [stores, setStores] = useState([]);
  const [viewDetails, setViewDetails] = useState(null);
  const [editAttendant, setEditAttendant] = useState(null);
  const [newAttendant, setNewAttendant] = useState(null);
  const [sortOrder] = useState('desc');
  const [error, setError] = useState(null);

  const ownerId = Number(localStorage.getItem('owner_id'));

  // Memoize loadAttendants to stabilize it for useEffect
  const loadAttendants = useCallback(
    async (order) => {
      try {
        if (!ownerId) {
          setError('No owner ID found in local storage.');
          toast.error('No owner ID found. Please log in.');
          setAttendants([]);
          return;
        }

        // Fetch all stores for the owner
        const { data: storeData, error: storesError } = await supabase
          .from('stores')
          .select('id, shop_name')
          .eq('owner_user_id', ownerId);
        if (storesError) {
          throw new Error(`Error fetching stores: ${storesError.message}`);
        }
        if (!storeData || storeData.length === 0) {
          setAttendants([]);
          setStores([]);
          setError('No stores found for this owner.');
          toast.error('No stores found for this owner.');
          return;
        }
        setStores(storeData);

        const storeIds = storeData.map(store => store.id);

        // Fetch attendants for all owned stores, joining with stores for shop_name
        const { data, error } = await supabase
          .from('store_users')
          .select('*, stores!inner(shop_name)')
          .in('store_id', storeIds)
          .order('id', { ascending: order === 'asc' });
        if (error) {
          throw new Error(`Error fetching attendants: ${error.message}`);
        }

        // Map attendants to include shop_name from stores
        const attendantsWithShop = (data ?? []).map(attendant => ({
          ...attendant,
          shop_name: attendant.stores?.shop_name || 'N/A',
        }));

        setAttendants(attendantsWithShop);
        setError(null);
      } catch (err) {
        console.error(err.message);
        setAttendants([]);
        setError(err.message);
        toast.error(err.message);
      }
    },
    [ownerId]
  );

  useEffect(() => {
    loadAttendants(sortOrder);
  }, [ownerId, sortOrder, loadAttendants]);

  const handleCreate = async e => {
    e.preventDefault();
    try {
      const { full_name, phone_number, email_address, store_id, role } = newAttendant;
      if (!full_name || !phone_number || !email_address || !store_id) {
        throw new Error('All fields are required.');
      }
      const { error } = await supabase
        .from('store_users')
        .insert([{ full_name, phone_number, email_address, store_id, role }]);
      if (error) {
        throw new Error(`Error creating attendant: ${error.message}`);
      }
      await loadAttendants(sortOrder);
      setNewAttendant(null);
      toast.success('Attendant created successfully.');
    } catch (err) {
      console.error(err.message);
      toast.error(err.message);
    }
  };

  const handleUpdate = async e => {
    e.preventDefault();
    try {
      const { id, full_name, phone_number, email_address, store_id, role } = editAttendant;
      if (!full_name || !phone_number || !email_address || !store_id) {
        throw new Error('All fields are required.');
      }
      const { error } = await supabase
        .from('store_users')
        .update({ full_name, phone_number, email_address, store_id, role })
        .eq('id', id);
      if (error) {
        throw new Error(`Error updating attendant: ${error.message}`);
      }
      await loadAttendants(sortOrder);
      setEditAttendant(null);
      toast.success('Attendant updated successfully.');
    } catch (err) {
      console.error(err.message);
      toast.error(err.message);
    }
  };

  const handleDelete = async id => {
    try {
      const { error } = await supabase.from('store_users').delete().eq('id', id);
      if (error) {
        throw new Error(`Error deleting attendant: ${error.message}`);
      }
      await loadAttendants(sortOrder);
      toast.success('Attendant deleted successfully.');
    } catch (err) {
      console.error(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-0 dark:bg-gray-900 dark:text-white ">
      <h2 className="text-2xl font-bold text-center mb-4">Attendants</h2>

      {error && (
        <div className="text-center text-red-500 mb-4">{error}</div>
      )}

      
          

      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-gray-200">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-900 dark:text-indigo-600">
              {['ID', 'Full Name', 'Phone Number', 'Email', 'Store Name', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200 dark:bg-gray-900 dark:text-indigo-600">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attendants.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 dark:bg-gray-900 dark:text-white">
                <td className="px-4 py-2 border-b border-gray-200 text-sm">{a.id}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm">{a.full_name || 'N/A'}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm">{a.phone_number || 'N/A'}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm">{a.email_address || 'N/A'}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm">{a.shop_name}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm space-x-2">
                  <button
                    className="p-1 text-indigo-600 hover:text-indigo-800"
                    onClick={() => setViewDetails(a)}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="p-1 text-blue-500 hover:text-blue-700"
                    onClick={() => setEditAttendant(a)}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="p-1 text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(a.id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {attendants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                  No attendants available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Details Modal */}
      {viewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Details for Attendant #{viewDetails.id}</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Full Name</span>
                <span className="text-gray-900">{viewDetails.full_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Phone Number</span>
                <span className="text-gray-900">{viewDetails.phone_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Email</span>
                <span className="text-gray-900">{viewDetails.email_address || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Role</span>
                <span className="text-gray-900">{viewDetails.role || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Store Name</span>
                <span className="text-gray-900">{viewDetails.shop_name}</span>
              </div>
            </div>
            <button
              className="mt-2 w-full px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              onClick={() => setViewDetails(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Attendant Modal */}
      {newAttendant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Attendant</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={newAttendant.full_name}
                  onChange={e => setNewAttendant({ ...newAttendant, full_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={newAttendant.phone_number}
                  onChange={e => setNewAttendant({ ...newAttendant, phone_number: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={newAttendant.email_address}
                  onChange={e => setNewAttendant({ ...newAttendant, email_address: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store</label>
                <select
                  value={newAttendant.store_id}
                  onChange={e => setNewAttendant({ ...newAttendant, store_id: Number(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select a store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.shop_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role (optional)</label>
                <input
                  type="text"
                  value={newAttendant.role}
                  onChange={e => setNewAttendant({ ...newAttendant, role: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  onClick={() => setNewAttendant(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Attendant Modal */}
      {editAttendant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Attendant #{editAttendant.id}</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={editAttendant.full_name}
                  onChange={e => setEditAttendant({ ...editAttendant, full_name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={editAttendant.phone_number}
                  onChange={e => setEditAttendant({ ...editAttendant, phone_number: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editAttendant.email_address}
                  onChange={e => setEditAttendant({ ...editAttendant, email_address: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Store</label>
                <select
                  value={editAttendant.store_id}
                  onChange={e => setEditAttendant({ ...editAttendant, store_id: Number(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                  required
                >
                  <option value="">Select a store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.shop_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role (optional)</label>
                <input
                  type="text"
                  value={editAttendant.role}
                  onChange={e => setEditAttendant({ ...editAttendant, role: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Update
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                  onClick={() => setEditAttendant(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}