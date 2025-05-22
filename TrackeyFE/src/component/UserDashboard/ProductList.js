// Products.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import {
  FaEdit,
  FaTrashAlt,
  FaFileCsv,
  FaFilePdf,
  FaPlus,
} from 'react-icons/fa';

export default function Products() {
  const storeId = localStorage.getItem('store_id');

  // Data & UI state
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    purchase_price: '',
    purchase_qty: '',
    markup_percent: '',
  });

  // Pagination
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Helper to compute selling price
  const calculateSellingPrice = ({ purchase_price, purchase_qty, markup_percent }) => {
    const cost = parseFloat(purchase_price) / parseFloat(purchase_qty || 1);
    return parseFloat((cost * (1 + parseFloat(markup_percent)/100)).toFixed(2));
  };

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, purchase_price, purchase_qty, markup_percent, selling_price, created_at')
      .eq('store_id', storeId)
      .order('id', { ascending: true });
    if (!error) {
      setProducts(data);
      setFiltered(data);
      setPage(0);
    }
  }, [storeId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Search filter
  useEffect(() => {
    const q = search.toLowerCase();
    const results = !search
      ? products
      : products.filter(p => p.name.toLowerCase().includes(q));
    setFiltered(results);
    setPage(0);
  }, [search, products]);

  // Handlers
  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleAddChange = e => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  // Create product
  const createProduct = async e => {
    e.preventDefault();
    const selling_price = calculateSellingPrice(addForm);
    await supabase
      .from('products')
      .insert([{ store_id: storeId, ...addForm, selling_price }]);
    setShowAdd(false);
    setAddForm({ name: '', description: '', purchase_price: '', purchase_qty: '', markup_percent: '' });
    fetchProducts();
  };

  // Start editing
  const startEdit = p => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      purchase_price: p.purchase_price,
      purchase_qty: p.purchase_qty,
      markup_percent: p.markup_percent,
    });
  };

  // Save edit
  const saveEdit = async () => {
    const selling_price = calculateSellingPrice(form);
    await supabase
      .from('products')
      .update({ ...form, selling_price })
      .eq('id', editing.id);
    setEditing(null);
    fetchProducts();
  };

  // Delete
  const deleteProduct = async p => {
    if (window.confirm(`Delete product "${p.name}"?`)) {
      await supabase.from('products').delete().eq('id', p.id);
      fetchProducts();
    }
  };

  // Export CSV
  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Name,Description,Purchase Price,Qty,Markup %,Selling Price,Created At\n";
    filtered.forEach(p => {
      const row = [
        p.name,
        (p.description || '').replace(/,/g, ' '),
        parseFloat(p.purchase_price).toFixed(2),
        parseInt(p.purchase_qty),
        parseFloat(p.markup_percent).toFixed(2),
        parseFloat(p.selling_price).toFixed(2),
        p.created_at,
      ].join(',');
      csv += row + "\n";
    });
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = 'products.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text('Products List', 10, y); y += 10;
      filtered.forEach(p => {
        const line = `Name: ${p.name}, Purchase: ${parseFloat(p.purchase_price).toFixed(2)}, Qty: ${p.purchase_qty}, Markup: ${parseFloat(p.markup_percent).toFixed(2)}%, Sell: ${parseFloat(p.selling_price).toFixed(2)}`;
        doc.text(line, 10, y);
        y += 10;
      });
      doc.save('products.pdf');
    });
  };

  // Pagination
  const start = page * pageSize;
  const pageData = filtered.slice(start, start + pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="p-4">
      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2b ">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:flex-1 p-2 border rounded dark:bg-gray-900 dark:text-white"
        />
        <button
          onClick={() => setShowAdd(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 mt-6"
        >
          <FaPlus /> Add Product
        </button>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4  mt-24">
          <form onSubmit={createProduct} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white  p-6 rounded-lg shadow-lg w-full max-w-md dark:bg-gray-900 dark:text-white">
            <h2 className="text-xl font-bold mb-4 ">Add Product</h2>
            {[
              { name:'name', label:'Name', type:'text' },
              { name:'description', label:'Description', type:'text' },
              { name:'purchase_price', label:'Total Purchase Price', type:'number' },
              { name:'purchase_qty', label:'Quantity Purchased', type:'number' },
              { name:'markup_percent', label:'Markup %', type:'number' },
            ].map(field => (
              <div className="mb-3" key={field.name}>
                <label className="block mb-1 ">{field.label}</label>
                <input
                  type={field.type}
                  step="0.01"
                  name={field.name}
                  value={addForm[field.name]}
                  onChange={handleAddChange}
                  required={['name','purchase_price','purchase_qty'].includes(field.name)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:bg-gray-900 dark:text-white"
                />
              </div>
            ))}

            <div className="flex justify-center sm:justify-end gap-2">
            <div className="w-full flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
        </div>

          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow dark:bg-gray-900 dark:text-white">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              {['Name','Desc.','Purchase','Qty','Markup %','Price','Date','Actions'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-sm font-semibold dark:bg-gray-900 dark:text-indigo-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {pageData.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2 text-sm">{p.name}</td>
                <td className="px-4 py-2 text-sm">{p.description}</td>
                <td className="px-4 py-2 text-sm">{parseFloat(p.purchase_price).toFixed(2)}</td>
                <td className="px-4 py-2 text-sm">{p.purchase_qty}</td>
                <td className="px-4 py-2 text-sm">{parseFloat(p.markup_percent).toFixed(2)}</td>
                <td className="px-4 py-2 text-sm">{parseFloat(p.selling_price).toFixed(2)}</td>
                <td className="px-4 py-2 text-sm">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => startEdit(p)} className="text-indigo-600 hover:text-indigo-800">
                    <FaEdit />
                  </button>
                  <button onClick={() => deleteProduct(p)} className="text-red-600 hover:text-red-800">
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-center sm:justify-between items-center gap-2 mt-4">
  <button
    onClick={() => setPage(prev => Math.max(prev - 1, 0))}
    disabled={page === 0}
    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 dark:bg-white dark:text-indigo-500"
  >
    Prev
  </button>

  <span className="text-sm">{`Page ${page + 1} of ${totalPages}`}</span>

  <button
    onClick={() => setPage(prev => Math.min(prev + 1, totalPages - 1))}
    disabled={page + 1 >= totalPages}
    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 dark:bg-white dark:text-indigo-500"
  >
    Next
  </button>
</div>


      {/* Exports */}
      <div className="flex justify-center gap-4 mt-6 ">
        <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2 ">
          <FaFileCsv /> CSV
        </button>
        <button onClick={exportPDF} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2">
          <FaFilePdf /> PDF
        </button>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit {editing.name}</h2>
            {[
              { name:'name', label:'Name', type:'text' },
              { name:'description', label:'Description', type:'text' },
              { name:'purchase_price', label:'Total Purchase Price', type:'number' },
              { name:'purchase_qty', label:'Quantity Purchased', type:'number' },
              { name:'markup_percent', label:'Markup %', type:'number' },
            ].map(field => (
              <div className="mb-3" key={field.name}>
                <label className="block mb-1">{field.label}</label>
                <input
                  type={field.type}
                  step="0.01"
                  name={field.name}
                  value={form[field.name] || ''}
                  onChange={handleFormChange}
                  required={['name','purchase_price','purchase_qty'].includes(field.name)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
              <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
