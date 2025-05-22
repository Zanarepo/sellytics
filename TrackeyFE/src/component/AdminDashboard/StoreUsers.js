// StoreUsers.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  FaEdit,
  FaTrashAlt,
  FaUserSlash,
  FaUserCheck,
  FaFileCsv,
  FaFilePdf,
} from 'react-icons/fa';

export default function StoreUsers() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!search) setFiltered(users);
    else {
      const q = search.toLowerCase();
      setFiltered(
        users.filter(u =>
          u.full_name.toLowerCase().includes(q) ||
          u.email_address.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          u.stores.shop_name.toLowerCase().includes(q)
        )
      );
    }
  }, [search, users]);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('store_users')
      .select('id, full_name, email_address, phone_number, role, created_at, stores(shop_name)')
      .order('id', { ascending: true });
    if (!error) {
      setUsers(data);
      setFiltered(data);
    }
  }

  const toggleStatus = async u => {
    const newRole = u.role === 'suspended' ? 'attendant' : 'suspended';
    if (!window.confirm(`${newRole === 'suspended' ? 'Suspend' : 'Activate'} ${u.full_name}?`)) return;
    await supabase
      .from('store_users')
      .update({ role: newRole })
      .eq('id', u.id);
    fetchUsers();
  };

  const deleteUser = async u => {
    if (!window.confirm(`Delete ${u.full_name} permanently?`)) return;
    await supabase.from('store_users').delete().eq('id', u.id);
    fetchUsers();
  };

  const startEdit = u => {
    setEditing(u);
    setForm({
      full_name: u.full_name,
      email_address: u.email_address,
      phone_number: u.phone_number,
      role: u.role
    });
  };

  const handleFormChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const saveEdit = async () => {
    await supabase
      .from('store_users')
      .update(form)
      .eq('id', editing.id);
    setEditing(null);
    fetchUsers();
  };

  // Export CSV
  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Full Name,Email Address,Phone,Role,Store,Created At\n";
    filtered.forEach(u => {
      const row = [
        u.full_name,
        u.email_address,
        u.phone_number,
        u.role,
        u.stores.shop_name,
        u.created_at
      ].join(',');
      csv += row + "\n";
    });
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'store_users.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text('Store Users', 10, y); y += 10;
      filtered.forEach(u => {
        const line = `Name: ${u.full_name}, Email: ${u.email_address}, Phone: ${u.phone_number}, Role: ${u.role}, Store: ${u.stores.shop_name}`;
        doc.text(line, 10, y);
        y += 10;
      });
      doc.save('store_users.pdf');
    });
  };

  return (
    <div className="p-4">
      {/* Search & Export */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <FaFileCsv /> CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaFilePdf /> PDF
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-200">
              {['Name','Email','Phone','Role','Store','Status','Actions'].map(h => (
                <th key={h} className="p-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{u.full_name}</td>
                <td className="p-2">{u.email_address}</td>
                <td className="p-2">{u.phone_number}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">{u.stores.shop_name}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    u.role === 'suspended'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {u.role === 'suspended' ? 'Suspended' : 'Active'}
                  </span>
                </td>
                <td className="p-2 flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(u)}
                    aria-label="Edit user"
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <FaEdit className="text-indigo-600" />
                  </button>
                  <button
                    onClick={() => toggleStatus(u)}
                    aria-label={u.role === 'suspended' ? 'Activate user' : 'Suspend user'}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {u.role === 'suspended' ? (
                      <FaUserCheck className="text-green-600" />
                    ) : (
                      <FaUserSlash className="text-yellow-600" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteUser(u)}
                    aria-label="Delete user"
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <FaTrashAlt className="text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded shadow max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-indigo-800">{`Edit ${editing.full_name}`}</h2>
            {['full_name','email_address','phone_number','role'].map(f => (
              <div key={f}>
                <label className="block text-indigo-800 mb-1">
                  {f.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
                </label>
                <input
                  type="text"
                  name={f}
                  value={form[f]}
                  onChange={handleFormChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-indigo-800 text-white rounded hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
