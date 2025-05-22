import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaTimes, FaCheckCircle } from 'react-icons/fa';

export default function DebtPaymentManager() {
  const storeId = Number(localStorage.getItem('store_id'));
  const pageSize = 10;

  const [debts, setDebts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  // toggle manager visibility
  const [showManager, setShowManager] = useState(false);

  // fetch debts
  const fetchDebts = useCallback(async () => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count, error } = await supabase
      .from('debt_tracker2')
      .select(
        'id, customer_id, product_id, amount_owed, debt_date, customer:customer_id(fullname), dynamic_product(name)',
        { count: 'exact' }
      )
      .eq('store_id', storeId)
      .range(from, to);
    if (error) console.error(error);
    else {
      setDebts(data || []);
      setTotalCount(count || 0);
    }
  }, [page, storeId]);

  // fetch payments
  const fetchPayments = useCallback(async () => {
    const { data, error } = await supabase
      .from('debt_payment_history2')
      .select('debt_tracker_id, amount_paid, payment_date')
      .eq('store_id', storeId);
    if (error) console.error(error);
    else setPayments(data || []);
  }, [storeId]);

  useEffect(() => {
    fetchDebts();
    fetchPayments();
  }, [fetchDebts, fetchPayments]);

  // merge debts and compute status
  useEffect(() => {
    const merged = debts.map(d => {
      const history = payments.filter(p => p.debt_tracker_id === d.id);
      const paidTotal = history.reduce((sum, h) => sum + parseFloat(h.amount_paid), 0);
      const owed = parseFloat(d.amount_owed);
      const remaining = owed - paidTotal;
      const lastDate = history.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0]?.payment_date;
      let status = 'owing';
      if (remaining <= 0) status = 'paid';
      else if (paidTotal > 0) status = 'partial';
      return {
        ...d,
        customer_name: d.customer.fullname,
        product_name: d.dynamic_product.name,
        owed,
        paid: paidTotal,
        remaining,
        lastDate,
        status
      };
    });
    const q = search.toLowerCase();
    const filtered = merged
      .filter(d => d.customer_name.toLowerCase().includes(q) || d.product_name.toLowerCase().includes(q))
      .sort((a, b) => (a.remaining > 0 && b.remaining <= 0 ? -1 : 1));
    setFilteredDebts(filtered);
  }, [debts, payments, search]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const openModal = debt => {
    setSelectedDebt(debt);
    setPayAmount('');
    setShowModal(true);
  };

  const submitPayment = async e => {
    e.preventDefault();
    if (!selectedDebt) return;
    await supabase.from('debts').insert([{
      debt_tracker_id: selectedDebt.id,
      customer_id: selectedDebt.customer_id,
      debt_product_id: selectedDebt.product_id,
      amount_paid: parseFloat(payAmount),
      store_id: storeId,
      payment_date: new Date().toISOString()
    }]);
    setShowModal(false);
    fetchPayments();
    fetchDebts();
  };

  return (
    <div className="max-w-5xl mx-auto p-0 dark:bg-gray-900 dark:text-white">
      {/* Toggle Manager Button */}
      <div className="text-center mb-6">
  <button
    onClick={() => setShowManager(prev => !prev)}
    className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
  >
    {showManager 
      ? <>
          <FaTimes className="mr-2"/> Close Record Payment
        </>
      : <>
          <div className="mr-2"/> + Re-payment
        </>
    }
  </button>
</div>

      {showManager && (
        <>
          <h1 className="text-3xl font-bold text-center text-indigo-700 mb-4">Debt Payments</h1>

          {/* Search */}
          <div className="flex justify-center mb-4 ">
  <div className="relative w-full sm:w-1/2">
    <div className="absolute top-3 left-3 text-gray-400 " />
    <input
      type="text"
      placeholder="Search by customer or product..."
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 text-gray-800 dark:text-white"
    />
  </div>
</div>


          {/* Table */}
          <div className="overflow-x-auto rounded-lg shadow mb-4">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200 text-gray-800 dark:bg-gray-900 text-gray-800 dark:text-indigo-600">
                  {['Customer','Product','Owed','Paid','Balance','Last Paymt','Actions'].map(col => (
                    <th key={col} className="px-4 py-3 text-left text-sm font-bold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDebts.map(d => (
                  <tr key={d.id} className={
                    d.status === 'paid' ? 'bg-green-50 dark:bg-green-900' :
                    d.status === 'partial' ? 'bg-yellow-50 dark:bg-yellow-900' :
                    'bg-red-50 dark:bg-red-900'
                  }>
                    <td className="px-4 py-3 text-sm">{d.customer_name}</td>
                    <td className="px-4 py-3 text-sm">{d.product_name}</td>
                    <td className="px-4 py-3 text-sm text-right">{d.owed.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">{d.paid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">{d.remaining.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">{d.lastDate ? new Date(d.lastDate).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      {d.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300"><FaCheckCircle /> Paid</span>
                      ) : (
                        <button
                          onClick={() => openModal(d)}
                          className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
                        >
                          <FaPlus className="mr-1"/> Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-gray-200 rounded-full disabled:opacity-50 dark:bg-gray-900 text-gray-800 dark:text-white">
              Previous
            </button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-gray-200 rounded-full disabled:opacity-50 dark:bg-gray-900 text-gray-800 dark:text-white">
              Next
            </button>
          </div>
        </>
      )}

      {/* Modal Popup */}
      {showModal && selectedDebt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <form onSubmit={submitPayment} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold">Pay {selectedDebt.customer_name}</h2>
            <p><span className="font-medium">Remaining:</span> {selectedDebt.remaining.toFixed(2)}</p>
            <input
              type="number"
              step="0.01"
              max={selectedDebt.remaining}
              value={payAmount}
              onChange={e => setPayAmount(e.target.value)}
              required
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
