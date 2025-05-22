import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function OwnersStoresComponent() {
  const [owners, setOwners] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode,] = useState(false);
  

  // Fetch owners and stores
  const fetchData = async () => {
    setLoading(true);
    const { data: ownerData, error: ownerErr } = await supabase
      .from('store_owners')
      .select('id, full_name');
    if (ownerErr) {
      console.error(ownerErr);
      toast.error('Failed to load owners');
    } else {
      setOwners(ownerData || []);
    }

    const { data: storeData, error: storeErr } = await supabase
      .from('stores')
      .select('id, shop_name, owner_user_id, is_active');
    if (storeErr) {
      console.error(storeErr);
      toast.error('Failed to load stores');
    } else {
      setStores(storeData || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Update owner assignment
  const updateAssignment = async (storeId, ownerId) => {
    const { error } = await supabase
      .from('stores')
      .update({ owner_user_id: ownerId || null, updated_at: new Date() })
      .eq('id', storeId);
    if (error) {
      console.error(error);
      toast.error('Assignment failed');
    } else {
      toast.success('Owner updated');
      fetchData();
    }
  };

  
  // Toggle active state
  const toggleActive = async (store) => {
    const { error } = await supabase
      .from('stores')
      .update({ is_active: !store.is_active, updated_at: new Date() })
      .eq('id', store.id);
    if (error) {
      console.error(error);
      toast.error('Status update failed');
    } else {
      toast.success(store.is_active ? 'Deactivated' : 'Activated');
      fetchData();
    }
  };

  // Delete store
  const deleteStore = async (storeId) => {
    if (!window.confirm('Delete this store?')) return;
    const { error } = await supabase.from('stores').delete().eq('id', storeId);
    if (error) {
      console.error(error);
      toast.error('Deletion failed');
    } else {
      toast.success('Store deleted');
      fetchData();
    }
  };

  // Inline edit
  const editStoreName = async (store) => {
    const newName = window.prompt('Edit store name:', store.shop_name);
    if (!newName) return;
    const { error } = await supabase
      .from('stores')
      .update({ shop_name: newName.trim(), updated_at: new Date() })
      .eq('id', store.id);
    if (error) {
      console.error(error);
      toast.error('Update failed');
    } else {
      toast.success('Name updated');
      fetchData();
    }
  };

  // Add new store

  // Build owner tag map
  const ownerTags = stores.reduce((acc, store) => {
    if (store.owner_user_id) acc[store.owner_user_id] = `Owner-${store.owner_user_id}`;
    return acc;
  }, {});

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Stores & Assignments</h1>
         
        </header>

       
        {/* Stores assignments table */}
        {loading ? <p>Loading...</p> : (
          <div className="overflow-x-auto shadow rounded-lg">
            <table className="min-w-full bg-white dark:bg-gray-800">
              <thead className="bg-gray-200 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Owner</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map(store => (
                  <tr key={store.id} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900">
                    <td className="px-4 py-2">{store.id}</td>
                    <td className="px-4 py-2 flex items-center">
                      {store.shop_name}
                      {store.owner_user_id && (
                        <span className="ml-2 inline-block bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                          {ownerTags[store.owner_user_id]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={store.owner_user_id || ''}
                        onChange={e => updateAssignment(store.id, Number(e.target.value))}
                        className="p-1 border rounded dark:bg-gray-700 dark:border-gray-600 w-full"
                      >
                        <option value="">Unassigned</option>
                        {owners.map(o => (
                          <option key={o.id} value={o.id}>{o.full_name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">{store.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="px-4 py-2 flex space-x-2">
                      <button onClick={() => toggleActive(store)} title={store.is_active ? 'Deactivate' : 'Activate'}>
                        {store.is_active 
                          ? <XCircle className="w-5 h-5 text-red-500" />
                          : <CheckCircle className="w-5 h-5 text-green-500" />
                        }
                      </button>
                      <button onClick={() => editStoreName(store)} title="Edit">
                        <Edit2 className="w-5 h-5 text-yellow-500" />
                      </button>
                      <button onClick={() => deleteStore(store.id)} title="Delete">
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}