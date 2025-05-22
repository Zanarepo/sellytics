import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

export default function EmployeesTable() {
  const [employees, setEmployees] = useState([]);
  const [viewDetails, setViewDetails] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [error, setError] = useState(null);

  const storeId = localStorage.getItem('store_id') && parseInt(localStorage.getItem('store_id'), 10);

  // Format role to user-friendly string
  const formatRole = (role) => {
    return role
      ? role
          .toLowerCase()
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : 'N/A';
  };

  // Memoize loadEmployees to stabilize it for useEffect
  const loadEmployees = useCallback(
    async (order) => {
      try {
        if (!storeId) {
          setError('No store ID found in local storage.');
          setEmployees([]);
          return;
        }

        // Fetch the owner_user_id for the given store_id
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('owner_user_id')
          .eq('id', storeId)
          .single();
        if (storeError || !storeData) {
          throw new Error(`Error fetching store owner: ${storeError?.message || 'Store not found'}`);
        }

        const ownerUserId = storeData.owner_user_id;

        // Fetch all stores for the owner
        const { data: stores, error: storesError } = await supabase
          .from('stores')
          .select('id, shop_name')
          .eq('owner_user_id', ownerUserId);
        if (storesError) {
          throw new Error(`Error fetching stores: ${storesError.message}`);
        }
        if (!stores || stores.length === 0) {
          setEmployees([]);
          setError('No stores found for this owner.');
          return;
        }

        const storeIds = stores.map(store => store.id);

        // Fetch employees for all owned stores, joining with stores for shop_name
        const { data, error } = await supabase
          .from('store_users')
          .select('*, stores!inner(shop_name)')
          .in('store_id', storeIds)
          .order('id', { ascending: order === 'asc' });
        if (error) {
          throw new Error(`Error fetching employees: ${error.message}`);
        }

        // Map employees to include shop_name from stores
        const employeesWithShop = (data ?? []).map(employee => ({
          ...employee,
          shop_name: employee.stores?.shop_name || 'N/A',
        }));

        setEmployees(employeesWithShop);
        setError(null);
      } catch (err) {
        console.error(err.message);
        setEmployees([]);
        setError(err.message);
      }
    },
    [storeId]
  );

  useEffect(() => {
    if (!storeId) {
      setError('No store ID found in local storage.');
      return;
    }
    loadEmployees(sortOrder);
  }, [storeId, sortOrder, loadEmployees]);

  const handleDelete = async id => {
    try {
      const { error } = await supabase.from('store_users').delete().eq('id', id);
      if (error) {
        console.error('Error deleting employee:', error);
        return;
      }
      await loadEmployees(sortOrder);
    } catch (err) {
      console.error('Error deleting employee:', err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-0 ">
      <h2 className="text-2xl font-bold text-center mb-4">Employees</h2>

      {error && (
        <div className="text-center text-red-500 mb-4">{error}</div>
      )}

      <div className="flex justify-end mb-4 space-x-2">
        <label className="self-center text-sm font-medium">Sort by:</label>
        <select
          className="border border-gray-300 rounded px-2 py-1"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-gray-200 ">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-900 dark:text-white">
              {['ID', 'Name', 'Email', 'Role', 'Store Name', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.id} className="hover:bg-gray-50 ">
                <td className="px-4 py-2 border-b border-gray-200 text-sm">{e.id}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm">{e.name || 'N/A'}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm">{e.email || 'N/A'}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm">{formatRole(e.role)}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm">{e.shop_name}</td>
                <td className="px-4 py-2 border-b border-gray-200 text-sm space-x-2">
                  <button
                    className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                    onClick={() => setViewDetails(e)}
                  >
                    View
                  </button>
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    onClick={() => handleDelete(e.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                  No employees available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Details for Employee #{viewDetails.id}</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Name</span>
                <span className="text-gray-900">{viewDetails.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Email</span>
                <span className="text-gray-900">{viewDetails.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Role</span>
                <span className="text-gray-900">{formatRole(viewDetails.role)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Store Name</span>
                <span className="text-gray-900">{viewDetails.shop_name}</span>
              </div>
            </div>
            <button
              className="mt-2 w-full px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              onClick={() => setViewDetails(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}