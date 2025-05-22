import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaCheckCircle } from 'react-icons/fa';

export default function DebtPaymentManager() {
  const storeId = localStorage.getItem('store_id');

  // state
  const [debts, setDebts]                 = useState([]);
  const [payments, setPayments]           = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [search, setSearch]               = useState('');
  const [page, setPage]                   = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount]       = useState(0);

  // modal
  const [showModal, setShowModal]         = useState(false);
  const [selectedDebt, setSelectedDebt]   = useState(null);
  const [payAmount, setPayAmount]         = useState('');

  // fetch debts with customer.fullname
  const fetchDebts = useCallback(async () => {
    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;
    const { data, count } = await supabase
      .from('debt_tracker')
      .select('id, customer_id, amount_owed, customer(fullname)', { count: 'exact' })
      .eq('store_id', storeId)
      .range(from, to);
    setDebts(data || []);
    setTotalCount(count || 0);
  }, [page, storeId]);

  // fetch payments history
  const fetchPayments = useCallback(async () => {
    const { data } = await supabase
      .from('debt_payment_history')
      .select('debt_tracker_id, amount_paid, payment_date')
      .eq('store_id', storeId);
    setPayments(data || []);
  }, [storeId]);

  useEffect(() => {
    fetchDebts();
    fetchPayments();
  }, [fetchDebts, fetchPayments]);

  // merge debts + payments, compute status, and sort owing first
  useEffect(() => {
    const merged = debts.map(d => {
      const history  = payments.filter(p => p.debt_tracker_id === d.id);
      const paidTotal = history.reduce((sum, h) => sum + parseFloat(h.amount_paid), 0);
      const owed       = parseFloat(d.amount_owed);
      const remaining  = owed - paidTotal;
      const lastDate   = history
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0]
        ?.payment_date;
      let status = 'none';
      if (remaining <= 0) status = 'paid';
      else if (paidTotal > 0) status = 'partial';
      return {
        ...d,
        customer_name: d.customer.fullname,
        owed,
        paid: paidTotal,
        remaining,
        lastDate,
        status
      };
    });

    const q = search.toLowerCase();
    const filtered = merged
      .filter(d => d.customer_name.toLowerCase().includes(q))
      .sort((a, b) => {
        // Owing first (partial or none), then paid
        if ((a.remaining > 0) && (b.remaining <= 0)) return -1;
        if ((a.remaining <= 0) && (b.remaining > 0)) return  1;
        return 0;
      });

    setFilteredDebts(filtered);
  }, [debts, payments, search]);

  // open modal
  const openModal = debt => {
    setSelectedDebt(debt);
    setPayAmount('');
    setShowModal(true);
  };

  // record payment
  const submitPayment = async e => {
    e.preventDefault();
    await supabase
      .from('debt_payment_history')
      .insert([{
        debt_tracker_id: selectedDebt.id,
        customer_id:     selectedDebt.customer_id,
        amount_paid:     payAmount,
        store_id : storeId,
        payment_date:    new Date().toISOString()
      }]);
    setShowModal(false);
    fetchPayments();
    fetchDebts();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-0 sm:p-0 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <h1 className="text-3xl font-bold text-center text-indigo-700 dark:bg-gray-900 dark:text-white">Debt Payments</h1> <br />

      {/* Search & New */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full mb-4">
  <input
    type="text"
    placeholder="Search by customer..."
    value={search}
    onChange={e => setSearch(e.target.value)}
    className="w-full sm:flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
  />
</div>
 <br/>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg shadow ">
        <table className="min-w-full bg-white  ">
          <thead>
             <tr className="bg-gray-500 text-indigo-500 dark:bg-gray-900 dark:text-indigo-600">
              {['Customer','Owed','Paid','Balance','Last Paymt','Actions'].map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-sm font-bold text-indigo-50"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredDebts.map(d => (
              <tr
                key={d.id}
                className={
                  d.status === 'paid' ? 'bg-green-50 dark:bg-gray-900 dark:text-green-500' :
                  d.status === 'partial' ? 'bg-yellow-50 dark:bg-gray-900 dark:text-yellow-600' :
                  'bg-red-50 dark:bg-gray-900 dark:text-red-500'
                }
              >
                <td className="px-4 py-3 text-sm">{d.customer_name}</td>
                <td className="px-4 py-3 text-sm">{d.owed.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{d.paid.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{d.remaining.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">
                  {d.lastDate
                    ? new Date(d.lastDate).toLocaleDateString()
                    : '—'
                  }
                </td>
                <td className="px-4 py-3 text-sm">
                  {d.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 text-green-700">
                      <FaCheckCircle /> Paid
                    </span>
                  ) : (
                    <button
                      onClick={() => openModal(d)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                    >
                      <FaPlus /> Pay
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> <br/>


      {/* Pagination */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>


      {/* Payment Modal */}
      {showModal && selectedDebt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 p-4 dark:bg-gray-900 dark:text-gray-500">
          <form
            onSubmit={submitPayment}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md dark:bg-gray-800 dark:text-white"
          >
            <h2 className="text-xl font-semibold mb-4">
              Pay {selectedDebt.customer_name}
            </h2>
            <p className="mb-2">
              <span className="font-medium">Remaining:</span>{' '}
              {selectedDebt.remaining.toFixed(2)}
            </p>
            <label className="block mb-1">Amount to Pay</label>
            <input
              type="number"
              step="0.01"
              max={selectedDebt.remaining}
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              required
              className="w-full p-2 mb-4 border border-gray-300 rounded focus:ring dark:bg-gray-900 dark:text-gray-100"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition dark:bg-gray-900 dark:text-red-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
