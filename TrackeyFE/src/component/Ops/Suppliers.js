import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { FaFileCsv, FaFilePdf } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SuppliersInventory() {
  const storeId = localStorage.getItem('store_id');

  // State
  const [inventory, setInventory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [suppliers, setSuppliers] = useState([]);
  const itemsPerPage = 20;

  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    if (!storeId) {
      toast.error('No store ID found. Please log in.');
      return;
    }
    const { data, error } = await supabase
      .from('suppliers_inventory')
      .select('id, supplier_name, device_name, device_id, qty, created_at')
      .eq('store_id', storeId)
      .order('id', { ascending: true });
    if (error) {
      console.error('Error fetching suppliers inventory:', error.message);
      toast.error('Failed to fetch inventory');
    } else {
      setInventory(data);
      setFiltered(data);
    }
  }, [storeId]);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    if (!storeId) return;
    const { data: productData, error } = await supabase
      .from('dynamic_product')
      .select('suppliers_name')
      .eq('store_id', storeId);
    if (error) {
      toast.error('Failed to fetch suppliers');
      return;
    }
    // Extract unique suppliers_name, including null as 'None'
    const uniqueSuppliers = [...new Set(productData
      .map(p => p.suppliers_name || 'None'))]
      .map(name => ({ value: name === 'None' ? '' : name, label: name }));
    setSuppliers(uniqueSuppliers);
  }, [storeId]);

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
  }, [fetchInventory, fetchSuppliers]);

  // Search filter
  useEffect(() => {
    if (!search) setFiltered(inventory);
    else {
      const q = search.toLowerCase();
      setFiltered(
        inventory.filter(item => item.device_id.toLowerCase().includes(q))
      );
    }
    setCurrentPage(1);
  }, [search, inventory]);

  // Update supplier_name
  const updateSupplier = async (inventoryId, newSupplierName) => {
    const supplierValue = newSupplierName === '' ? null : newSupplierName;
    const { error } = await supabase
      .from('suppliers_inventory')
      .update({ supplier_name: supplierValue })
      .eq('id', inventoryId);
    if (error) {
      toast.error(`Failed to update supplier: ${error.message}`);
    } else {
      toast.success('Supplier updated successfully');
      fetchInventory();
    }
  };

  // Export CSV
  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Supplier,ProductName,ProductID,Qty,CreatedAt\n";
    filtered.forEach(item => {
      const row = [
        item.supplier_name || 'None',
        item.device_name,
        item.device_id,
        item.qty,
        item.created_at
      ].join(',');
      csv += row + '\n';
    });
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = 'suppliers_inventory.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text('Suppliers Inventory', 10, y);
      y += 10;
      filtered.forEach(item => {
        const line = `Supplier: ${item.supplier_name || 'None'}, Product: ${item.device_name}, ID: ${item.device_id}, Qty: ${item.qty}`;
        doc.text(line, 10, y);
        y += 10;
      });
      doc.save('suppliers_inventory.pdf');
    });
  };

  return (
    <div className="p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by Product ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg shadow dark:text-white">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              {['Supplier', 'Product Name', 'Product ID', 'Qty', 'Created At'].map(h => (
                <th
                  key={h}
                  className="px-4 py-2 text-left text-sm font-semibold dark:bg-gray-900 dark:text-indigo-600"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginatedInventory.map(item => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-sm">
                  <select
                    value={item.supplier_name || ''}
                    onChange={e => updateSupplier(item.id, e.target.value)}
                    className="p-1 border rounded dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">None</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.value} value={supplier.value}>
                        {supplier.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 text-sm">{item.device_name}</td>
                <td className="px-4 py-2 text-sm">{item.device_id}</td>
                <td className="px-4 py-2 text-sm">{item.qty}</td>
                <td className="px-4 py-2 text-sm">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
        >
          Prev
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Exports */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <FaFileCsv /> CSV
        </button>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          <FaFilePdf /> PDF
        </button>
      </div>
    </div>
  );
}