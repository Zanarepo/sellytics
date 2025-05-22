import React, { useState, useEffect } from 'react';
import { supabase } from "../../supabaseClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SalesSummary() {
  const ownerId = Number(localStorage.getItem('owner_id'));
  const [stores, setStores] = useState([]);
  const [salesRecords, setSalesRecords] = useState([]);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0] // Default to today for daily focus
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [showCharts, setShowCharts] = useState(false);
  const [period, setPeriod] = useState('daily'); // Default to daily
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stores and sales data
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

      // Fetch sales data
      const storeIds = storeData.map(store => store.id);
      let query = supabase
        .from('dynamic_sales')
        .select('store_id, amount, sold_at')
        .in('store_id', storeIds);

      if (period === 'daily') {
        // Only fetch sales for the specific startDate
        query = query
          .gte('sold_at', startDate)
          .lt('sold_at', `${startDate}T23:59:59`);
      } else {
        // Use range for other periods
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayStr = nextDay.toISOString().split('T')[0];
        query = query
          .gte('sold_at', startDate)
          .lt('sold_at', nextDayStr);
      }

      const { data: salesData, error: salesErr } = await query;
      if (salesErr) {
        setError(salesErr.message);
        toast.error('Error fetching sales: ' + salesErr.message);
        setLoading(false);
        return;
      }
      setSalesRecords(salesData);
      setLoading(false);
    })();
  }, [ownerId, startDate, endDate, period]);

  // Group sales by period
  const groupSalesByPeriod = (records, period) => {
    const grouped = {};
    stores.forEach(store => grouped[store.shop_name] = { total: 0, periods: {} });

    records.forEach(sale => {
      const store = stores.find(s => s.id === sale.store_id);
      if (!store) return;
      const storeName = store.shop_name;
      const date = new Date(sale.sold_at);
      let periodKey;

      if (period === 'daily') periodKey = date.toISOString().split('T')[0];
      else if (period === 'weekly') periodKey = `${date.getFullYear()}-W${Math.ceil((date.getDate()) / 7)}`;
      else if (period === 'monthly') periodKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      else periodKey = 'total';

      if (periodKey !== 'total') {
        grouped[storeName].periods[periodKey] = (grouped[storeName].periods[periodKey] || 0) + sale.amount;
      }
      grouped[storeName].total += sale.amount;
    });

    return grouped;
  };

  const salesByPeriod = groupSalesByPeriod(salesRecords, period);
  const summaryData = Object.entries(salesByPeriod).map(([storeName, data]) => ({
    storeName,
    totalSales: data.total,
    periods: data.periods
  }));

  // Find best store
  const bestStore = summaryData.reduce((best, store) => {
    if (!best || store.totalSales > best.totalSales) return store;
    return best;
  }, null);

  // Chart data
  const chartData = period === 'total' || period === 'daily'
    ? summaryData.map(s => ({ name: s.storeName, Sales: s.totalSales }))
    : Object.keys(summaryData[0]?.periods || {}).map(periodKey => {
        const data = { name: periodKey };
        summaryData.forEach(s => {
          data[s.storeName] = s.periods[periodKey] || 0;
        });
        return data;
      });

  // Comparison table data
  const comparisonData = summaryData.map(store => {
    const periods = Object.entries(store.periods).map(([periodKey, amount]) => ({
      period: periodKey,
      amount: amount || 0
    }));
    return { storeName: store.storeName, totalSales: store.totalSales, periods };
  });

  // Pagination
  const paginatedSales = salesRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(salesRecords.length / itemsPerPage);

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;
  if (stores.length === 0) return <div className="text-center p-6">No stores found. Add a store to start tracking sales.</div>;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl sm:text-3xl font-bold text-indigo-800 mb-6 dark:bg-gray-900 dark:text-white">Sales Summary</h1>

      {/* Date Range and Period Selection */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
            title={period === 'daily' ? "Choose the day to see sales for that day only" : "Choose the start date for sales data"}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
            title="Choose the end date for sales data (ignored for daily view)"
            disabled={period === 'daily'} // Disable endDate for daily to avoid confusion
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">View By</label>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
            title="Select how to group sales (daily shows one day, others show a range)"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="total">Total Sales</option>
          </select>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white p-4 rounded-md shadow-md mb-6 dark:bg-gray-900 dark:text-white">
        {/* Summary Table<h2 className="text-xl font-semibold mb-4">Store Sales Summary</h2> */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead >
              <tr className="bg-gray-100 dark:bg-gray-900  dark:text-white">
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-600">Store Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-600">Total Sales (₦)</th>
                {period !== 'total' && <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-600">{period.charAt(0).toUpperCase() + period.slice(1)} Breakdown</th>}
              </tr>
            </thead>
            <tbody>
              {summaryData.map((store, index) => (
                <tr key={index} className="">
                  <td className="p-3 border-b">{store.storeName} {store.storeName === bestStore?.storeName && <span className="text-green-500 font-bold">★ Best</span>}</td>
                  <td className="p-3 border-b">₦{store.totalSales.toFixed(2)}</td>
                  {period !== 'total' && (
                    <td className="p-3 border-b">
                      {Object.entries(store.periods).map(([periodKey, amount]) => (
                        period === 'daily' && periodKey !== startDate ? null : (
                          <div key={periodKey}>{periodKey}: ₦{amount.toFixed(2)}</div>
                        )
                      ))}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bestStore && (
          <p className="mt-4 text-sm text-gray-600 dark:bg-gray-900 dark:text-white">
            Best Performing Store: <span className="font-bold">{bestStore.storeName}</span> with ₦{bestStore.totalSales.toFixed(2)} in sales.
          </p>
        )}
      </div>

      {/* Chart Toggle Button */}
      <button
        onClick={() => setShowCharts(!showCharts)}
        className="mb-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
        title={showCharts ? "Hide sales charts" : "Show sales charts for a visual view"}
      >
        {showCharts ? 'Hide Charts' : 'View Charts'}
      </button>

      {/* Charts */}
      {showCharts && (
        <div className="bg-white p-4 rounded-md shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Sales Chart</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `₦${value.toFixed(2)}`} />
              {period === 'total' || period === 'daily' ? (
                <Bar dataKey="Sales" fill="#8884d8" />
              ) : (
                stores.map((store, idx) => (
                  <Bar key={store.id} dataKey={store.shop_name} fill={`#${(idx * 1234567 % 16777215).toString(16).padStart(6, '0')}`} />
                ))
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white p-4 rounded-md shadow-md mb-6 dark:bg-gray-900 dark:text-white">
        <h2 className="text-xl font-semibold mb-4">Store Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-900 dark:text-white">
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:bg-gray-900 dark:text-indigo-600">Store Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:bg-gray-900 dark:text-indigo-600">Total Sales (₦)</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:bg-gray-900 dark:text-indigo-600">Change from Previous {period !== 'total' ? period.charAt(0).toUpperCase() + period.slice(1) : 'Period'}</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((store, index) => {
                const previousPeriodSales = calculatePreviousPeriodSales(store.storeName, period);
                const change = store.totalSales - previousPeriodSales;
                const percentageChange = previousPeriodSales ? ((change / previousPeriodSales) * 100).toFixed(2) : 0;
                return (
                  <tr key={index} className="">
                    <td className="p-3 border-b">{store.storeName}</td>
                    <td className="p-3 border-b">₦{store.totalSales.toFixed(2)}</td>
                    <td className="p-3 border-b">
                      {change >= 0 ? (
                        <span className="text-green-500">+₦{change.toFixed(2)} (+{percentageChange}%)</span>
                      ) : (
                        <span className="text-red-500">-₦{Math.abs(change).toFixed(2)} ({percentageChange}%)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Details with Pagination */}
      <div className="bg-white p-4 rounded-md shadow-md dark:bg-gray-900 dark:text-white">
        <h2 className="text-xl font-semibold mb-4 dark:bg-gray-900 dark:text-white">Detailed Sales Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-900 dark:text-white">
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:bg-gray-900 dark:text-indigo-600">Store</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:bg-gray-900 dark:text-indigo-600">Date</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:bg-gray-900 dark:text-indigo-600">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.map((sale, index) => (
                <tr key={index} className="">
                  <td className="p-3 border-b">{stores.find(s => s.id === sale.store_id)?.shop_name || 'Unknown'}</td>
                  <td className="p-3 border-b">{new Date(sale.sold_at).toLocaleDateString()}</td>
                  <td className="p-3 border-b">₦{sale.amount.toFixed(2)}</td>
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300"
              title="Go to previous page"
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-300"
              title="Go to next page"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );

  // Helper to calculate previous period sales for comparison
  function calculatePreviousPeriodSales(storeName, period) {
    const store = stores.find(s => s.shop_name === storeName);
    if (!store) return 0;

    const previousRecords = salesRecords.filter(sale => sale.store_id === store.id);
    const end = new Date(startDate);
    const start = new Date(startDate);

    if (period === 'daily') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (period === 'weekly') {
      start.setDate(start.getDate() - 7);
      end.setDate(end.getDate() - 7);
    } else if (period === 'monthly') {
      start.setMonth(start.getMonth() - 1);
      end.setMonth(end.getMonth() - 1);
    } else {
      start.setMonth(start.getMonth() - 1);
      end.setMonth(end.getMonth() - 1);
    }

    return previousRecords
      .filter(sale => {
        const saleDate = new Date(sale.sold_at);
        return saleDate >= start && saleDate < end;
      })
      .reduce((sum, sale) => sum + sale.amount, 0);
  }
}