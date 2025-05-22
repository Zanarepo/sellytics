import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

export default function CustomerManagement() {
  const storeId = Number(localStorage.getItem('store_id'));

  // Data & UI state
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState({
    fullname: '',
    phone_number: '',
    birthday: '',
    address: '',
    email: ''
  });

  // Search & pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  // Fetch customers with server-side search & pagination
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('customer')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .ilike('fullname', `%${searchTerm}%`)
      .order('fullname', { ascending: true })
      .range(from, to);

    if (error) console.error('Fetch error:', error.message);
    else {
      setCustomers(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [storeId, searchTerm, page]);

  // Initial + re-fetch on searchTerm or page change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Modal openers
  const openNewModal = () => {
    setEditingCustomer(null);
    setForm({ fullname: '', phone_number: '', birthday: '', address: '', email: '' });
    setModalOpen(true);
  };
  const openEditModal = cust => {
    setEditingCustomer(cust.id);
    setForm({
      fullname: cust.fullname || '',
      phone_number: cust.phone_number || '',
      birthday: cust.birthday || '',
      address: cust.address || '',
      email: cust.email || ''
    });
    setModalOpen(true);
  };

  // Form handlers
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = {
      store_id: storeId,
      fullname: form.fullname,
      phone_number: form.phone_number,
      birthday: form.birthday || null,
      address: form.address || null,
      email: form.email || null
    };

    const res = editingCustomer
      ? await supabase.from('customer').update(payload).eq('id', editingCustomer)
      : await supabase.from('customer').insert([payload]);

    if (res.error) console.error('Save error:', res.error.message);
    else {
      setModalOpen(false);
      fetchCustomers();
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this customer?')) return;
    const { error } = await supabase.from('customer').delete().eq('id', id);
    if (error) console.error('Delete error:', error.message);
    else fetchCustomers();
  };

  return (
    <div className="max-w-5xl mx-auto p-0 dark:bg-gray-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
  <h2 className="text-xl sm:text-2xl font-bold text-indigo-800 dark:text-white">
    Customers
  </h2>
  <button
    onClick={openNewModal}
    className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
  >
    New Customer
  </button>
</div>


      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name…"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          className="w-full  p-2 border rounded dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Table or Loading */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="overflow-x-auto dark:bg-gray-800 dark:text-white">
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-200 text-indigo-500 dark:bg-gray-800 dark:text-indigo-600">
                  <th className="p-2">Name</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Birthday</th>
                  <th className="p-2">Address</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.fullname}</td>
                    <td className="p-2">{c.phone_number}</td>
                    <td className="p-2">{c.email}</td>
                    <td className="p-2">{c.birthday}</td>
                    <td className="p-2">{c.address}</td>
                    <td className="p-2 space-x-2">
                      <button onClick={() => openEditModal(c)} className="text-blue-600 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 ">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-800 dark:text-white"
            >
              Prev
            </button>
            <span className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-900 dark:text-white">
              Page {page + 1} of {Math.ceil(totalCount / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * pageSize >= totalCount}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-800 dark:text-white"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center overflow-auto p-4 mt-24">
          <div className="bg-white p-6 rounded shadow-lg w-full sm:w-2/3 max-h-full overflow-auto dark:bg-gray-800 dark:text-white">
            <h3 className="text-xl text-indigo-600 font-semibold mb-4">
              {editingCustomer ? 'Edit Customer' : 'New Customer'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="flex flex-col">
                <label className="mb-1">Full Name *</label>
                <input
                  name="fullname"
                  value={form.fullname}
                  onChange={handleChange}
                  required
                  className="p-2 border rounded dark:bg-gray-800 dark:text-white"
                />
              </div>
              {/* Phone */}
              <div className="flex flex-col">
                <label className="mb-1">Phone Number *</label>
                <input
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  required
                  className="p-2 border rounded dark:bg-gray-800 dark:text-white"
                />
              </div>
              {/* Email & Birthday */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <label className="mb-1">Email</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="p-2 border rounded dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="mb-1">Birthday</label>
                  <input
                    type="date"
                    name="birthday"
                    value={form.birthday}
                    onChange={handleChange}
                    className="p-2 border rounded dark:bg-gray-800 dark:text-white"
                  />
                </div>
                {/* Address */}
                <div className="sm:col-span-2 flex flex-col">
                  <label className="mb-1">Address</label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="p-2 border rounded dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
              {/* Buttons */}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-red-500 dark:text-white dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 dark:bg-indigo-800 dark:text-white dark:hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
