









import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "../../supabaseClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function InventorySummary() {
  const ownerId = Number(localStorage.getItem('owner_id'));
  const [stores, setStores] = useState([]);
  const [inventoryRecords, setInventoryRecords] = useState([]);
  const [selectedStore, setSelectedStore] = useState('all');
  const [productFilter, setProductFilter] = useState('');
  const [availableFilter, setAvailableFilter] = useState('');
  const [soldFilter, setSoldFilter] = useState('');
  const [showCharts, setShowCharts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stores and inventory data
  useEffect(() => {
    if (!ownerId) {
      setError('Please log in again.');
      toast.error('No owner ID found. Please log in.');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      // Fetch stores
      const { data: storeData, error: storeErr } = await supabase
        .from('stores')
        .select('id, shop_name')
        .eq('owner_user_id', ownerId);
      if (storeErr) {
        setError(storeErr.message);
        toast.error('Error fetching stores: ' + storeErr.message);
        setLoading(false);
        return;
      }
      setStores(storeData);

      if (storeData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch inventory data
      let query = supabase
        .from('dynamic_inventory')
        .select(`
          store_id,
          available_qty,
          quantity_sold,
          dynamic_product (name)
        `)
        .in('store_id', storeData.map(store => store.id));

      if (selectedStore !== 'all') {
        query = query.eq('store_id', selectedStore);
      }

      const { data: inventoryData, error: inventoryErr } = await query;
      if (inventoryErr) {
        setError(inventoryErr.message);
        toast.error('Error fetching inventory: ' + inventoryErr.message);
        setLoading(false);
        return;
      }
      setInventoryRecords(inventoryData);
      setLoading(false);
    })();
  }, [ownerId, selectedStore]);

  // Filter inventory records
  const filteredRecords = useMemo(() => {
    return inventoryRecords.filter(record => {
      const productName = record.dynamic_product?.name || 'Unknown';
      const available = record.available_qty;
      const sold = record.quantity_sold;

      const matchesProduct = productFilter ? productName.toLowerCase().includes(productFilter.toLowerCase()) : true;
      const matchesAvailable = availableFilter ? available >= Number(availableFilter) : true;
      const matchesSold = soldFilter ? sold >= Number(soldFilter) : true;

      return matchesProduct && matchesAvailable && matchesSold;
    });
  }, [inventoryRecords, productFilter, availableFilter, soldFilter]);

  // Group inventory by store
  const groupInventoryByStore = (records) => {
    const grouped = {};
    stores.forEach(store => {
      grouped[store.shop_name] = { 
        totalAvailable: 0, 
        totalSold: 0
      };
    });

    records.forEach(record => {
      const store = stores.find(s => s.id === record.store_id);
      if (!store) return;
      const storeName = store.shop_name;

      grouped[storeName].totalAvailable += record.available_qty;
      grouped[storeName].totalSold += record.quantity_sold;
    });

    return grouped;
  };

  const inventoryByStore = groupInventoryByStore(filteredRecords);
  const summaryData = Object.entries(inventoryByStore).map(([storeName, data]) => ({
    storeName,
    totalAvailable: data.totalAvailable,
    totalSold: data.totalSold
  }));

  // Find store with highest stock
  const highestStockStore = summaryData.reduce((highest, store) => {
    if (!highest || store.totalAvailable > highest.totalAvailable) return store;
    return highest;
  }, null);

  // Chart data for available and sold quantities
  const chartData = summaryData.map(s => ({
    name: s.storeName,
    Available: s.totalAvailable,
    Sold: s.totalSold
  }));

  // Pagination
  const paginatedInventory = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  if (loading) return <div className="text-center p-6 text-gray-500 dark:text-gray-400">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;
  if (stores.length === 0) return <div className="text-center p-6 text-gray-500 dark:text-gray-400">No stores found. Add a store to start tracking inventory.</div>;

  return (
    <div className="p-0 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-indigo-700 mb-8 dark:text-indigo-300">Inventory Dashboard</h1>

      {/* Filters and Store Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 ">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 dark:bg-gray-900 text-white">Select Store</label>
          <select
            value={selectedStore}
            onChange={e => {
              setSelectedStore(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          >
            <option value="all">All Stores</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.shop_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Product Name</label>
          <input
            type="text"
            value={productFilter}
            onChange={e => {
              setProductFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter by product name"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Min Available</label>
          <input
            type="number"
            value={availableFilter}
            onChange={e => {
              setAvailableFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Min available qty"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Min Sold</label>
          <input
            type="number"
            value={soldFilter}
            onChange={e => {
              setSoldFilter(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Min sold qty"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          />
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-0 mb-8 dark:bg-gray-900 text-white">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Store Inventory Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-indigo-50 dark:bg-indigo-900">
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Store Name</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Total Available</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Total Sold</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((store, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">
                    {store.storeName}
                    {store.storeName === highestStockStore?.storeName && (
                      <span className="ml-2 text-green-500 font-bold">★ Highest Stock</span>
                    )}
                  </td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">{store.totalAvailable}</td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">{store.totalSold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {highestStockStore && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Highest Stock Store: <span className="font-bold">{highestStockStore.storeName}</span> with {highestStockStore.totalAvailable} items available.
          </p>
        )}
      </div>

      {/* Chart Section */}
      <div className="mb-8">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          {showCharts ? 'Hide Charts' : 'View Charts'}
        </button>
        {showCharts && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-0 mt-4 dark:bg-gray-900 text-white">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Inventory Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value} units`} />
                <Bar dataKey="Available" fill="#8884d8" />
                <Bar dataKey="Sold" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 dark:bg-gray-900 text-white" >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Detailed Inventory Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-indigo-50 dark:bg-indigo-900">
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Store</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Product</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Available Quantity</th>
                <th className="p-3 text-left text-sm font-semibold text-indigo-700 dark:text-indigo-300">Quantity Sold</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInventory.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">
                    {stores.find(s => s.id === record.store_id)?.shop_name || 'Unknown'}
                  </td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">
                    {record.dynamic_product?.name || 'Unknown'}
                  </td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">{record.available_qty}</td>
                  <td className="p-3 border-b text-gray-800 dark:text-gray-200">{record.quantity_sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
            >
              Previous
            </button>
            <span className="text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}