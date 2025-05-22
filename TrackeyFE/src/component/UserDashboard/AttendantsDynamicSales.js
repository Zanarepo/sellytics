import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FaPlus,
  FaTrashAlt,
  FaFileCsv,
  FaFilePdf,
 
} from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import DynamiclowStockAlert from '../DynamicSales/DynamiclowStockAlert';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';

const tooltipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function SalesTracker() {
  const storeId = localStorage.getItem('store_id');
  const itemsPerPage = 20;
  const detailPageSize = 20; // Device IDs per page in view modal

  // State Declarations
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'daily', 'weekly'
  const [showAdd, setShowAdd] = useState(false);
  const [lines, setLines] = useState([
    { dynamic_product_id: '', quantity: 1, unit_price: '', deviceIds: [''], isQuantityManual: false },
  ]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [editing, setEditing] = useState(null);
  const [saleForm, setSaleForm] = useState({ quantity: 1, unit_price: '', deviceIds: [''], payment_method: 'Cash', isQuantityManual: false });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false); // For viewing device IDs
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]); // Device IDs for selected sale
  const [detailPage, setDetailPage] = useState(1); // Pagination for device IDs

  // Ref to prevent double clicks in Strict Mode
  const isProcessingClick = useRef(false);

  // Computed Values
  const paginatedSales = useMemo(() => {
    if (viewMode !== 'list') return [];
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, viewMode]);

  const dailyTotals = useMemo(() => {
    const groups = {};
    sales.forEach((s) => {
      const date = new Date(s.sold_at).toISOString().split('T')[0];
      if (!groups[date]) groups[date] = { period: date, total: 0, count: 0 };
      groups[date].total += s.amount;
      groups[date].count += 1;
    });
    return Object.values(groups).sort((a, b) => b.period.localeCompare(a.period));
  }, [sales]);

  const weeklyTotals = useMemo(() => {
    const groups = {};
    sales.forEach((s) => {
      const date = new Date(s.sold_at);
      const day = date.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const monday = new Date(date);
      monday.setDate(date.getDate() - diff);
      const key = monday.toISOString().split('T')[0];
      if (!groups[key]) groups[key] = { period: `Week of ${key}`, total: 0, count: 0 };
      groups[key].total += s.amount;
      groups[key].count += 1;
    });
    return Object.values(groups).sort((a, b) => b.period.localeCompare(a.period));
  }, [sales]);

  const totalsData = useMemo(() => {
    if (viewMode === 'daily') return dailyTotals;
    if (viewMode === 'weekly') return weeklyTotals;
    return [];
  }, [viewMode, dailyTotals, weeklyTotals]);

  const paginatedTotals = useMemo(() => {
    if (viewMode === 'list') return [];
    const start = (currentPage - 1) * itemsPerPage;
    return totalsData.slice(start, start + itemsPerPage);
  }, [viewMode, totalsData, currentPage]);

  const totalPages = useMemo(() => {
    if (viewMode === 'list') return Math.ceil(filtered.length / itemsPerPage);
    return Math.ceil(totalsData.length / itemsPerPage);
  }, [viewMode, filtered, totalsData]);

  const totalAmount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0), [lines]);

  const paginatedDevices = useMemo(() => {
    const start = (detailPage - 1) * detailPageSize;
    const end = start + detailPageSize;
    return selectedDeviceIds.slice(start, end);
  }, [selectedDeviceIds, detailPage]);

  const totalDetailPages = Math.ceil(selectedDeviceIds.length / detailPageSize);

  // Onboarding steps
  const onboardingSteps = [
    {
      target: '.new-sale-button',
      content: 'Click to record a new sale.',
    },
    {
      target: '.search-input',
      content: 'Search by product name, payment method, or device ID to filter sales.',
    },
    {
      target: '.view-mode-selector',
      content: 'Switch to Daily or Weekly Totals to view sales summaries.',
    },
  ];

  // Check if onboarding has been completed
  useEffect(() => {
    if (!localStorage.getItem('salesTrackerOnboardingCompleted')) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 3000); // 3-second delay
      return () => clearTimeout(timer);
    }
  }, []);

  // Data Fetching
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, selling_price')
      .eq('store_id', storeId)
      .order('name');
    if (error) {
      toast.error(`Failed to fetch products: ${error.message}`);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
  }, [storeId]);

  const fetchInventory = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('dynamic_inventory')
      .select('dynamic_product_id, available_qty')
      .eq('store_id', storeId);
    if (error) {
      toast.error(`Failed to fetch inventory: ${error.message}`);
      setInventory([]);
    } else {
      setInventory(data || []);
    }
  }, [storeId]);

  const fetchSales = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('dynamic_sales')
      .select(`
        id,
        sale_group_id,
        dynamic_product_id,
        quantity,
        unit_price,
        amount,
        payment_method,
        paid_to,
        device_id,
        sold_at,
        dynamic_product(name)
      `)
      .eq('store_id', storeId)
      .order('sold_at', { ascending: false });
    if (error) {
      toast.error(`Failed to fetch sales: ${error.message}`);
      setSales([]);
      setFiltered([]);
    } else {
      const processedSales = (data || []).map(sale => ({
        ...sale,
        deviceIds: sale.device_id ? sale.device_id.split(',').filter(id => id.trim()) : [],
      }));
      setSales(processedSales);
      setFiltered(processedSales);
    }
  }, [storeId]);

  useEffect(() => {
    fetchProducts();
    fetchInventory();
    fetchSales();
  }, [fetchProducts, fetchInventory, fetchSales]);

  // Search Filter
  useEffect(() => {
    if (!search) return setFiltered(sales);
    const q = search.toLowerCase();
    setFiltered(
      sales.filter(
        (s) =>
          s.dynamic_product.name.toLowerCase().includes(q) ||
          s.payment_method.toLowerCase().includes(q) ||
          s.deviceIds.some(id => id.toLowerCase().includes(q))
      )
    );
    setCurrentPage(1);
  }, [search, sales]);

  // Reset Pagination on View Mode Change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  // Form Handlers
  const handleLineChange = (lineIdx, field, value, deviceIdx = null) => {
    setLines((ls) => {
      const next = [...ls];
      if (field === 'deviceIds' && deviceIdx !== null) {
        next[lineIdx].deviceIds[deviceIdx] = value;
        if (!next[lineIdx].isQuantityManual) {
          const nonEmptyCount = next[lineIdx].deviceIds.filter(id => id.trim()).length;
          next[lineIdx].quantity = nonEmptyCount || 1;
        }
      } else if (field === 'quantity') {
        next[lineIdx].quantity = +value;
        next[lineIdx].isQuantityManual = true;
      } else {
        next[lineIdx][field] = ['dynamic_product_id', 'unit_price'].includes(field) ? +value : value;
      }
      if (field === 'dynamic_product_id') {
        const prod = products.find((p) => p.id === +value);
        if (prod) {
          next[lineIdx].unit_price = prod.selling_price;
        }
        const inv = inventory.find((i) => i.dynamic_product_id === +value);
        if (inv && inv.available_qty < 6) {
          const prodName = prod?.name || 'this product';
          toast.warning(`Low stock: only ${inv.available_qty} left for ${prodName}`);
        }
      }
      return next;
    });
  };

  const addDeviceId = (e, lineIdx) => {
    e.stopPropagation();
    const ls = [...lines];
    ls[lineIdx].deviceIds.push('');
    ls[lineIdx].quantity = ls[lineIdx].deviceIds.filter(id => id.trim()).length || 1;
    setLines(ls);
  };

  const removeDeviceId = (lineIdx, deviceIdx) => {
    setLines((ls) => {
      const next = [...ls];
      next[lineIdx].deviceIds = next[lineIdx].deviceIds.filter((_, i) => i !== deviceIdx);
      if (next[lineIdx].deviceIds.length === 0) {
        next[lineIdx].deviceIds = [''];
      }
      if (!next[lineIdx].isQuantityManual) {
        const nonEmptyCount = next[lineIdx].deviceIds.filter(id => id.trim()).length;
        next[lineIdx].quantity = nonEmptyCount || 1;
      }
      next[lineIdx].isQuantityManual = false;
      return next;
    });
  };

  const addLine = () => setLines((ls) => [...ls, { dynamic_product_id: '', quantity: 1, unit_price: '', deviceIds: [''], isQuantityManual: false }]);
  const removeLine = (idx) => setLines((ls) => ls.filter((_, i) => i !== idx));

  const handleEditChange = (field, value, deviceIdx = null) => {
    setSaleForm((f) => {
      const next = { ...f };
      if (field === 'deviceIds' && deviceIdx !== null) {
        next.deviceIds[deviceIdx] = value;
        if (!next.isQuantityManual) {
          const nonEmptyCount = next.deviceIds.filter(id => id.trim()).length;
          next.quantity = nonEmptyCount || 1;
        }
        next.isQuantityManual = false;
      } else if (field === 'quantity') {
        next.quantity = +value;
        next.isQuantityManual = true;
      } else {
        next[field] = ['unit_price'].includes(field) ? +value : value;
      }
      return next;
    });
  };

  const addEditDeviceId = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isProcessingClick.current) return;
    isProcessingClick.current = true;
    setTimeout(() => { isProcessingClick.current = false; }, 100);
    setSaleForm((f) => {
      const newDeviceIds = [...f.deviceIds, ''];
      const nonEmptyCount = newDeviceIds.filter(id => id.trim()).length;
      return {
        ...f,
        deviceIds: newDeviceIds,
        quantity: f.isQuantityManual ? f.quantity : (nonEmptyCount || 1),
        isQuantityManual: false,
      };
    });
  };

  const removeEditDeviceId = (deviceIdx) => {
    setSaleForm((f) => {
      const newDeviceIds = f.deviceIds.filter((_, i) => i !== deviceIdx);
      const nonEmptyCount = newDeviceIds.filter(id => id.trim()).length;
      return {
        ...f,
        deviceIds: newDeviceIds.length === 0 ? [''] : newDeviceIds,
        quantity: f.isQuantityManual ? f.quantity : (nonEmptyCount || 1),
        isQuantityManual: false,
      };
    });
  };

  const openDetailModal = (sale) => {
    setSelectedDeviceIds(sale.deviceIds || []);
    setDetailPage(1);
    setShowDetailModal(true);
  };

  // CRUD Operations
  const createSale = async (e) => {
    e.preventDefault();
    try {
      if (!paymentMethod) {
        toast.error('Please select a payment method.');
        return;
      }
      for (const line of lines) {
        if (!line.dynamic_product_id || line.quantity <= 0 || line.unit_price <= 0) {
          toast.error('Please fill in all required fields for each sale line.');
          return;
        }
        const inv = inventory.find((i) => i.dynamic_product_id === line.dynamic_product_id);
        if (!inv || inv.available_qty < line.quantity) {
          const prod = products.find((p) => p.id === line.dynamic_product_id);
          toast.error(`Insufficient stock for ${prod.name}: only ${inv?.available_qty || 0} available`);
          return;
        }
      }

      const { data: grp, error: grpErr } = await supabase
        .from('sale_groups')
        .insert([{ store_id: storeId, total_amount: totalAmount, payment_method: paymentMethod }])
        .select('id')
        .single();
      if (grpErr) throw new Error(`Sale group creation failed: ${grpErr.message}`);
      const groupId = grp.id;

      const inserts = lines.map((l) => ({
        store_id: storeId,
        sale_group_id: groupId,
        dynamic_product_id: l.dynamic_product_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
        amount: l.quantity * l.unit_price,
        device_id: l.deviceIds.filter(id => id.trim()).join(',') || null,
        payment_method: paymentMethod,
      }));
      const { error: insErr } = await supabase.from('dynamic_sales').insert(inserts);
      if (insErr) throw new Error(`Sales insertion failed: ${insErr.message}`);

      for (const line of lines) {
        const inv = inventory.find((i) => i.dynamic_product_id === line.dynamic_product_id);
        if (inv) {
          const newQty = inv.available_qty - line.quantity;
          const { error } = await supabase
            .from('dynamic_inventory')
            .update({ available_qty: newQty })
            .eq('dynamic_product_id', line.dynamic_product_id)
            .eq('store_id', storeId);
          if (error) toast.error(`Inventory update failed for product ${line.dynamic_product_id}`);
          setInventory((prev) =>
            prev.map((i) =>
              i.dynamic_product_id === line.dynamic_product_id ? { ...i, available_qty: newQty } : i
            )
          );
        }
      }

      toast.success('Sale added successfully!');
      setShowAdd(false);
      setLines([{ dynamic_product_id: '', quantity: 1, unit_price: '', deviceIds: [''], isQuantityManual: false }]);
      setPaymentMethod('Cash');
      fetchSales();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const saveEdit = async () => {
    try {
      const originalSale = sales.find((s) => s.id === editing);
      if (!originalSale) throw new Error('Sale not found');

      const quantityDiff = saleForm.quantity - originalSale.quantity;
      if (quantityDiff > 0) {
        const inv = inventory.find((i) => i.dynamic_product_id === originalSale.dynamic_product_id);
        if (!inv || inv.available_qty < quantityDiff) {
          throw new Error(
            `Insufficient stock to increase quantity by ${quantityDiff}. Available: ${inv?.available_qty || 0}`
          );
        }
      }

      const { error } = await supabase
        .from('dynamic_sales')
        .update({
          quantity: saleForm.quantity,
          unit_price: saleForm.unit_price,
          device_id: saleForm.deviceIds.filter(id => id.trim()).join(',') || null,
          payment_method: saleForm.payment_method || originalSale.payment_method,
        })
        .eq('id', editing);
      if (error) throw new Error(`Update failed: ${error.message}`);

      if (quantityDiff !== 0) {
        const inv = inventory.find((i) => i.dynamic_product_id === originalSale.dynamic_product_id);
        if (inv) {
          const newQty = inv.available_qty - quantityDiff;
          await supabase
            .from('dynamic_inventory')
            .update({ available_qty: newQty })
            .eq('dynamic_product_id', originalSale.dynamic_product_id)
            .eq('store_id', storeId);
          setInventory((prev) =>
            prev.map((i) =>
              i.dynamic_product_id === originalSale.dynamic_product_id ? { ...i, available_qty: newQty } : i
            )
          );
        }
      }

      toast.success('Sale updated successfully!');
      setEditing(null);
      fetchSales();
    } catch (err) {
      toast.error(err.message);
    }
  };


  // Export Functions
  const exportCSV = () => {
    let csv;
    if (viewMode === 'list') {
      csv = 'Product,Device IDs,Quantity,Unit Price,Amount,Payment,Sold At\n';
      filtered.forEach((s) => {
        csv += [
          s.dynamic_product.name,
          s.deviceIds.join(';') || '-',
          s.quantity,
          s.unit_price.toFixed(2),
          s.amount.toFixed(2),
          s.payment_method,
          new Date(s.sold_at).toLocaleString(),
        ].join(',') + '\n';
      });
    } else {
      csv = 'Period,Total Sales,Number of Sales\n';
      totalsData.forEach((t) => {
        csv += [t.period, t.total.toFixed(2), t.count].join(',') + '\n';
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = viewMode === 'list' ? 'sales.csv' : `${viewMode}_totals.csv`;
    link.click();
    toast.success('CSV exported successfully!');
  };

  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text(viewMode === 'list' ? 'Sales Report' : `${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Sales Totals`, 10, y);
      y += 10;
      if (viewMode === 'list') {
        filtered.forEach((s) => {
          doc.text(
            `Product: ${s.dynamic_product.name}, Devices: ${s.deviceIds.join(', ') || '-'}, Qty: ${s.quantity}, Unit: ${s.unit_price.toFixed(2)}, Amt: ${s.amount.toFixed(2)}, Pay: ${s.payment_method}, At: ${new Date(s.sold_at).toLocaleString()}`,
            10,
            y
          );
          y += 10;
        });
      } else {
        totalsData.forEach((t) => {
          doc.text(`Period: ${t.period}, Total: ${t.total.toFixed(2)}, Sales: ${t.count}`, 10, y);
          y += 10;
        });
      }
      doc.save(viewMode === 'list' ? 'sales.pdf' : `${viewMode}_totals.pdf`);
      toast.success('PDF exported successfully!');
    });
  };

  // Onboarding handlers
  const handleNextStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
      localStorage.setItem('salesTrackerOnboardingCompleted', 'true');
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('salesTrackerOnboardingCompleted', 'true');
  };

  // Tooltip positioning
  const getTooltipPosition = (target) => {
    const element = document.querySelector(target);
    if (!element) return { top: 0, left: 0 };
    const rect = element.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 10,
      left: rect.left + window.scrollX,
    };
  };

  // Render
  return (
    <div className="p-2 max-w-7xl mx-auto dark:bg-gray-900 dark:text-white ">
      <DynamiclowStockAlert/>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">View:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 view-mode-selector"
            >
              <option value="list">Individual Sales</option>
              <option value="daily">Daily Totals</option>
              <option value="weekly">Weekly Totals</option>
            </select>
          </div>
          {viewMode === 'list' && (
            <input
              type="text"
              placeholder="Search sales by product, payment, or device ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border rounded w-full sm:w-64 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 search-input"
            />
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 w-full sm:w-auto new-sale-button"
        >
          <FaPlus /> New Sale
        </button>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 mt-24">
          <form
            onSubmit={createSale}
            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-4">Add Sale</h2>
            {lines.map((line, lineIdx) => (
              <div key={lineIdx} className="mb-6 border-b pb-4 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
                  <div className="sm:col-span-4">
                    <label className="block mb-1 text-sm font-medium">Product</label>
                    <select
                      name="dynamic_product_id"
                      value={line.dynamic_product_id}
                      onChange={(e) => handleLineChange(lineIdx, 'dynamic_product_id', e.target.value)}
                      required
                      className="w-full p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-sm font-medium">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      name="quantity"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(lineIdx, 'quantity', e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block mb-1 text-sm font-medium">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      name="unit_price"
                      value={line.unit_price}
                      onChange={(e) => handleLineChange(lineIdx, 'unit_price', e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeLine(lineIdx)}
                      className="p-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                      disabled={lines.length === 1}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="block mb-1 text-sm font-medium">Device IDs (Optional)</label>
                  {line.deviceIds.map((id, deviceIdx) => (
                    <div key={`device-${lineIdx}-${deviceIdx}`} className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={id}
                        onChange={(e) => handleLineChange(lineIdx, 'deviceIds', e.target.value, deviceIdx)}
                        placeholder="Enter device ID"
                        className="flex-1 p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeDeviceId(lineIdx, deviceIdx)}
                        className="p-2 text-red-600 hover:text-red-800"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={(e) => addDeviceId(e, lineIdx)}
                    className="flex items-center gap-1 text-green-600 hover:text-green-800"
                  >
                    <FaPlus /> Add Device ID
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1 text-green-600 hover:text-green-800 mb-4"
            >
              <FaPlus /> Add Item
            </button>
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select payment method…</option>
                <option>Cash</option>
                <option>Bank Transfer</option>
                <option>Card</option>
                <option>Wallet</option>
              </select>
            </div>
            <div className="mb-4 text-lg font-semibold">Total: ₦{totalAmount.toFixed(2)}</div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save Sale
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveEdit();
            }}
            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Edit Sale #{editing}</h2>
            {['quantity', 'unit_price', 'deviceIds', 'payment_method'].map((field) => (
              <div className="mb-4" key={field}>
                <label className="block mb-1 text-sm font-medium capitalize">{field.replace('Ids', ' IDs').replace('_', ' ')}</label>
                {field === 'payment_method' ? (
                  <select
                    name={field}
                    value={saleForm[field] || ''}
                    onChange={(e) => handleEditChange(field, e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select payment method…</option>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Card</option>
                    <option>Wallet</option>
                  </select>
                ) : field === 'deviceIds' ? (
                  <div>
                    {saleForm.deviceIds.map((id, deviceIdx) => (
                      <div key={`edit-device-${deviceIdx}`} className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={id}
                          onChange={(e) => handleEditChange('deviceIds', e.target.value, deviceIdx)}
                          placeholder="Enter device ID"
                          className="flex-1 p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditDeviceId(deviceIdx)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={(e) => addEditDeviceId(e)}
                      className="flex items-center gap-1 text-green-600 hover:text-green-800"
                    >
                      <FaPlus /> Add Device ID
                    </button>
                  </div>
                ) : (
                  <input
                    type="number"
                    step={field === 'unit_price' ? '0.01' : undefined}
                    name={field}
                    value={saleForm[field] || ''}
                    onChange={(e) => handleEditChange(field, e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
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
          </form>
        </div>
      )}

      {/* Device IDs Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Device IDs</h2>
            <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedDevices.map((id, i) => {
                const q = search.trim().toLowerCase();
                const match = id.toLowerCase().includes(q);
                return (
                  <li
                    key={i}
                    className={`py-2 px-1 ${match ? 'bg-yellow-50 dark:bg-yellow-900' : ''}`}
                  >
                    <span className={match ? 'font-semibold' : ''}>{id}</span>
                  </li>
                );
              })}
            </ul>
            {totalDetailPages > 1 && (
              <div className="flex justify-between items-center mt-4 text-sm text-gray-700 dark:text-gray-300">
                <button
                  onClick={() => setDetailPage(p => Math.max(p - 1, 1))}
                  disabled={detailPage === 1}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Prev
                </button>
                <span>
                  Page {detailPage} of {totalDetailPages}
                </span>
                <button
                  onClick={() => setDetailPage(p => Math.min(p + 1, totalDetailPages))}
                  disabled={detailPage === totalDetailPages}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Table */}
      <div className="overflow-x-auto rounded-lg shadow">
        {viewMode === 'list' ? (
          <table className="min-w-full bg-white dark:bg-gray-900 divide-y divide-gray-200">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                {['Product', 'Quantity', 'Unit Price', 'Amount', 'Payment', 'Device IDs', 'Date Sold'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedSales.map((s, index) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 text-sm">{s.dynamic_product.name}</td>
                  <td className="px-4 py-2 text-sm">{s.quantity}</td>
                  <td className="px-4 py-2 text-sm">{s.unit_price.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm">{s.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm">{s.payment_method}</td>
                  <td className="px-4 py-2 text-sm">
                    {s.deviceIds.length > 0 ? (
                      <button
                        onClick={() => openDetailModal(s)}
                        className="text-indigo-600 hover:underline focus:outline-none"
                      >
                        View {s.deviceIds.length} ID{s.deviceIds.length !== 1 ? 's' : ''}
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                 
                  <td className="px-4 py-2 text-sm">{new Date(s.sold_at).toLocaleString()}</td>
                  {/* <td className="px-4 py-2 text-sm flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(s.id);
                        setSaleForm({
                          quantity: s.quantity,
                          unit_price: s.unit_price,
                          deviceIds: s.deviceIds.length > 0 ? s.deviceIds : [''],
                          payment_method: s.payment_method,
                          isQuantityManual: false,
                        });
                      }}
                      className={`p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 edit-button-${index}`}
                      title="Edit sale"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteSale(s)}
                      className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                      title="Delete sale"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                  */} 
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full bg-white dark:bg-gray-900 divide-y divide-gray-200">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Period</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Total Sales (₦)</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Number of Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTotals.map((t, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm">{t.period}</td>
                  <td className="px-4 py-2 text-sm">{t.total.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm">{t.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
        >
          Prev
        </button>
        {[...Array(totalPages).keys()].map((i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded transition ${
              currentPage === i + 1
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
        >
          Next
        </button>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap justify-center items-center gap-3 mt-4">
        <button
          onClick={exportCSV}
          className="flex items-center justify-center gap-1 w-full sm:w-32 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition export-csv-button"
          title="Export to CSV"
        >
          <FaFileCsv className="w-4 h-4" />
          <span>CSV</span>
        </button>
        <button
          onClick={exportPDF}
          className="flex items-center justify-center gap-1 w-full sm:w-32 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition export-pdf-button"
          title="Export to PDF"
        >
          <FaFilePdf className="w-4 h-4" />
          <span>PDF</span>
        </button>
      </div>

      {/* Onboarding Tooltip */}
      {showOnboarding && onboardingStep < onboardingSteps.length && (
        <motion.div
          className="fixed z-50 bg-indigo-600 dark:bg-gray-800 border border-indigo-300 dark:border-gray-600 rounded-lg shadow-lg p-2 sm:p-4 max-w-[260px] sm:max-w-xs"
          style={getTooltipPosition(onboardingSteps[onboardingStep].target)}
          variants={tooltipVariants}
          initial="hidden"
          animate="visible"
        >
          <p className="text-xs sm:text-sm text-white dark:text-gray-200 mb-1 sm:mb-2">
            {onboardingSteps[onboardingStep].content}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-gray-200 dark:text-gray-400">
              Step {onboardingStep + 1} of {onboardingSteps.length}
            </span>
            <div className="space-x-1 sm:space-x-3">
              <button
                onClick={handleSkipOnboarding}
                className="text-xs sm:text-sm text-white hover:text-gray-800 dark:text-gray-300 dark:hover:text-white px-1 sm:px-2 py-0.5 sm:py-1"
              >
                Skip
              </button>
              <button
                onClick={handleNextStep}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm px-1 sm:px-3 py-0.5 sm:py-1 rounded"
              >
                {onboardingStep + 1 === onboardingSteps.length ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}