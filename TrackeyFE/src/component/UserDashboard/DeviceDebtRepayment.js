import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { FaPlus, FaTimes, FaCheckCircle, FaHistory, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DebtPaymentManager() {
  const storeId = Number(localStorage.getItem('store_id'));
  const pageSize = 20;
  const detailPageSize = 20;

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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);
  const [soldDeviceIds, setSoldDeviceIds] = useState([]);
  const [isLoadingSoldStatus, setIsLoadingSoldStatus] = useState(false);
  const [detailPage, setDetailPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('All'); // New filter state

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
          deviceIds: d.device_id ? d.device_id.split(',').filter(id => id.trim()) : [],
          status,
          last_payment_date: d.date,
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

  // Filter and sort debts
  useEffect(() => {
    // Apply search filter
    const q = search.toLowerCase();
    let filtered = debts.filter(
      d =>
        d.customer_name.toLowerCase().includes(q) ||
        d.product_name.toLowerCase().includes(q) ||
        d.deviceIds.some(id => id.toLowerCase().includes(q)) ||
        (d.paid_to || '').toLowerCase().includes(q)
    );

    // Apply status filter
    if (statusFilter === 'Paid') {
      filtered = filtered.filter(d => d.status === 'paid');
    } else if (statusFilter === 'Unpaid') {
      filtered = filtered.filter(d => d.status === 'owing' || d.status === 'partial');
    }

    // Sort debts
    const sorted = filtered.sort((a, b) => {
      // When "All" filter is active, prioritize unpaid debts
      if (statusFilter === 'All') {
        if (a.remaining_balance > 0 && b.remaining_balance <= 0) return -1;
        if (a.remaining_balance <= 0 && b.remaining_balance > 0) return 1;
      }

      // Apply column sorting
      let valueA, valueB;
      switch (sortColumn) {
        case 'customer_name':
        case 'product_name':
        case 'paid_to':
          valueA = (a[sortColumn] || '').toLowerCase();
          valueB = (b[sortColumn] || '').toLowerCase();
          break;
        case 'owed':
        case 'deposited':
        case 'remaining_balance':
          valueA = a[sortColumn] || 0;
          valueB = b[sortColumn] || 0;
          break;
        case 'last_payment_date':
          valueA = a.last_payment_date ? new Date(a.last_payment_date).getTime() : 0;
          valueB = b.last_payment_date ? new Date(b.last_payment_date).getTime() : 0;
          break;
        case 'created_at':
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
        default:
          valueA = valueB = 0;
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredDebts(sorted);
  }, [debts, search, sortColumn, sortDirection, statusFilter]);

  // Handle column sort
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(column === 'created_at' ? 'desc' : 'asc');
    }
  };

  // Calculate unpaid and paid device metrics
  const { unpaidDevices, unpaidWorth, paidDevices, paidAmount } = useMemo(() => {
    let unpaidDevices = 0;
    let unpaidWorth = 0;
    let paidDevices = 0;
    let paidAmount = 0;

    debts.forEach(debt => {
      const deviceCount = debt.deviceIds.length;
      if (debt.status === 'paid') {
        paidDevices += deviceCount;
        paidAmount += debt.deposited || 0;
      } else {
        unpaidDevices += deviceCount;
        unpaidWorth += debt.remaining_balance || 0;
      }
    });

    return { unpaidDevices, unpaidWorth, paidDevices, paidAmount };
  }, [debts]);

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

  useEffect(() => {
    if (showDetailModal && selectedDeviceIds.length > 0) {
      checkSoldDevices(selectedDeviceIds);
    } else {
      setSoldDeviceIds([]);
    }
  }, [showDetailModal, selectedDeviceIds, checkSoldDevices]);

  const paginatedDevices = useMemo(() => {
    const start = (detailPage - 1) * detailPageSize;
    const end = start + detailPageSize;
    return selectedDeviceIds.slice(start, end);
  }, [selectedDeviceIds, detailPage]);

  const totalDetailPages = Math.ceil(selectedDeviceIds.length / detailPageSize);

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
    setDetailPage(1);
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
      device_id: selectedDebt.deviceIds.join(','),
      qty: selectedDebt.qty,
      owed: selectedDebt.owed,
      deposited: newDeposited,
      remaining_balance: newRemainingBalance,
      paid_to: paidTo || null,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      const { data: newDebt, error: debtError } = await supabase
        .from('debts')
        .insert([paymentData])
        .select('id')
        .single();
      if (debtError) throw debtError;

      const paymentRecord = {
        store_id: storeId,
        customer_id: selectedDebt.customer_id,
        dynamic_product_id: selectedDebt.dynamic_product_id,
        debt_id: newDebt.id,
        payment_amount: payment,
        paid_to: paidTo || null,
        payment_date: new Date().toISOString().split('T')[0],
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
    <div className="p-0 space-y-6 dark:bg-gray-900 dark:text-white">
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

          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Unpaid Devices</h3>
              <p className="text-2xl font-bold">{unpaidDevices}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Unpaid Worth</h3>
              <p className="text-2xl font-bold">₦{unpaidWorth.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Paid Devices</h3>
              <p className="text-2xl font-bold">{paidDevices}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Paid Amount</h3>
              <p className="text-2xl font-bold">₦{paidAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="w-full sm:w-1/2">
              <input
                type="text"
                placeholder="Search by customer, product, device ID, or payment type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="w-full sm:w-1/4">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
              >
                <option value="All">All Debts</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg shadow mb-4">
            <table className="min-w-full bg-white dark:bg-gray-900">
              <thead>
                <tr className="bg-gray-200 text-gray-800 dark:bg-gray-900 dark:text-indigo-600">
                  {[
                    { label: 'Customer', key: 'customer_name' },
                    { label: 'Product', key: 'product_name' },
                    { label: 'Device IDs', key: null },
                    { label: 'Owed', key: 'owed' },
                    { label: 'Paid', key: 'deposited' },
                    { label: 'Balance', key: 'remaining_balance' },
                    { label: 'Paid To', key: 'paid_to' },
                    { label: 'Last Payment', key: 'last_payment_date' },
                    { label: 'Actions', key: null },
                  ].map(({ label, key }) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-left text-sm font-bold cursor-pointer"
                      onClick={() => key && handleSort(key)}
                    >
                      <div className="flex items-center">
                        {label}
                        {key && (
                          <span className="ml-1">
                            {sortColumn === key ? (
                              sortDirection === 'asc' ? (
                                <FaSortUp />
                              ) : (
                                <FaSortDown />
                              )
                            ) : (
                              <FaSort className="text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
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