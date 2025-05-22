import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "../../supabaseClient";
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

const tooltipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ReturnsByDeviceIdManager() {
  const storeId = localStorage.getItem("store_id");
  const [, setStore] = useState(null);
  const [receiptIdQuery, setReceiptIdQuery] = useState('');
  const [deviceIdQuery, setDeviceIdQuery] = useState('');
  const [queriedReceipts, setQueriedReceipts] = useState([]);
  const [returns, setReturns] = useState([]);
  const [filteredReturns, setFilteredReturns] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    receipt_id: "",
    customer_address: "",
    product_name: "",
    device_id: "",
    qty: "",
    amount: "",
    remark: "",
    status: "",
    returned_date: ""
  });
  const [error, setError] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const returnsRef = useRef();

  const onboardingSteps = [
    {
      target: '.receipt-id-query',
      content: 'Search for sales by receipt ID to view all associated device IDs.',
    },
    {
      target: '.device-id-query',
      content: 'Alternatively, search by a specific device ID.',
    },
    {
      target: '.add-return',
      content: 'Add a new return after finding a matching sale.',
    },
    {
      target: '.search-returns',
      content: 'Search existing returns by customer, product, or status.',
    },
  ];

  useEffect(() => {
    if (!localStorage.getItem('returnsManagerOnboardingCompleted')) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!storeId) {
      setError("Store ID is missing. Please log in or select a store.");
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
        } else {
          setStore(data);
        }
      });
  }, [storeId]);

  useEffect(() => {
    if (!receiptIdQuery && !deviceIdQuery) {
      setQueriedReceipts([]);
      setError(null);
      return;
    }

    const fetchSalesAndReceipts = async () => {
      try {
        let saleGroupIds = [];
        let salesData = [];

        if (receiptIdQuery) {
          // Step 1: Fetch receipt by receipt_id
          const { data: receiptData, error: receiptError } = await supabase
            .from('receipts')
            .select('id, sale_group_id, receipt_id, customer_address, product_name, phone_number, sales_qty, sales_amount')
            .eq('store_receipt_id', storeId)
            .eq('receipt_id', receiptIdQuery)
            .single();

          if (receiptError || !receiptData) {
            throw new Error(`No receipt found for ID: ${receiptIdQuery}`);
          }

          saleGroupIds = [receiptData.sale_group_id];

          // Step 2: Fetch dynamic_sales by sale_group_id
          const { data: sales, error: salesError } = await supabase
            .from('dynamic_sales')
            .select(`
              id,
              dynamic_product_id,
              store_id,
              quantity,
              device_id,
              unit_price,
              amount,
              payment_method,
              sale_group_id,
              dynamic_product (
                id,
                name,
                dynamic_product_imeis
              )
            `)
            .eq('store_id', storeId)
            .eq('sale_group_id', receiptData.sale_group_id);

          if (salesError) {
            throw new Error("Failed to fetch sales: " + salesError.message);
          }

          salesData = sales;
        } else if (deviceIdQuery) {
          // Step 3: Fetch dynamic_sales where device_id or dynamic_product_imeis may contain the ID
          const { data: sales, error: salesError } = await supabase
            .from('dynamic_sales')
            .select(`
              id,
              dynamic_product_id,
              store_id,
              quantity,
              device_id,
              unit_price,
              amount,
              payment_method,
              sale_group_id,
              dynamic_product (
                id,
                name,
                dynamic_product_imeis
              )
            `)
            .eq('store_id', storeId)
            .or(`device_id.ilike.%${deviceIdQuery}%,dynamic_product_imeis.ilike.%${deviceIdQuery}%`);

          if (salesError) {
            throw new Error("Failed to fetch sales: " + salesError.message);
          }

          if (!sales || sales.length === 0) {
            throw new Error(`No sales found for device ID: ${deviceIdQuery}`);
          }

          // Step 4: Filter for exact matches and generate one row per matching device ID
          salesData = [];
          sales.forEach(sale => {
            const deviceIds = sale.device_id ? sale.device_id.split(',').map(id => id.trim()) : [];
            const productImeis = sale.dynamic_product?.dynamic_product_imeis
              ? sale.dynamic_product.dynamic_product_imeis.split(',').map(id => id.trim())
              : [];
            const allDeviceIds = [...new Set([...deviceIds, ...productImeis])];

            // Create a row for each exact match
            if (allDeviceIds.includes(deviceIdQuery)) {
              salesData.push({
                ...sale,
                device_id: deviceIdQuery // Override to show only the queried ID
              });
            }
          });

          if (salesData.length === 0) {
            throw new Error(`No exact match found for device ID: ${deviceIdQuery}`);
          }

          saleGroupIds = salesData.map(s => s.sale_group_id).filter(id => id != null);
        }

        // Step 5: Fetch receipts by sale_group_id
        const { data: receiptsData, error: receiptsError } = await supabase
          .from('receipts')
          .select('id, sale_group_id, receipt_id, customer_address, product_name, phone_number, sales_qty, sales_amount')
          .eq('store_receipt_id', storeId)
          .in('sale_group_id', saleGroupIds);

        if (receiptsError) {
          throw new Error("Failed to fetch receipts: " + receiptsError.message);
        }

        // Step 6: Process sales data into rows
        const combinedData = salesData.map(sale => {
          const product = sale.dynamic_product;
          const receipt = receiptsData.find(r => r.sale_group_id === sale.sale_group_id);
          const deviceIds = deviceIdQuery ? [deviceIdQuery] : (sale.device_id?.split(',').filter(id => id.trim()) || []);
          const quantity = deviceIdQuery ? 1 : deviceIds.length;
          const unitPrice = sale.unit_price || sale.amount / sale.quantity;
          const totalAmount = unitPrice * quantity;

          return {
            id: sale.id,
            receipt_id: receipt?.id,
            receipt_code: receipt?.receipt_id || 'Unknown',
            customer_address: receipt?.customer_address || null,
            product_name: product.name,
            device_ids: deviceIds,
            phone_number: receipt?.phone_number || null,
            quantity: quantity,
            unit_price: unitPrice,
            amount: totalAmount,
            payment_method: sale.payment_method,
            sale_group_id: sale.sale_group_id
          };
        });

        console.log('Queried Sales and Receipts:', combinedData);
        setQueriedReceipts(combinedData);
        setError(null);
      } catch (err) {
        setError(err.message);
        setQueriedReceipts([]);
      }
    };

    fetchSalesAndReceipts();
  }, [receiptIdQuery, deviceIdQuery, storeId]);

  useEffect(() => {
    if (!storeId) return;

    const fetchReturns = async () => {
      try {
        const { data: receiptsData, error: receiptsError } = await supabase
          .from('receipts')
          .select('id, receipt_id, sale_group_id')
          .eq('store_receipt_id', storeId);

        if (receiptsError) {
          throw new Error("Failed to fetch receipts: " + receiptsError.message);
        }

        const receiptIds = receiptsData.map(r => r.id);

        const { data: returnsData, error: returnsError } = await supabase
          .from('returns')
          .select('*')
          .in('receipt_id', receiptIds);

        if (returnsError) {
          throw new Error("Failed to fetch returns: " + returnsError.message);
        }

        const combinedReturns = returnsData.map(ret => {
          const receipt = receiptsData.find(r => r.id === ret.receipt_id);
          return {
            ...ret,
            receipt_code: receipt ? receipt.receipt_id : 'Unknown',
            sale_group_id: receipt ? receipt.sale_group_id : null
          };
        });

        console.log('Fetched Returns:', combinedReturns);
        setReturns(combinedReturns || []);
        setFilteredReturns(combinedReturns || []);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchReturns();
  }, [storeId]);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    setFilteredReturns(
      returns.filter(r => {
        const fields = [
          r.customer_address,
          r.product_name,
          r.device_id,
          String(r.qty),
          r.amount != null ? `₦${r.amount.toFixed(2)}` : '',
          r.remark,
          r.status,
          r.returned_date,
          r.receipt_code
        ];
        return fields.some(f => f?.toString().toLowerCase().includes(term));
      })
    );
  }, [searchTerm, returns]);

  useEffect(() => {
    if (returnsRef.current) {
      returnsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [returns]);

  const handleNextStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
      localStorage.setItem('returnsManagerOnboardingCompleted', 'true');
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('returnsManagerOnboardingCompleted', 'true');
  };

  const getTooltipPosition = (target) => {
    const element = document.querySelector(target);
    if (!element) return { top: 0, left: 0 };
    const rect = element.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 10,
      left: rect.left + window.scrollX,
    };
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));

    if (name === 'receipt_id' && value) {
      const selectedReceipt = queriedReceipts.find(r => r.receipt_id === parseInt(value));
      if (selectedReceipt) {
        setForm(f => ({
          ...f,
          receipt_id: value,
          customer_address: selectedReceipt.customer_address || "",
          product_name: selectedReceipt.product_name,
          device_id: selectedReceipt.device_ids.join(', '),
          qty: selectedReceipt.quantity || "",
          amount: selectedReceipt.amount || ""
        }));
      }
    }
  };

  const openEdit = r => {
    setEditing(r);
    setForm({
      receipt_id: r.receipt_id.toString(),
      customer_address: r.customer_address || "",
      product_name: r.product_name,
      device_id: r.device_id || "",
      qty: r.qty || "",
      amount: r.amount || "",
      remark: r.remark || "",
      status: r.status || "",
      returned_date: r.returned_date || ""
    });
  };

  const saveReturn = async () => {
    if (!form.receipt_id || isNaN(parseInt(form.receipt_id))) {
      setError("Please select a valid receipt.");
      return;
    }

    const returnData = {
      receipt_id: parseInt(form.receipt_id),
      customer_address: form.customer_address,
      product_name: form.product_name,
      device_id: form.device_id,
      qty: parseInt(form.qty),
      amount: parseFloat(form.amount),
      remark: form.remark,
      status: form.status,
      returned_date: form.returned_date
    };

    try {
      if (editing && editing.id) {
        await supabase.from("returns").update(returnData).eq("id", editing.id);
      } else {
        await supabase.from("returns").insert([returnData]);
      }

      setEditing(null);
      setForm({
        receipt_id: "",
        customer_address: "",
        product_name: "",
        device_id: "",
        qty: "",
        amount: "",
        remark: "",
        status: "",
        returned_date: ""
      });
      setError(null);

      const { data: receiptsData, error: receiptsError } = await supabase
        .from('receipts')
        .select('id, receipt_id, sale_group_id')
        .eq('store_receipt_id', storeId);

      if (receiptsError) {
        throw new Error("Failed to fetch receipts: " + receiptsError.message);
      }

      const receiptIds = receiptsData.map(r => r.id);

      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .in('receipt_id', receiptIds);

      if (returnsError) {
        throw new Error("Failed to fetch updated returns: " + returnsError.message);
      }

      const combinedReturns = returnsData.map(ret => {
        const receipt = receiptsData.find(r => r.id === ret.receipt_id);
        return {
          ...ret,
          receipt_code: receipt ? receipt.receipt_id : 'Unknown',
          sale_group_id: receipt ? receipt.sale_group_id : null
        };
      });

      console.log('Updated Returns:', combinedReturns);
      setReturns(combinedReturns || []);
      setFilteredReturns(combinedReturns || []);
    } catch (err) {
      setError("Failed to save return: " + err.message);
    }
  };

  const deleteReturn = async id => {
    try {
      await supabase.from("returns").delete().eq("id", id);

      const { data: receiptsData, error: receiptsError } = await supabase
        .from('receipts')
        .select('id, receipt_id, sale_group_id')
        .eq('store_receipt_id', storeId);

      if (receiptsError) {
        throw new Error("Failed to fetch receipts: " + receiptsError.message);
      }

      const receiptIds = receiptsData.map(r => r.id);

      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .in('receipt_id', receiptIds);

      if (returnsError) {
        throw new Error("Failed to fetch updated returns: " + returnsError.message);
      }

      const combinedReturns = returnsData.map(ret => {
        const receipt = receiptsData.find(r => r.id === ret.receipt_id);
        return {
          ...ret,
          receipt_code: receipt ? receipt.receipt_id : 'Unknown',
          sale_group_id: receipt ? receipt.sale_group_id : null
        };
      });

      console.log('Updated Returns after Delete:', combinedReturns);
      setReturns(combinedReturns || []);
      setFilteredReturns(combinedReturns || []);
    } catch (err) {
      setError("Failed to delete return: " + err.message);
    }
  };

  if (!storeId) {
    return <div className="p-4 text-center text-red-500">Store ID is missing. Please log in or select a store.</div>;
  }

  return (
    <div className="p-0 space-y-6 dark:bg-gray-900 dark:text-white ">
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Returns by Receipt or Device ID</h2>

        <div className="w-full mb-4 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={receiptIdQuery}
            onChange={e => setReceiptIdQuery(e.target.value)}
            placeholder="Enter Receipt ID (e.g., RCPT-123-456789)"
            className="flex-1 border px-4 py-2 rounded dark:bg-gray-900 dark:text-white receipt-id-query"
          />
          <input
            type="text"
            value={deviceIdQuery}
            onChange={e => setDeviceIdQuery(e.target.value)}
            placeholder="Enter Device ID"
            className="flex-1 border px-4 py-2 rounded dark:bg-gray-900 dark:text-white device-id-query"
          />
        </div>

        {queriedReceipts.length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-2">Matching Sales</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-lg">
                <thead className="bg-gray-100 dark:bg-gray-900 dark:text-indigo-600">
                  <tr>
                    <th className="text-left px-4 py-2 border-b">Receipt ID</th>
                    <th className="text-left px-4 py-2 border-b">Customer Address</th>
                    <th className="text-left px-4 py-2 border-b">Product</th>
                    <th className="text-left px-4 py-2 border-b">Device ID</th>
                    <th className="text-left px-4 py-2 border-b">Phone Number</th>
                    <th className="text-left px-4 py-2 border-b">Qty</th>
                    <th className="text-left px-4 py-2 border-b">Unit Price</th>
                    <th className="text-left px-4 py-2 border-b">Amount</th>
                    <th className="text-left px-4 py-2 border-b">Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  {queriedReceipts.map((r, index) => (
                    <tr key={`${r.sale_group_id}-${index}`} className="hover:bg-gray-100 dark:bg-gray-900 dark:text-white">
                      <td className="px-4 py-2 border-b truncate">{r.receipt_code}</td>
                      <td className="px-4 py-2 border-b truncate">{r.customer_address || '-'}</td>
                      <td className="px-4 py-2 border-b truncate">{r.product_name}</td>
                      <td className="px-4 py-2 border-b truncate">{r.device_ids[0]}</td>
                      <td className="px-4 py-2 border-b truncate">{r.phone_number || '-'}</td>
                      <td className="px-4 py-2 border-b">{r.quantity}</td>
                      <td className="px-4 py-2 border-b">₦{r.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-2 border-b">₦{r.amount.toFixed(2)}</td>
                      <td className="px-4 py-2 border-b">{r.payment_method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mb-4">
          <button
            onClick={() => setEditing({})}
            className={`px-4 py-2 rounded text-white add-return ${queriedReceipts.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600'}`}
            disabled={queriedReceipts.length === 0}
          >
            Add Return
          </button>
        </div>

        <div className="w-full mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search returns..."
            className="flex-1 border px-4 py-2 rounded dark:bg-gray-900 dark:text-white search-returns"
          />
        </div>

        <div ref={returnsRef} className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded-lg">
            <thead className="bg-gray-100 dark:bg-gray-900 dark:text-indigo-600">
              <tr>
                <th className="text-left px-4 py-2 border-b">Customer Address</th>
                <th className="text-left px-4 py-2 border-b">Product</th>
                <th className="text-left px-4 py-2 border-b">Device ID</th>
                <th className="text-left px-4 py-2 border-b">Qty</th>
                <th className="text-left px-4 py-2 border-b">Amount</th>
                <th className="text-left px-4 py-2 border-b">Remark</th>
                <th className="text-left px-4 py-2 border-b">Status</th>
                <th className="text-left px-4 py-2 border-b">Returned Date</th>
                <th className="text-left px-4 py-2 border-b">Receipt ID</th>
                <th className="text-left px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((r, index) => (
                <tr key={r.id} className="hover:bg-gray-100 dark:bg-gray-900 dark:text-white">
                  <td className="px-4 py-2 border-b truncate">{r.customer_address || '-'}</td>
                  <td className="px-4 py-2 border-b truncate">{r.product_name}</td>
                  <td className="px-4 py-2 border-b truncate">{r.device_id || '-'}</td>
                  <td className="px-4 py-2 border-b">{r.qty}</td>
                  <td className="px-4 py-2 border-b">₦{r.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 border-b truncate">{r.remark || '-'}</td>
                  <td className="px-4 py-2 border-b">{r.status}</td>
                  <td className="px-4 py-2 border-b">{r.returned_date}</td>
                  <td className="px-4 py-2 border-b truncate">{r.receipt_code}</td>
                  <td className="px-4 py-2 border-b">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(r)} className={`hover:text-indigo-600 dark:bg-gray-900 dark:text-white edit-return-${index}`}>
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => deleteReturn(r.id)}
                        className="hover:text-red-600 dark:bg-gray-900 dark:text-white"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReturns.length === 0 && (
                <tr>
                  <td colSpan="10" className="text-center text-gray-500 py-4 dark:bg-gray-900 dark:text-white">
                    No returns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-auto mt-24">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-6 dark:bg-gray-900 dark:text-white">
            <h2 className="text-xl font-bold text-center">{editing.id ? 'Edit Return' : 'Add Return'}</h2>

            <div className="space-y-4">
              <label className="block w-full">
                <span className="font-semibold block mb-1">Receipt</span>
                <select
                  name="receipt_id"
                  value={form.receipt_id}
                  onChange={handleChange}
                  className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Receipt</option>
                  {queriedReceipts.map(r => (
                    <option key={r.receipt_id} value={r.receipt_id}>
                      {r.receipt_code} - {r.product_name} ({r.customer_address || 'No Address'})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block w-full">
                <span className="font-semibold block mb-1">Customer Address</span>
                <input
                  name="customer_address"
                  value={form.customer_address}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
                />
              </label>

              <label className="block w-full">
                <span className="font-semibold block mb-1">Product</span>
                <input
                  name="product_name"
                  value={form.product_name}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
                />
              </label>

              <label className="block w-full">
                <span className="font-semibold block mb-1">Device ID</span>
                <input
                  name="device_id"
                  value={form.device_id}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
                />
              </label>

              <label className="block w-full">
                <span className="font-semibold block mb-1">Quantity</span>
                <input
                  name="qty"
                  value={form.qty}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
                />
              </label>

              <label className="block w-full">
                <span className="font-semibold block mb-1">Amount</span>
                <input
                  name="amount"
                  value={form.amount}
                  readOnly
                  className="border p-2 w-full rounded bg-gray-100 dark:bg-gray-800 dark:text-white"
                />
              </label>

              {['remark', 'status', 'returned_date'].map(field => (
                <label key={field} className="block w-full">
                  <span className="font-semibold capitalize block mb-1">
                    {field.replace('_', ' ')}
                  </span>
                  <input
                    type={field === 'returned_date' ? 'date' : 'text'}
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    className="border p-2 w-full rounded dark:bg-gray-900 dark:text-white"
                    required={field !== 'remark'}
                  />
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-500 text-white rounded">
                Cancel
              </button>
              <button
                onClick={saveReturn}
                className={`px-4 py-2 rounded text-white ${form.receipt_id && !isNaN(parseInt(form.receipt_id)) ? 'bg-indigo-600' : 'bg-gray-400 cursor-not-allowed'}`}
                disabled={!form.receipt_id || isNaN(parseInt(form.receipt_id))}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && onboardingStep < onboardingSteps.length && (
        <motion.div
          className="fixed z-[9999] bg-indigo-600 dark:bg-gray-900 border rounded-lg shadow-lg p-4 w-[90vw] max-w-sm sm:max-w-xs overflow-auto"
          style={{
            ...getTooltipPosition(onboardingSteps[onboardingStep].target),
            maxHeight: '90vh',
          }}
          variants={tooltipVariants}
          initial="hidden"
          animate="visible"
        >
          <p className="text-sm text-white dark:text-gray-300 mb-2">
            {onboardingSteps[onboardingStep].content}
          </p>
          <div className="flex justify-between items-center flex-wrap gap-y-2">
            <span className="text-sm text-gray-200">
              Step {onboardingStep + 1} of {onboardingSteps.length}
            </span>
            <div className="space-x-2">
              <button
                onClick={handleSkipOnboarding}
                className="text-sm text-gray-300 hover:text-gray-800 dark:text-gray-300"
              >
                Skip
              </button>
              <button
                onClick={handleNextStep}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded"
              >
                {onboardingStep + 1 === onboardingSteps.length ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}