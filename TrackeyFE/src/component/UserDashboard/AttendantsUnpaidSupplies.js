import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from "../../supabaseClient";
import { FaPlus, FaBell } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DynamicDebtRepayment from './DynamicDebtRepayment';

export default function DebtsManager() {
  const storeId = localStorage.getItem("store_id");
  const [, setStore] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [debts, setDebts] = useState([]);
  const [filteredDebts, setFilteredDebts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [debtEntries, setDebtEntries] = useState([
    {
      customer_id: "",
      customer_name: "",
      phone_number: "",
      dynamic_product_id: "",
      product_name: "",
      supplier: "",
      deviceIds: [""], // Changed from device_id to deviceIds array
      qty: "",
      owed: "",
      deposited: "",
      date: ""
    }
  ]);
  const [error, setError] = useState(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderType, setReminderType] = useState('one-time');
  const [reminderTime, setReminderTime] = useState('');
  const [showDetail, setShowDetail] = useState(null); // For viewing device IDs
  const [soldDeviceIds, setSoldDeviceIds] = useState([]); // Track sold devices
  const [isLoadingSoldStatus, setIsLoadingSoldStatus] = useState(false);
  const [detailPage, setDetailPage] = useState(1); // Pagination for device IDs
  const detailPageSize = 20; // Number of device IDs per page
  const debtsRef = useRef();
  const reminderIntervalRef = useRef(null);

  // Fetch store details
  useEffect(() => {
    if (!storeId) {
      setError("Store ID is missing. Please log in or select a store.");
      toast.error("Store ID is missing.");
      return;
    }
    supabase
      .from("stores")
      .select("shop_name,business_address,phone_number")
      .eq("id", storeId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError("Failed to fetch store details: " + error.message);
          toast.error("Failed to fetch store details.");
        } else {
          setStore(data);
        }
      });
  }, [storeId]);

  // Fetch customers
  useEffect(() => {
    if (!storeId) return;
    supabase
      .from('customer')
      .select('id, fullname, phone_number')
      .eq('store_id', storeId)
      .then(({ data, error }) => {
        if (error) {
          setError("Failed to fetch customers: " + error.message);
          toast.error("Failed to fetch customers.");
        } else {
          setCustomers(data || []);
        }
      });
  }, [storeId]);

  // Fetch products
  useEffect(() => {
    if (!storeId) return;
    supabase
      .from('dynamic_product')
      .select('id, name')
      .eq('store_id', storeId)
      .then(({ data, error }) => {
        if (error) {
          setError("Failed to fetch products: " + error.message);
          toast.error("Failed to fetch products.");
        } else {
          setProducts(data || []);
        }
      });
  }, [storeId]);

  // Fetch debts
  const fetchDebts = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('store_id', storeId);
    if (error) {
      setError("Failed to fetch debts: " + error.message);
      toast.error("Failed to fetch debts.");
    } else {
      // Convert device_id string to deviceIds array
      const debtsWithIds = data.map(debt => ({
        ...debt,
        deviceIds: debt.device_id ? debt.device_id.split(',').filter(id => id.trim()) : []
      }));
      setDebts(debtsWithIds);
      setFilteredDebts(debtsWithIds);
    }
  }, [storeId]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  // Filter debts on searchTerm
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredDebts(
      debts.filter(d => {
        const fields = [
          d.customer_name,
          d.product_name,
          d.phone_number,
          d.supplier,
          ...d.deviceIds, // Search through all device IDs
          String(d.qty),
          d.owed != null ? `₦${d.owed.toFixed(2)}` : '',
          d.deposited != null ? `₦${d.deposited.toFixed(2)}` : '',
          d.remaining_balance != null ? `₦${d.remaining_balance.toFixed(2)}` : '',
          d.date
        ];
        return fields.some(f => f?.toString().toLowerCase().includes(term));
      })
    );
  }, [searchTerm, debts]);

  // Scroll debts into view
  useEffect(() => {
    if (debtsRef.current) {
      debtsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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

  // When showing device details, check sold status
  useEffect(() => {
    if (showDetail && showDetail.deviceIds.length > 0) {
      checkSoldDevices(showDetail.deviceIds);
    } else {
      setSoldDeviceIds([]);
    }
  }, [showDetail, checkSoldDevices]);

  // Pagination for device IDs modal
  const filteredDevices = useMemo(() => {
    return showDetail?.deviceIds || [];
  }, [showDetail]);

  const totalDetailPages = Math.ceil(filteredDevices.length / detailPageSize);

  const paginatedDevices = useMemo(() => {
    const start = (detailPage - 1) * detailPageSize;
    const end = start + detailPageSize;
    return filteredDevices.slice(start, end);
  }, [filteredDevices, detailPage]);

  // Handle reminder notifications
  const showDebtReminders = () => {
    const unpaidDebts = debts.filter(d => (d.remaining_balance || 0) > 0);
    if (unpaidDebts.length === 0) {
      toast.info("No unpaid debts found.");
      return;
    }

    unpaidDebts.forEach(d => {
      toast.warn(
        <div>
          <p><strong>Debtor:</strong> {d.customer_name}</p>
          <p><strong>Outstanding:</strong> ₦{(d.remaining_balance || 0).toFixed(2)}</p>
          <p><strong>Product:</strong> {d.product_name}</p>
          <p><strong>Date:</strong> {d.date}</p>
        </div>,
        { autoClose: 5000 }
      );
    });
  };

  const scheduleReminders = () => {
    if (!reminderTime) {
      toast.error("Please select a reminder time.");
      return;
    }

    const now = new Date();
    const [hours, minutes] = reminderTime.split(':').map(Number);
    let nextReminder = new Date(now);
    nextReminder.setHours(hours, minutes, 0, 0);

    if (nextReminder <= now) {
      nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const msUntilReminder = nextReminder - now;

    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
    }

    if (reminderType === 'one-time') {
      setTimeout(showDebtReminders, msUntilReminder);
      toast.success(`Reminder set for ${nextReminder.toLocaleString()}`);
    } else {
      setTimeout(() => {
        showDebtReminders();
        reminderIntervalRef.current = setInterval(
          showDebtReminders,
          reminderType === 'daily' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
        );
      }, msUntilReminder);
      toast.success(`Recurring ${reminderType} reminders set starting ${nextReminder.toLocaleString()}`);
    }

    setShowReminderForm(false);
  };

  // Handle debt entry changes
  const handleDebtChange = (index, e) => {
    const { name, value } = e.target;
    const updatedEntries = [...debtEntries];
    updatedEntries[index] = { ...updatedEntries[index], [name]: value };

    // Auto-populate customer fields
    if (name === 'customer_id' && value) {
      const selectedCustomer = customers.find(c => c.id === parseInt(value));
      if (selectedCustomer) {
        updatedEntries[index] = {
          ...updatedEntries[index],
          customer_id: value,
          customer_name: selectedCustomer.fullname,
          phone_number: selectedCustomer.phone_number || ""
        };
      }
    }

    // Auto-populate product field
    if (name === 'dynamic_product_id' && value) {
      const selectedProduct = products.find(p => p.id === parseInt(value));
      if (selectedProduct) {
        updatedEntries[index] = {
          ...updatedEntries[index],
          dynamic_product_id: value,
          product_name: selectedProduct.name
        };
      }
    }

    setDebtEntries(updatedEntries);
  };

  // Handle device ID changes
  const handleDeviceIdChange = (index, deviceIndex, value) => {
    const updatedEntries = [...debtEntries];
    updatedEntries[index].deviceIds[deviceIndex] = value;
    setDebtEntries(updatedEntries);
  };

  const addDeviceIdField = index => {
    const updatedEntries = [...debtEntries];
    updatedEntries[index].deviceIds.push('');
    setDebtEntries(updatedEntries);
  };

  const removeDeviceIdField = (index, deviceIndex) => {
    const updatedEntries = [...debtEntries];
    updatedEntries[index].deviceIds.splice(deviceIndex, 1);
    if (updatedEntries[index].deviceIds.length === 0) {
      updatedEntries[index].deviceIds = [''];
    }
    setDebtEntries(updatedEntries);
  };

  const addDebtEntry = () => {
    setDebtEntries([
      ...debtEntries,
      {
        customer_id: "",
        customer_name: "",
        phone_number: "",
        dynamic_product_id: "",
        product_name: "",
        supplier: "",
        deviceIds: [""],
        qty: "",
        owed: "",
        deposited: "",
        date: ""
      }
    ]);
  };

  const removeDebtEntry = index => {
    if (debtEntries.length === 1) return;
    setDebtEntries(debtEntries.filter((_, i) => i !== index));
  };

  const saveDebts = async () => {
    let hasError = false;
    const validEntries = debtEntries.filter(entry => {
      if (
        !entry.customer_id ||
        isNaN(parseInt(entry.customer_id)) ||
        !entry.dynamic_product_id ||
        isNaN(parseInt(entry.dynamic_product_id)) ||
        !entry.qty ||
        isNaN(parseInt(entry.qty)) ||
        !entry.owed ||
        isNaN(parseFloat(entry.owed)) ||
        !entry.date ||
        entry.deviceIds.filter(id => id.trim()).length === 0 // Ensure at least one device ID
      ) {
        hasError = true;
        return false;
      }
      return true;
    });

    if (hasError) {
      setError("Please fill all required fields (Customer, Product, Device ID, Qty, Owed, Date) correctly.");
      toast.error("Please fill all required fields correctly.");
      return;
    }

    const debtData = validEntries.map(entry => ({
      store_id: parseInt(storeId),
      customer_id: parseInt(entry.customer_id),
      dynamic_product_id: parseInt(entry.dynamic_product_id),
      customer_name: entry.customer_name,
      product_name: entry.product_name,
      phone_number: entry.phone_number || null,
      supplier: entry.supplier || null,
      device_id: entry.deviceIds.filter(id => id.trim()).join(','), // Join device IDs
      qty: parseInt(entry.qty),
      owed: parseFloat(entry.owed),
      deposited: entry.deposited ? parseFloat(entry.deposited) : 0.00,
      remaining_balance: parseFloat(entry.owed) - (entry.deposited ? parseFloat(entry.deposited) : 0.00),
      date: entry.date
    }));

    try {
      if (editing && editing.id) {
        await supabase.from("debts").update(debtData[0]).eq("id", editing.id);
      } else {
        await supabase.from("debts").insert(debtData);
      }

      setEditing(null);
      setDebtEntries([{
        customer_id: "",
        customer_name: "",
        phone_number: "",
        dynamic_product_id: "",
        product_name: "",
        supplier: "",
        deviceIds: [""],
        qty: "",
        owed: "",
        deposited: "",
        date: ""
      }]);
      setError(null);
      toast.success(`${debtData.length} debt(s) saved successfully!`);
      fetchDebts();
    } catch (err) {
      setError("Failed to save debts: " + err.message);
      toast.error("Failed to save debts.");
    }
  };


  if (!storeId) {
    return <div className="p-4 text-center text-red-500">Store ID is missing. Please log in or select a store.</div>;
  }

  return (
    <div className="p-0 space-y-6 dark:bg-gray-900 dark:text-white mt-24">
      <DynamicDebtRepayment />
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Debts Management UI */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Debts</h2>

        {/* Search */}
        <div className="w-full mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search debts..."
            className="flex-1 border px-4 py-2 rounded dark:bg-gray-900 dark:text-white w-full"
          />
        </div>

        {/* Add Debt and Reminder Buttons */}
        <div className="mb-4 flex gap-3">
          <button
            onClick={() => setEditing({})}
            className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center gap-2"
          >
            <FaPlus /> Debt
          </button>
          <button
            onClick={() => setShowReminderForm(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded flex items-center gap-2"
          >
            <FaBell /> Set Debt Reminders
          </button>
        </div>

        {/* Debts Table */}
        <div ref={debtsRef} className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded-lg">
            <thead className="bg-gray-100 dark:bg-gray-900 dark:text-indigo-600">
              <tr>
                <th className="text-left px-4 py-2 border-b">Customer</th>
                <th className="text-left px-4 py-2 border-b">Product</th>
                <th className="text-left px-4 py- two border-b">Supplier</th>
                <th className="text-left px-4 py-2 border-b">Device IDs</th>
                <th className="text-left px-4 py-2 border-b">Qty</th>
                <th className="text-left px-4 py-2 border-b">Owed</th>
                <th className="text-left px-4 py-2 border-b">Deposited</th>
                <th className="text-left px-4 py-2 border-b">Remaining Balance</th>
                <th className="text-left px-4 py-2 border-b">Date</th>
                
              </tr>
            </thead>
            <tbody>
              {filteredDebts.map(d => (
                <tr key={d.id} className="hover:bg-gray-100 dark:bg-gray-900 dark:text-white">
                  <td className="px-4 py-2 border-b truncate">{d.customer_name}</td>
                  <td className="px-4 py-2 border-b truncate">{d.product_name}</td>
                  <td className="px-4 py-2 border-b truncate">{d.supplier || '-'}</td>
                  <td className="px-4 py-2 border-b truncate">
                    <button
                      onClick={() => setShowDetail(d)}
                      className="text-indigo-600 hover:underline focus:outline-none"
                    >
                      View {d.deviceIds.length} ID{d.deviceIds.length !== 1 ? 's' : ''}
                    </button>
                  </td>
                  <td className="px-4 py-2 border-b">{d.qty}</td>
                  <td className="px-4 py-2 border-b">₦{(d.owed || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 border-b">₦{(d.deposited || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 border-b">₦{(d.remaining_balance || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 border-b">{d.date}</td>
                  
                </tr>
              ))}
              {filteredDebts.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center text-gray-500 py-4 dark:bg-gray-900 dark:text-white">
                    No debts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Debt Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-auto mt-24">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 dark:bg-gray-900 dark:text-white">
            <h2 className="text-xl font-bold text-center">{editing.id ? 'Edit Debt' : 'Add Debt'}</h2>

            {/* Debt Entries */}
            {debtEntries.map((entry, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Debt Entry {index + 1}</h3>
                  {debtEntries.length > 1 && (
                    <button
                      onClick={() => removeDebtEntry(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="font-semibold block mb-1">Customer</span>
                    <select
                      name="customer_id"
                      value={entry.customer_id}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Select Customer</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.fullname} 
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Product</span>
                    <select
                      name="dynamic_product_id"
                      value={entry.dynamic_product_id}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Supplier</span>
                    <input
                      name="supplier"
                      value={entry.supplier}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Quantity</span>
                    <input
                      type="number"
                      name="qty"
                      value={entry.qty}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                      required
                      min="1"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Owed</span>
                    <input
                      type="number"
                      name="owed"
                      value={entry.owed}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                      required
                      min="0"
                      step="0.01"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Deposited</span>
                    <input
                      type="number"
                      name="deposited"
                      value={entry.deposited}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                      min="0"
                      step="0.01"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold block mb-1">Date</span>
                    <input
                      type="date"
                      name="date"
                      value={entry.date}
                      onChange={e => handleDebtChange(index, e)}
                      className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                      required
                    />
                  </label>

                  <div className="block sm:col-span-2">
                    <span className="font-semibold block mb-1">Device IDs</span>
                    {entry.deviceIds.map((id, deviceIndex) => (
                      <div key={deviceIndex} className="flex gap-2 mt-2">
                        <input
                          value={id}
                          onChange={e => handleDeviceIdChange(index, deviceIndex, e.target.value)}
                          placeholder="Device ID"
                          className="flex-1 p-2 border rounded dark:bg-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeDeviceIdField(index, deviceIndex)}
                          className="text-red-600 hover:text-red-800"
                          title="Remove ID"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addDeviceIdField(index)}
                      className="mt-2 text-indigo-600 hover:underline text-sm"
                    >
                      + Add Device ID
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!editing.id && (
              <button
                onClick={addDebtEntry}
                className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2"
              >
                <FaPlus /> Add Another Debt
              </button>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-500 text-white rounded">
                Cancel
              </button>
              <button
                onClick={saveDebts}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                {editing.id ? 'Save Debt' : 'Create Debt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device IDs Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 mt-24">
          <div className="bg-white p-6 rounded max-w-lg w-full max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:text-white">
            <h2 className="text-xl font-bold mb-4">{showDetail.product_name} Device IDs</h2>

            {isLoadingSoldStatus ? (
              <div className="flex justify-center py-4">
                <p>Loading device status...</p>
              </div>
            ) : (
              <div>
                <ul className="mt-2 divide-y divide-gray-200">
                  {paginatedDevices.map((id, i) => {
                    const q = searchTerm.trim().toLowerCase();
                    const match = id.toLowerCase().includes(q);
                    const isSold = soldDeviceIds.includes(id);

                    return (
                      <li key={i} className={`py-2 px-1 flex items-center justify-between ${match ? 'bg-yellow-50' : ''}`}>
                        <div className="flex items-center">
                          <span className={match ? 'font-semibold' : ''}>
                            {id}
                          </span>
                          {isSold && (
                            <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                              SOLD
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Pagination Controls */}
                {totalDetailPages > 1 && (
                  <div className="flex justify-between items-center mt-4 text-sm text-gray-700">
                    <button
                      onClick={() => setDetailPage(p => Math.max(p - 1, 1))}
                      disabled={detailPage === 1}
                      className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span>
                      Page {detailPage} of {totalDetailPages}
                    </span>
                    <button
                      onClick={() => setDetailPage(p => Math.min(p + 1, totalDetailPages))}
                      disabled={detailPage === totalDetailPages}
                      className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setShowDetail(null)} 
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Form Modal */}
      {showReminderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4 dark:bg-gray-900 dark:text-white">
            <h2 className="text-xl font-bold text-center">Set Debt Reminders</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="font-semibold block mb-1">Reminder Type</span>
                <select
                  value={reminderType}
                  onChange={e => setReminderType(e.target.value)}
                  className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                >
                  <option value="one-time">One-Time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
              <label className="block">
                <span className="font-semibold block mb-1">Reminder Time</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                  required
                />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReminderForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={scheduleReminders}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Set Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}