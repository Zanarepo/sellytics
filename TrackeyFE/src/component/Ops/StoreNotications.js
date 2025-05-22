import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { Eye, Trash2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function NotificationsTable() {
  const [notifications, setNotifications] = useState([]);
  const [viewDetails, setViewDetails] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const ownerId = Number(localStorage.getItem('owner_id'));

  // Format activity type to user-friendly string
  const formatActivityType = (activityType) => {
    return activityType
      .toLowerCase()
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format detail keys for display
  const formatDetailKey = (key) => {
    return key
      .toLowerCase()
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Memoize loadNotifications to stabilize it for useEffect
  const loadNotifications = useCallback(
    async (order) => {
      setLoading(true);
      try {
        if (!ownerId) {
          setError('No owner ID found in local storage.');
          toast.error('No owner ID found. Please log in.');
          setNotifications([]);
          return;
        }

        // Fetch all stores for the owner
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('id, shop_name')
          .eq('owner_user_id', ownerId);
        if (storesError) {
          throw new Error(`Error fetching stores: ${storesError.message}`);
        }
        if (!stores || stores.length === 0) {
          setNotifications([]);
          setError('No stores found for this owner.');
          toast.error('No stores found for this owner.');
          return;
        }

        const storeIds = stores.map(store => store.id);

        // Fetch notifications with pagination
        const { data, error } = await supabase
          .from('notifications')
          .select('*, stores!inner(shop_name)')
          .in('store_id', storeIds)
          .order('timestamp', { ascending: order === 'asc' })
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);
        if (error) {
          throw new Error(`Error fetching notifications: ${error.message}`);
        }

        // Map notifications to include shop_name from stores
        const notificationsWithShop = (data ?? []).map(notification => ({
          ...notification,
          shop_name: notification.stores?.shop_name || 'N/A',
        }));

        setNotifications(notificationsWithShop);
        setError(null);
      } catch (err) {
        console.error(err.message);
        setNotifications([]);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [ownerId, currentPage, pageSize]
  );

  useEffect(() => {
    loadNotifications(sortOrder);
  }, [ownerId, sortOrder, loadNotifications, currentPage, pageSize]);

  const handleDelete = async id => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) {
        throw new Error(`Error deleting notification: ${error.message}`);
      }
      await loadNotifications(sortOrder);
      toast.success('Notification deleted successfully.');
    } catch (err) {
      console.error(err.message);
      toast.error(err.message);
    }
  };

  // Pagination controls
  const totalPages = Math.ceil(notifications.length / pageSize) || 1;
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Notifications</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Sort by:</label>
          <select
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Show:</label>
          <select
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-indigo-600 text-white">
              {['ID', 'Activity', 'Shop Name', 'Product Name', 'Amount', 'Qty', 'Time', 'Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-sm font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : notifications.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No notifications available.
                </td>
              </tr>
            ) : (
              notifications.map(n => {
                const time = n.timestamp ? new Date(n.timestamp).toLocaleString() : 'N/A';
                const productName = n.details?.product_name || 'N/A';
                const amount = n.details?.amount || 'N/A';
                const quantity = n.details?.quantity || 'N/A';
                return (
                  <tr key={n.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{n.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                      {formatActivityType(n.activity_type || 'N/A')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{n.shop_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{productName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{time}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                     <div className="flex items-center space-x-2">
  <button
    className="p-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
    onClick={() => setViewDetails(n)}
    title="View Details"
  >
    <Eye size={16} />
  </button>
  <button
    className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
    onClick={() => handleDelete(n.id)}
    title="Delete"
  >
    <Trash2 size={16} />
  </button>
</div>

                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-700 dark:text-gray-200">
          Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, notifications.length)} of {notifications.length} notifications
        </div>
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="flex space-x-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`px-4 py-2 rounded-lg ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'} transition-colors`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {viewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Details for #{viewDetails.id}</h3>
            <div className="space-y-3 mb-6">
              {(viewDetails.details ?? {}) &&
                Object.entries(viewDetails.details ?? {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm border-b border-gray-200 dark:border-gray-700 pb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{formatDetailKey(k)}</span>
                    <span className="text-gray-900 dark:text-gray-100">{String(v)}</span>
                  </div>
                ))}
              {(!viewDetails.details || Object.keys(viewDetails.details).length === 0) && (
                <div className="text-center text-gray-500 dark:text-gray-400">No details available</div>
              )}
            </div>
            <button
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              onClick={() => setViewDetails(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
}