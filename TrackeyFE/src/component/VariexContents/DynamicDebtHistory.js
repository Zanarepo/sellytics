import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaEye, FaTimes } from 'react-icons/fa';

export default function DebtPaymentHistory() {
  const storeId = Number(localStorage.getItem('store_id'));
  const pageSize = 5;

  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from('debt_payment_history2')
      .select(
        `
        id,
        debt_tracker_id,
        customer_id,
        debt_product_id,
        amount_paid,
        payment_date,
        customer:customer_id(fullname),
        product:debt_product_id(name)
      `,
        { count: 'exact' }
      )
      .eq('store_id', storeId)
      .range(from, to)
      .order('payment_date', { ascending: false });

    if (!error) {
      setHistory(data || []);
      setTotalCount(count || 0);
    }
  }, [page, storeId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filtered = history.filter(h => {
    const q = search.toLowerCase();
    return (
      (h.customer?.fullname || '').toLowerCase().includes(q) ||
      (h.product?.name || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-5xl mx-auto p-0 ">
      {/* Toggle History Button */}
      <div className="text-center mb-6">
  <button
    onClick={() => setShowHistory(prev => !prev)}
    className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
  >
    {showHistory 
      ? <>
          <FaTimes className="mr-2" /> Close Payment History
        </>
      : <>
          <FaEye className="mr-2" /> View Payment History
        </>
    }
  </button>
</div>


      {showHistory && (
        <>
          <h2 className="text-3xl font-bold text-center text-indigo-700 mb-4">Debt Payment History</h2>

          {/* Search */}
          <div className="flex justify-center mb-4 ">
            <input
              type="text"
              placeholder="Search by customer or product..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-1/2 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 text-gray-800 dark:text-white"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full rounded-lg shadow ">
            <table className="min-w-full bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
              <thead>
                <tr className="bg-gray-200 text-gray-800 dark:bg-gray-900 text-gray-800 dark:text-indigo-600">
                  {['Customer', 'Product', 'Amount Paid', 'Payment Date', 'Action'].map(col => (
                    <th key={col} className="px-4 py-2 text-left text-sm font-semibold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-2 text-sm">{row.customer?.fullname || '-'}</td>
                    <td className="px-4 py-2 text-sm">{row.product?.name || '-'}</td>
                    <td className="px-4 py-2 text-sm text-right">{parseFloat(row.amount_paid).toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm">{row.payment_date ? new Date(row.payment_date).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-2 text-sm text-center">
                      <button
                        onClick={() => {/* delete handler */}}
                        className="px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-200 rounded-full disabled:opacity-50 dark:bg-gray-900 text-gray-800 dark:text-white"
            >Prev</button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-gray-200 rounded-full disabled:opacity-50 dark:bg-gray-900 text-gray-800 dark:text-white"
            >Next</button>
          </div>
        </>
      )}
    </div>
  );
}