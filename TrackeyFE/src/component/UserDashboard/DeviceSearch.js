import React, { useState } from 'react';
import { supabase } from "../../supabaseClient";
import { FaTrashAlt } from 'react-icons/fa';

export default function ReceiptSearchTable() {
  const [deviceIdInput, setDeviceIdInput] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // ensure storeId is a number matching receipts.store_receipt_id type
  const storeId = Number(localStorage.getItem('store_id'));  

  // Search handler
  const handleSearch = async () => {
    if (!deviceIdInput.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // debug: log filters
      console.log('Searching receipts for store:', storeId, 'device_id:', deviceIdInput);

      // Fetch receipts matching device_id and store context
      const { data, error: fetchErr } = await supabase
        .from('receipts')
        .select(
          `
            id,
            customer_name,
            sales_id,
            product_id,
            device_id,
            dynamic_sales!inner(amount),
            dynamic_product!inner(name,suppliers_name)
          `
        )
        .eq('store_receipt_id', storeId)
        .eq('device_id', deviceIdInput.trim());

      console.log('Fetch error:', fetchErr, 'Data:', data);
      if (fetchErr) throw fetchErr;

      // Map into UI records with returned flag
      const uiRecords = data.map(r => ({
        receipt_id:    r.id,
        customer_name: r.customer_name,
        device_id:     r.device_id,
        product_name:  r.dynamic_product.name,
        supplier_name: r.dynamic_product.supplier_name,
        sales_amount:  r.dynamic_sales.amount,
        returned:      false
      }));

      setRecords(uiRecords);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch records.');
    } finally {
      setLoading(false);
    }
  };

  const toggleReturned = idx => {
    setRecords(recs => recs.map((r, i) => i === idx ? { ...r, returned: !r.returned } : r));
  };

  const removeRecord = idx => {
    setRecords(recs => recs.filter((_, i) => i !== idx));
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-2">
        <input
          type="text"
          placeholder="Enter Device ID"
          value={deviceIdInput}
          onChange={e => setDeviceIdInput(e.target.value)}
          className="border rounded px-3 py-2 flex-grow mb-2 sm:mb-0"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className="text-red-600 mb-2">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">Receipt ID</th>
              <th className="px-4 py-2 border">Customer</th>
              <th className="px-4 py-2 border">Device ID</th>
              <th className="px-4 py-2 border">Product Name</th>
              <th className="px-4 py-2 border">Supplier Name</th>
              <th className="px-4 py-2 border">Sales Amount</th>
              <th className="px-4 py-2 border">Returned</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  No records found.
                </td>
              </tr>
            ) : (
              records.map((r, idx) => (
                <tr key={r.receipt_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border truncate">{r.receipt_id}</td>
                  <td className="px-4 py-2 border truncate">{r.customer_name}</td>
                  <td className="px-4 py-2 border truncate">{r.device_id}</td>
                  <td className="px-4 py-2 border truncate">{r.product_name}</td>
                  <td className="px-4 py-2 border truncate">{r.supplier_name}</td>
                  <td className="px-4 py-2 border">₦{r.sales_amount.toFixed(2)}</td>
                  <td className="px-4 py-2 border text-center">
                    <input type="checkbox" checked={r.returned} onChange={() => toggleReturned(idx)} />
                  </td>
                  <td className="px-4 py-2 border text-center">
                    <button onClick={() => removeRecord(idx)} className="text-red-600 hover:text-red-800">
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
