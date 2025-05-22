import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "../../supabaseClient";
import { FaEdit, FaTrashAlt, FaPrint, FaDownload } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
//import SignaturePad from './SignaturePad'

const tooltipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ReceiptManager() {
  const storeId = localStorage.getItem("store_id");
  const [store, setStore] = useState(null);
  const [saleGroupsList, setSaleGroupsList] = useState([]);
  const [selectedSaleGroup, setSelectedSaleGroup] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [searchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [salesSearch, setSalesSearch] = useState('');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [form, setForm] = useState({ customer_name: "", customer_address: "", phone_number: "", warranty: "" });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  // States for toggle and pagination
  const [showSaleGroups, setShowSaleGroups] = useState(true);
  const [showReceipts, setShowReceipts] = useState(true);
  const [currentSaleGroupsPage, setCurrentSaleGroupsPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const saleGroupsPerPage = 10;
  const itemsPerPage = 10;

  // Dynamic style states
  const [headerBgColor, setHeaderBgColor] = useState('#1E3A8A');
  const [headerTextColor, setHeaderTextColor] = useState('#FFFFFF');
  const [headerFont, setHeaderFont] = useState('font-serif');
  const [bodyFont, setBodyFont] = useState('font-sans');
  const [watermarkColor, setWatermarkColor] = useState('rgba(30,58,138,0.1)');

  const printRef = useRef();
  const receiptsRef = useRef();
  const saleGroupsRef = useRef();

  // Onboarding steps
  const onboardingSteps = [
    {
      target: '.sales-search',
      content: 'Search for sale receipt by ID, amount, or payment method.',
    },
    {
      target: '.sort-id',
      content: 'Sort sale receipts by ID to organize your data.',
    },
    {
      target: filteredReceipts.length > 0 ? '.edit-receipt-0' : '.sales-search',
      content: filteredReceipts.length > 0 ? 'Edit receipt details like customer name or warranty.' : 'Select a sale details to view and edit receipts save it, print or download.',
    },
  ];

  // Check if onboarding has been completed
  useEffect(() => {
    if (!localStorage.getItem('receiptManagerOnboardingCompleted')) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch store details
  useEffect(() => {
    if (!storeId) return;
    supabase
      .from("stores")
      .select("shop_name,business_address,phone_number")
      .eq("id", storeId)
      .single()
      .then(({ data }) => setStore(data));
  }, [storeId]);

  // Load sale groups with associated dynamic sales and dynamic_product
  useEffect(() => {
    if (!storeId) return;
    supabase
      .from('sale_groups')
      .select(`
        id,
        store_id,
        total_amount,
        payment_method,
        created_at,
        dynamic_sales (
          id,
          device_id,
          quantity,
          amount,
          sale_group_id,
          dynamic_product (
            id,
            name
          )
        )
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setSaleGroupsList(data || []));
  }, [storeId]);

  // Load or initialize a single receipt for a sale group
  useEffect(() => {
    if (!selectedSaleGroup) {
      setReceipts([]);
      return;
    }
    (async () => {
      // Fetch existing receipts
      let { data: receiptData } = await supabase
        .from("receipts")
        .select("*")
        .eq("sale_group_id", selectedSaleGroup.id)
        .order('id', { ascending: false });

      // If no receipt exists, create one for the sale group
      if (receiptData.length === 0 && selectedSaleGroup.dynamic_sales?.length > 0) {
        const firstSale = selectedSaleGroup.dynamic_sales[0];
        const totalQuantity = selectedSaleGroup.dynamic_sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const receiptInsert = {
          store_receipt_id: selectedSaleGroup.store_id,
          sale_group_id: selectedSaleGroup.id,
          product_id: firstSale.dynamic_product.id,
          sales_amount: selectedSaleGroup.total_amount,
          sales_qty: totalQuantity,
          product_name: firstSale.dynamic_product.name,
          device_id: firstSale.device_id || null,
          customer_name: "",
          customer_address: "",
          phone_number: "",
          warranty: "",
          date: new Date(selectedSaleGroup.created_at).toISOString(),
          receipt_id: `RCPT-${selectedSaleGroup.id}-${Date.now()}`
        };

        const { data: newReceipt } = await supabase
          .from("receipts")
          .insert([receiptInsert])
          .select()
          .single();
        receiptData = [newReceipt];
      }

      // Ensure only one receipt is kept
      if (receiptData.length > 1) {
        const [latestReceipt] = receiptData;
        await supabase
          .from("receipts")
          .delete()
          .eq("sale_group_id", selectedSaleGroup.id)
          .neq("id", latestReceipt.id);
        receiptData = [latestReceipt];
      }

      setReceipts(receiptData || []);
    })();
  }, [selectedSaleGroup]);

  // Filter receipts on searchTerm or receipts change
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const dateStr = selectedSaleGroup ? new Date(selectedSaleGroup.created_at).toLocaleDateString().toLowerCase() : '';
    setFilteredReceipts(
      receipts.filter(r => {
        const fields = [
          r.receipt_id,
          String(r.sale_group_id),
          r.product_name,
          String(r.sales_qty),
          r.device_id,
          r.sales_amount != null ? `₦${r.sales_amount.toFixed(2)}` : '',
          r.customer_name,
          r.customer_address,
          r.phone_number,
          r.warranty,
          dateStr
        ];
        return fields.some(f => f?.toString().toLowerCase().includes(term));
      })
    );
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchTerm, receipts, selectedSaleGroup]);

  // Scroll receipts into view when receipts list changes
  useEffect(() => {
    if (receiptsRef.current && showReceipts) {
      receiptsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [receipts, showReceipts]);

  // Scroll sale groups into view when sale groups list changes
  useEffect(() => {
    if (saleGroupsRef.current && showSaleGroups) {
      saleGroupsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [saleGroupsList, showSaleGroups]);

  // Onboarding handlers
  const handleNextStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
      localStorage.setItem('receiptManagerOnboardingCompleted', 'true');
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('receiptManagerOnboardingCompleted', 'true');
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

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const openEdit = r => {
    setEditing(r);
    setForm({
      customer_name: r.customer_name || "",
      customer_address: r.customer_address || "",
      phone_number: r.phone_number || "",
      warranty: r.warranty || ""
    });
  };
  const saveReceipt = async () => {
    await supabase.from("receipts").update({ ...editing, ...form }).eq("id", editing.id);
    setEditing(null);
    setForm({ customer_name: "", customer_address: "", phone_number: "", warranty: "" });
    const { data } = await supabase
      .from("receipts")
      .select("*")
      .eq("sale_group_id", selectedSaleGroup.id)
      .order('id', { ascending: false });
    setReceipts(data);
  };
  const handlePrint = r => {
    openEdit(r);
    setTimeout(() => window.print(), 200);
  };

  // Define filteredSaleGroups before pagination logic
  const filteredSaleGroups = [...saleGroupsList]
    .filter(sg =>
      sg.id.toString().includes(salesSearch) ||
      sg.total_amount.toString().includes(salesSearch) ||
      sg.payment_method.toLowerCase().includes(salesSearch.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

  // Reset Sale Groups pagination when filteredSaleGroups changes
  useEffect(() => {
    setCurrentSaleGroupsPage(1);
  }, [filteredSaleGroups]);

  // Pagination logic for Sale Groups
  const totalSaleGroupsPages = Math.ceil(filteredSaleGroups.length / saleGroupsPerPage);
  const saleGroupsStartIndex = (currentSaleGroupsPage - 1) * saleGroupsPerPage;
  const saleGroupsEndIndex = saleGroupsStartIndex + saleGroupsPerPage;
  const paginatedSaleGroups = filteredSaleGroups.slice(saleGroupsStartIndex, saleGroupsEndIndex);

  const handleSaleGroupsPageChange = (page) => {
    if (page >= 1 && page <= totalSaleGroupsPages) {
      setCurrentSaleGroupsPage(page);
      if (saleGroupsRef.current && showSaleGroups) {
        saleGroupsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Pagination logic for Receipts
  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReceipts = filteredReceipts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (receiptsRef.current && showReceipts) {
        receiptsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (!storeId) return <div className="p-4 text-center text-red-500">Select a store first.</div>;

  // Print CSS
  const printStyles = `
    @media print {
      body * { visibility: hidden; }
      .printable-area, .printable-area * { visibility: visible; }
      .printable-area { position: absolute; top:0; left:0; width:100%; }
    }
  `;
  const headerStyle = { backgroundColor: headerBgColor, color: headerTextColor };
  const watermarkStyle = { color: watermarkColor, fontSize: '4rem', opacity: 1 };

  return (
    <>
      <style>{printStyles}</style>

      <div className="print:hidden p-0 space-y-8 dark:bg-gray-900 dark:text-white">
        {/* Management UI */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Receipt List</h2>
            <button
              onClick={() => setShowSaleGroups(!showSaleGroups)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showSaleGroups ? 'Hide Receipt List' : 'Show Receipt List'}
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <input
                type="text"
                value={salesSearch}
                onChange={e => setSalesSearch(e.target.value)}
                placeholder="Search by Sale Group ID, Amount, or Payment Method"
                className="flex-1 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white sales-search"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    setSortKey('id');
                    setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                  }}
                  className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors sort-id dark:bg-gray-800 dark:text-white"
                >
                  Sort by ID {sortKey === 'id' && (sortOrder === 'asc' ? '⬆️' : '⬇️')}
                </button>

                <button
                  onClick={() => {
                    setSortKey('total_amount');
                    setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
                  }}
                  className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors dark:bg-gray-800 dark:text-white"
                >
                  Sort by Amount {sortKey === 'total_amount' && (sortOrder === 'asc' ? '⬆️' : '⬇️')}
                </button>
              </div>
            </div>
          </div>

          {/* Sale Groups Table (Receipt List) */}
          <AnimatePresence>
            {showSaleGroups && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div ref={saleGroupsRef} className="overflow-x-auto rounded-lg shadow">
                  <table className="min-w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">Sale Group ID</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">Total Amount</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">Payment Method</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSaleGroups.map(sg => (
                        <tr
                          key={sg.id}
                          onClick={() => setSelectedSaleGroup(sg)}
                          className={`cursor-pointer transition-colors ${
                            selectedSaleGroup?.id === sg.id ? 'bg-indigo-50 dark:bg-gray-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          } even:bg-gray-50 dark:even:bg-gray-800`}
                        >
                          <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">#{sg.id}</td>
                          <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">₦{sg.total_amount.toFixed(2)}</td>
                          <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">{sg.payment_method}</td>
                          <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">{new Date(sg.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {paginatedSaleGroups.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center text-gray-500 dark:text-gray-400 py-6">
                            No sale groups found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for Sale Groups */}
                {filteredSaleGroups.length > saleGroupsPerPage && (
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => handleSaleGroupsPageChange(currentSaleGroupsPage - 1)}
                      disabled={currentSaleGroupsPage === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalSaleGroupsPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => handleSaleGroupsPageChange(page)}
                          className={`px-3 py-1 rounded-lg ${
                            currentSaleGroupsPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSaleGroupsPageChange(currentSaleGroupsPage + 1)}
                      disabled={currentSaleGroupsPage === totalSaleGroupsPages}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Next
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Receipts Section */}
        <div ref={receiptsRef} className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Receipts {selectedSaleGroup ? `for Sale Group #${selectedSaleGroup.id}` : ''}
            </h3>
            <button
              onClick={() => setShowReceipts(!showReceipts)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showReceipts ? 'Hide Receipts' : 'Show Receipts'}
            </button>
          </div>

          <AnimatePresence>
            {showReceipts && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="overflow-x-auto rounded-lg shadow">
                  <table className="min-w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">Receipt ID</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">Customer</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">Phone</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">Warranty</th>
                        <th className="text-left px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReceipts.map((r, index) => (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 even:bg-gray-50 dark:even:bg-gray-800 transition-colors">
                          <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 truncate">{r.receipt_id}</td>
                          <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 truncate">{r.customer_name || '-'}</td>
                          <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 truncate">{r.phone_number || '-'}</td>
                          <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 truncate">{r.warranty || '-'}</td>
                          <td className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex gap-4">
                              <button onClick={() => openEdit(r)} className={`text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 edit-receipt-${index}`}>
                                <FaEdit />
                              </button>
                              <button
                                onClick={async () => {
                                  await supabase.from("receipts").delete().eq("id", r.id);
                                  const { data } = await supabase
                                    .from("receipts")
                                    .select("*")
                                    .eq("sale_group_id", selectedSaleGroup.id);
                                  setReceipts(data);
                                }}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <FaTrashAlt />
                              </button>
                              <button onClick={() => handlePrint(r)} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                                <FaPrint />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {paginatedReceipts.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center text-gray-500 dark:text-gray-400 py-6">
                            No receipts found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for Receipts */}
                {filteredReceipts.length > itemsPerPage && (
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-lg ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Next
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="print:hidden fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-auto mt-10">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">Edit Receipt {editing.receipt_id}</h2>

            {/* Receipt Fields */}
            <div className="space-y-4">
              {['customer_name', 'customer_address', 'phone_number', 'warranty'].map(field => (
                <label key={field} className="block">
                  <span className="font-semibold text-gray-700 dark:text-gray-200 capitalize block mb-1">
                    {field.replace('_', ' ')}
                  </span>
                  <input
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
                  />
                </label>
              ))}
            </div>

            {/* Style Controls in Modal */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Customize Receipt Style</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-200 mb-1">Header Background</label>
                  <input
                    type="color"
                    value={headerBgColor}
                    onChange={e => setHeaderBgColor(e.target.value)}
                    className="w-full h-10 p-0 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-200 mb-1">Header Text Color</label>
                  <input
                    type="color"
                    value={headerTextColor}
                    onChange={e => setHeaderTextColor(e.target.value)}
                    className="w-full h-10 p-0 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-200 mb-1">Header Font</label>
                  <select
                    value={headerFont}
                    onChange={e => setHeaderFont(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg w-full dark:bg-gray-900 dark:text-white"
                  >
                    <option value="font-sans">Sans</option>
                    <option value="font-serif">Serif</option>
                    <option value="font-mono">Mono</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-200 mb-1">Body Font</label>
                  <select
                    value={bodyFont}
                    onChange={e => setBodyFont(e.target.value)}
                    className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg w-full dark:bg-gray-900 dark:text-white"
                  >
                    <option value="font-sans">Sans</option>
                    <option value="font-serif">Serif</option>
                    <option value="font-mono">Mono</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-gray-700 dark:text-gray-200 mb-1">Watermark Color</label>
                  <input
                    type="color"
                    value={watermarkColor}
                    onChange={e => setWatermarkColor(e.target.value)}
                    className="w-full h-10 p-0 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              </div>
            </div>
 
            {/* Preview Header <SignaturePad/> */}
            <div className="mt-6 p-4 rounded-lg" style={headerStyle}>
              <h3 className={`${headerFont} text-lg font-semibold text-gray-800 dark:text-white`}>{store?.shop_name}</h3>
              <p className={`${headerFont} text-sm text-gray-600 dark:text-gray-300`}>{store?.business_address}</p>
              <p className={`${headerFont} text-sm text-gray-600 dark:text-gray-300`}>Phone: {store?.phone_number}</p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
              <button onClick={saveReceipt} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1">
                <FaDownload /> Save & Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt */}
      {editing && selectedSaleGroup && (
        <div ref={printRef} className="printable-area relative bg-white p-6 mt-6 shadow-lg rounded-lg overflow-x-auto">
         {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={watermarkStyle}>
            <span className={`${bodyFont}`} style={{ opacity: 0.1 }}>{store?.shop_name}</span>
          </div>

          {/* Header */}
          <div className={`p-4 rounded-t ${headerFont}`} style={headerStyle}>
            <h1 className="text-2xl font-bold">{store?.shop_name}</h1>
            <p className="text-sm">{store?.business_address}</p>
            <p className="text-sm">Phone: {store?.phone_number}</p>
          </div>

          {/* Receipt Table */}
          <table className={`w-full table-fixed border-collapse mb-4 ${bodyFont}`}>
            <thead>
              <tr>
                <th className="border px-2 py-1 text-left">Product</th>
                <th className="border px-2 py-1 text-left">Device ID</th>
                <th className="border px-2 py-1 text-left">Quantity</th>
                <th className="border px-2 py-1 text-left">Unit Price</th>
                <th className="border px-2 py-1 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              {selectedSaleGroup.dynamic_sales?.map(sale => (
                <tr key={sale.id}>
                  <td className="border px-2 py-1">{sale.dynamic_product.name}</td>
                  <td className="border px-2 py-1">{sale.device_id || '-'}</td>
                  <td className="border px-2 py-1">{sale.quantity}</td>
                  <td className="border px-2 py-1">₦{(sale.amount / sale.quantity).toFixed(2)}</td>
                  <td className="border px-2 py-1">₦{sale.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" className="border px-2 py-1 text-right font-bold">Total:</td>
                <td className="border px-2 py-1 font-bold">₦{selectedSaleGroup.total_amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Additional Details */}
          <div className="mt-4 space-y-2">
            <p><strong>Receipt ID:</strong> {editing.receipt_id}</p>
            <p><strong>Date:</strong> {new Date(selectedSaleGroup.created_at).toLocaleString()}</p>
            <p><strong>Payment Method:</strong> {selectedSaleGroup.payment_method}</p>
            <p><strong>Customer Name:</strong> {editing.customer_name || '-'}</p>
            <p><strong>Address:</strong> {editing.customer_address || '-'}</p>
            <p><strong>Phone:</strong> {editing.phone_number || '-'}</p>
            <p><strong>Warranty:</strong> {editing.warranty || '-'}</p>
          </div>

          {/* Signatures */}
          
          <div className="grid grid-cols-2 gap-8 p-4 mt-4">
            <div className="border-t text-center pt-2">Manager Signature</div>
            <div className="border-t text-center pt-2">Customer Signature</div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-4 print:hidden">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 print-receipt"
            >
              <FaPrint /> Print
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Tooltip */}
      {showOnboarding && onboardingStep < onboardingSteps.length && (
        <motion.div
          className="fixed z-50 bg-indigo-600 dark:bg-gray-900 border rounded-lg shadow-lg p-4 max-w-xs"
          style={getTooltipPosition(onboardingSteps[onboardingStep].target)}
          variants={tooltipVariants}
          initial="hidden"
          animate="visible"
        >
          <p className="text-sm text-gray-200 dark:text-gray-300 mb-2">
            {onboardingSteps[onboardingStep].content}
          </p>
          <div className="flex justify-between items-center">
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
    </>
  );
}