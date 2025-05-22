// Stores.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);     // store being edited
  const [form, setForm] = useState({});             // edit form data

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (!search) setFiltered(stores);
    else {
      const q = search.toLowerCase();
      setFiltered(
        stores.filter(s =>
          s.shop_name.toLowerCase().includes(q) ||
          s.full_name.toLowerCase().includes(q) ||
          s.email_address.toLowerCase().includes(q)
        )
      );
    }
  }, [search, stores]);

  async function fetchStores() {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('id', { ascending: true });
    if (!error) {
      setStores(data);
      setFiltered(data);
    }
  }

  const toggleStatus = async (s) => {
    if (!window.confirm(`Are you sure you want to ${s.is_active ? 'suspend' : 'activate'} "${s.shop_name}"?`)) return;
    await supabase
      .from('stores')
      .update({ is_active: !s.is_active })
      .eq('id', s.id);
    fetchStores();
  };

  const deleteStore = async (s) => {
    if (!window.confirm(`Delete store "${s.shop_name}" forever?`)) return;
    await supabase.from('stores').delete().eq('id', s.id);
    fetchStores();
  };

  const startEdit = (s) => {
    setEditing(s);
    setForm({
      shop_name: s.shop_name,
      full_name: s.full_name,
      email_address: s.email_address,
      phone_number: s.phone_number
    });
  };

  const handleFormChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const saveEdit = async () => {
    await supabase
      .from('stores')
      .update(form)
      .eq('id', editing.id);
    setEditing(null);
    fetchStores();
  };

  // Export CSV
  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Shop Name,Owner,Email Address,Phone,Status,Created At\n";
    filtered.forEach(s => {
      const row = [
        s.shop_name,
        s.full_name,
        s.email_address,
        s.phone_number,
        s.is_active ? 'Active' : 'Suspended',
        s.created_at
      ].join(',');
      csv += row + "\n";
    });
    const uri = encodeURI(csv);
    const link = document.createElement('a');
    link.href = uri;
    link.download = 'stores.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Export PDF
  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text('Stores List', 10, y); y += 10;
      filtered.forEach(s => {
        const line = `Name: ${s.shop_name}, Owner: ${s.full_name}, Email: ${s.email_address}, Phone: ${s.phone_number}, Status: ${s.is_active ? 'Active' : 'Suspended'}`;
        doc.text(line, 10, y);
        y += 10;
      });
      doc.save('stores.pdf');
    });
  };

  return (
   <div className="min-h-screen bg-white  text-gray-900 dark:bg-gray-900 dark:text-gray-900 p-4">
      {/* Search & Export */}
      <div className="flex flex-col sm:flex-row  items-center justify-between mb-4 gap-2 ">
        <input
          type="text"
          placeholder="Search stores..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 p-2 border rounded  dark:bg-gray-900 dark:text-white"
        />
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Download CSV
          </button>
          <button onClick={exportPDF} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Download PDF
          </button>
        </div>
      </div>

      {/* Stores Table */}
      <div className="overflow-x-auto dark:bg-gray-900 dark:text-gray-900">
        <table className="min-w-full bg-white rounded shadow  dark:bg-gray-900 dark:text-white">
          <thead>
            <tr className="bg-gray-200  dark:bg-indigo-600 dark:text-white">
              {['Shop Name','Owner','Email Address','Phone','Status','Actions'].map(h => (
                <th key={h} className="p-2 text-left ">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-t hover:bg-gray-100 dark:hover:bg-gray-800">
                <td className="p-2">{s.shop_name}</td>
                <td className="p-2">{s.full_name}</td>
                <td className="p-2">{s.email_address}</td>
                <td className="p-2">{s.phone_number}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {s.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="p-2 space-x-1">
                  <button
                    onClick={() => startEdit(s)}
                    className="px-2 py-1 bg-indigo-500 text-white text-sm rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(s)}
                    className={`px-2 py-1 text-white text-sm rounded ${
                      s.is_active ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                  >
                    {s.is_active ? 'Suspend' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteStore(s)}
                    className="px-2 py-1 bg-red-500 text-white text-sm rounded"
                  >
                    Delete
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
            <h2 className="text-xl font-bold text-indigo-800">Edit {editing.shop_name}</h2>
            {['shop_name','full_name','email_address','phone_number'].map(field => (
              <div key={field}>
                <label className="block text-indigo-800 mb-1">
                  {field.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
                </label>
                <input
                  type="text"
                  name={field}
                  value={form[field]}
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
