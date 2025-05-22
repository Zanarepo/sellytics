import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaTimes, FaCheckCircle, FaHistory } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DebtPaymentManager() {
  const storeId = Number(localStorage.getItem('store_id'));
  const pageSize = 10;
  const detailPageSize = 20; // Device IDs per page in view modal

  const [debts, setDebts] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [showManager, setShowManager] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false); // For viewing device IDs
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]); // Device IDs for selected debt
  const [soldDeviceIds, setSoldDeviceIds] = useState([]); // Track sold device IDs
  const [isLoadingSoldStatus, setIsLoadingSoldStatus] = useState(false);
  const [detailPage, setDetailPage] = useState(1); // Pagination for device IDs

  // Fetch debts
  const fetchDebts = useCallback(async () => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from('debts')
      .select(
        'id, customer_id, dynamic_product_id, customer_name, product_name, device_id, qty, owed, deposited, remaining_balance, paid_to, date, created_at',
        { count: 'exact' }
      )
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error(error);
      toast.error('Failed to fetch debts.');
      return;
    }

    const latestDebts = [];
    const seen = new Set();
    for (const d of data) {
      const key = `${d.customer_id}-${d.dynamic_product_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        const status = d.remaining_balance <= 0 ? 'paid' : d.deposited > 0 ? 'partial' : 'owing';
        latestDebts.push({
          ...d,
          deviceIds: d.device_id ? d.device_id.split(',').filter(id => id.trim()) : [], // Convert device_id to array
          status,
          last_payment_date: d.date
        });
      }
    }

    setDebts(latestDebts);
    setTotalCount(count || 0);
  }, [page, storeId]);

  useEffect(() => {
    if (storeId) {
      fetchDebts();
    } else {
      toast.error('Store ID is missing. Please log in or select a store.');
    }
  }, [fetchDebts, storeId]);

  // Filter debts based on search
  useEffect(() => {
    const q = search.toLowerCase();
    const filtered = debts.filter(
      d =>
        d.customer_name.toLowerCase().includes(q) ||
        d.product_name.toLowerCase().includes(q) ||
        d.deviceIds.some(id => id.toLowerCase().includes(q)) ||
        (d.paid_to || '').toLowerCase().includes(q)
    ).sort((a, b) => (a.remaining_balance > 0 && b.remaining_balance <= 0 ? -1 : 1));
    setFilteredDebts(filtered);
  }, [debts, search]);

  // Check sold devices
  const checkSoldDevices = useCallback(async (deviceIds) => {
    if (!deviceIds || deviceIds.length === 0) return [];
    setIsLoadingSoldStatus(true);
    try {
      const normalizedIds = deviceIds.map(id => id.trim());
      const { data, error } = await supabase
        .from('dynamic_sales')
        .select('device_id')
        .in('device_id', normalizedIds);
      if (error) {
        console.error('Error fetching sold devices:', error);
        return [];
      }
      const soldIds = data.map(item => item.device_id.trim());
      setSoldDeviceIds(soldIds);
      return soldIds;
    } catch (error) {
      console.error('Error:', error);
      return [];
    } finally {
      setIsLoadingSoldStatus(false);
    }
  }, []);

  // When showing device IDs, check sold status
  useEffect(() => {
    if (showDetailModal && selectedDeviceIds.length > 0) {
      checkSoldDevices(selectedDeviceIds);
    } else {
      setSoldDeviceIds([]);
    }
  }, [showDetailModal, selectedDeviceIds, checkSoldDevices]);

  // Pagination for device IDs modal
  const paginatedDevices = useMemo(() => {
    const start = (detailPage - 1) * detailPageSize;
    const end = start + detailPageSize;
    return selectedDeviceIds.slice(start, end);
  }, [selectedDeviceIds, detailPage]);

  const totalDetailPages = Math.ceil(selectedDeviceIds.length / detailPageSize);

  // Fetch payment history
  const fetchPaymentHistory = async (customerId, dynamicProductId) => {
    const { data, error } = await supabase
      .from('debt_payments')
      .select('payment_amount, paid_to, payment_date, created_at')
      .eq('store_id', storeId)
      .eq('customer_id', customerId)
      .eq('dynamic_product_id', dynamicProductId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('Failed to fetch payment history.');
      return;
    }

    setPaymentHistory(data || []);
  };

  const openHistoryModal = async debt => {
    setSelectedDebt(debt);
    await fetchPaymentHistory(debt.customer_id, debt.dynamic_product_id);
    setShowHistoryModal(true);
  };

  const openDetailModal = debt => {
    setSelectedDeviceIds(debt.deviceIds || []);
    setDetailPage(1); // Reset to first page
    setShowDetailModal(true);
  };

  const openModal = debt => {
    setSelectedDebt(debt);
    setPayAmount('');
    setPaidTo('');
    setShowModal(true);
  };

  const submitPayment = async e => {
    e.preventDefault();
    if (!selectedDebt) return;

    const payment = parseFloat(payAmount);
    if (isNaN(payment) || payment <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    if (payment > selectedDebt.remaining_balance) {
      toast.error(`Payment cannot exceed remaining balance of ₦${selectedDebt.remaining_balance.toFixed(2)}.`);
      return;
    }

    const newDeposited = selectedDebt.deposited + payment;
    const newRemainingBalance = selectedDebt.owed - newDeposited;

    const paymentData = {
      store_id: storeId,
      customer_id: selectedDebt.customer_id,
      dynamic_product_id: selectedDebt.dynamic_product_id,
      customer_name: selectedDebt.customer_name,
      product_name: selectedDebt.product_name,
      phone_number: selectedDebt.phone_number || null,
      supplier: selectedDebt.supplier || null,
      device_id: selectedDebt.deviceIds.join(','), // Join device IDs
      qty: selectedDebt.qty,
      owed: selectedDebt.owed,
      deposited: newDeposited,
      remaining_balance: newRemainingBalance,
      paid_to: paidTo || null,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      // Insert into debts table
      const { data: newDebt, error: debtError } = await supabase
        .from('debts')
        .insert([paymentData])
        .select('id')
        .single();
      if (debtError) throw debtError;

      // Insert into debt_payments table
      const paymentRecord = {
        store_id: storeId,
        customer_id: selectedDebt.customer_id,
        dynamic_product_id: selectedDebt.dynamic_product_id,
        debt_id: newDebt.id,
        payment_amount: payment,
        paid_to: paidTo || null,
        payment_date: new Date().toISOString().split('T')[0]
      };
      const { error: paymentError } = await supabase.from('debt_payments').insert([paymentRecord]);
      if (paymentError) throw paymentError;

      toast.success(`Payment of ₦${payment.toFixed(2)} recorded successfully${paidTo ? ` via ${paidTo}` : ''}!`);
      setShowModal(false);
      fetchDebts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to record payment.');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-0 space-y-6 dark:bg-gray-900 dark:text-white mt-24">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Toggle Manager Button */}
      <div className="text-center mb-6">
        <button
          onClick={() => setShowManager(prev => !prev)}
          className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
        >
          {showManager ? (
            <>
              <FaTimes className="mr-2" /> Close Record Payment
            </>
          ) : (
            <>
              <FaPlus className="mr-2" /> Re-payment
            </>
          )}
        </button>
      </div>

      {showManager && (
        <>
          <h1 className="text-3xl font-bold text-center text-indigo-700 mb-4 dark:text-indigo-300">Debt Payments</h1>

          {/* Search */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="w-full mb-4">
              <input
                type="text"
                placeholder="Search by customer, product, device ID, or payment type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg shadow mb-4">
            <table className="min-w-full bg-white dark:bg-gray-900">
              <thead>
                <tr className="bg-gray-200 text-gray-800 dark:bg-gray-900 dark:text-indigo-600">
                  <th className="px-4 py-3 text-left text-sm font-bold">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Product</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Device IDs</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Owed</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Paid</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Balance</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Paid To</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Last Payment</th>
                  <th className="px-4 py-3 text-left text-sm font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDebts.map(d => (
                  <tr
                    key={d.id}
                    className={
                      d.status === 'paid'
                        ? 'bg-green-50 dark:bg-green-900'
                        : d.status === 'partial'
                        ? 'bg-yellow-50 dark:bg-yellow-900'
                        : 'bg-red-50 dark:bg-red-900'
                    }
                  >
                    <td className="px-4 py-3 text-sm truncate">{d.customer_name}</td>
                    <td className="px-4 py-3 text-sm truncate">{d.product_name}</td>
                    <td className="px-4 py-3 text-sm truncate">
                      <button
                        onClick={() => openDetailModal(d)}
                        className="text-indigo-600 hover:underline focus:outline-none"
                      >
                        View {d.deviceIds.length} ID{d.deviceIds.length !== 1 ? 's' : ''}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">₦{(d.owed || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">₦{(d.deposited || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">₦{(d.remaining_balance || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm truncate">{d.paid_to || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      {d.last_payment_date ? new Date(d.last_payment_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-center space-x-2">
                      {d.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300">
                          <FaCheckCircle /> Paid
                        </span>
                      ) : (
                        <button
                          onClick={() => openModal(d)}
                          className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
                        >
                          <FaPlus className="mr-1" /> Pay
                        </button>
                      )}
                      <button
                        onClick={() => openHistoryModal(d)}
                        className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition"
                        title="View Payment History"
                      >
                        <FaHistory className="mr-1" /> History
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredDebts.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center text-gray-500 py-4 dark:text-gray-400">
                      No debts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded-full disabled:opacity-50 dark:bg-gray-700 dark:text-white"
            >
              Previous
            </button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 rounded-full disabled:opacity-50 dark:bg-gray-700 dark:text-white"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showModal && selectedDebt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 p-4 z-50">
          <form
            onSubmit={submitPayment}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4 dark:bg-gray-900 dark:text-white"
          >
            <h2 className="text-xl font-semibold">Pay for {selectedDebt.customer_name}</h2>
            <p>
              <span className="font-medium">Product:</span> {selectedDebt.product_name}
            </p>
            <p>
              <span className="font-medium">Device IDs:</span>{' '}
              {selectedDebt.deviceIds.length > 0 ? (
                <button
                  type="button"
                  onClick={() => openDetailModal(selectedDebt)}
                  className="text-indigo-600 hover:underline"
                >
                  View {selectedDebt.deviceIds.length} ID{selectedDebt.deviceIds.length !== 1 ? 's' : ''}
                </button>
              ) : (
                '-'
              )}
            </p>
            <p>
              <span className="font-medium">Remaining Balance:</span> ₦{(selectedDebt.remaining_balance || 0).toFixed(2)}
            </p>
            <label className="block">
              <span className="font-medium">Payment Amount:</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={selectedDebt.remaining_balance}
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="font-medium">Payment To (e.g., Cash, UBA, etc):</span>
              <input
                type="text"
                value={paidTo}
                onChange={e => setPaidTo(e.target.value)}
                placeholder="Enter Name of the bank the money was sent to or cash"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition dark:bg-gray-700 dark:text-white"
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

      {/* Device IDs Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:text-white">
            <h2 className="text-xl font-semibold mb-4">{selectedDebt?.product_name} Device IDs</h2>
            {isLoadingSoldStatus ? (
              <div className="flex justify-center py-4">
                <p>Loading device status...</p>
              </div>
            ) : (
              <>
                <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedDevices.map((id, i) => {
                    const q = search.trim().toLowerCase();
                    const match = id.toLowerCase().includes(q);
                    const isSold = soldDeviceIds.includes(id);
                    return (
                      <li
                        key={i}
                        className={`py-2 px-1 flex items-center justify-between ${
                          match ? 'bg-yellow-50 dark:bg-yellow-900' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <span className={match ? 'font-semibold' : ''}>{id}</span>
                          {isSold && (
                            <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-300">
                              SOLD
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {totalDetailPages > 1 && (
                  <div className="flex justify-between items-center mt-4 text-sm text-gray-700 dark:text-gray-300">
                    <button
                      onClick={() => setDetailPage(p => Math.max(p - 1, 1))}
                      disabled={detailPage === 1}
                      className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
                    >
                      Prev
                    </button>
                    <span>
                      Page {detailPage} of {totalDetailPages}
                    </span>
                    <button
                      onClick={() => setDetailPage(p => Math.min(p + 1, totalDetailPages))}
                      disabled={detailPage === totalDetailPages}
                      className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition dark:bg-gray-700 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedDebt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md space-y-4 dark:bg-gray-900 dark:text-white">
            <h2 className="text-xl font-semibold">Payment History for {selectedDebt.customer_name}</h2>
            <p>
              <span className="font-medium">Product:</span> {selectedDebt.product_name}
            </p>
            <p>
              <span className="font-medium">Device IDs:</span>{' '}
              {selectedDebt.deviceIds.length > 0 ? (
                <button
                  type="button"
                  onClick={() => openDetailModal(selectedDebt)}
                  className="text-indigo-600 hover:underline"
                >
                  View {selectedDebt.deviceIds.length} ID{selectedDebt.deviceIds.length !== 1 ? 's' : ''}
                </button>
              ) : (
                '-'
              )}
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-900">
                <thead>
                  <tr className="bg-gray-200 text-gray-800 dark:bg-gray-900 dark:text-indigo-600">
                    <th className="px-4 py-2 text-left text-sm font-bold">Payment Amount</th>
                    <th className="px-4 py-2 text-left text-sm font-bold">Paid To</th>
                    <th className="px-4 py-2 text-left text-sm font-bold">Payment Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((p, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="px-4 py-2 text-sm">₦{(p.payment_amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm">{p.paid_to || '-'}</td>
                      <td className="px-4 py-2 text-sm">{new Date(p.payment_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {paymentHistory.length === 0 && (
                    <tr>
                      <td colSpan="3" className="text-center text-gray-500 py-4 dark:text-gray-400">
                        No payment history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition dark:bg-gray-700 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}