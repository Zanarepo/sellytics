import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaPrint } from 'react-icons/fa';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, status');
    if (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } else {
      setUsers(data);
    }
    setLoading(false);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user.');
    } else {
      // Remove the deleted user from local state
      setUsers(users.filter((user) => user.id !== userId));
    }
  };

  // Handle status change via dropdown.
  const handleStatusChange = async (userId, newStatus) => {
    if (
      !window.confirm(`Are you sure you want to set this user as ${newStatus}?`)
    )
      return;

    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status.');
    } else {
      // Update the user's status locally
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-yellow-800 dark:text-white">
          Users
        </h2>
        <button
          onClick={handlePrint}
          className="flex items-center px-3 py-2 bg-yellow-800 text-white rounded hover:bg-yellow-600"
        >
          <FaPrint className="mr-2" /> Print
        </button>
      </div>
      {loading ? (
        <p className="text-gray-800 dark:text-white">Loading users...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-yellow-800 dark:border-yellow-800">
            <thead className="bg-yellow-800 dark:bg-yellow-800">
              <tr>
                <th className="py-2 px-4 border-r border-gray-300 dark:border-yellow-800 text-left text-white dark:text-gray-200">
                  Full Name
                </th>
                <th className="py-2 px-4 border-r border-gray-300 dark:border-gray-700 text-left text-white  dark:text-gray-200">
                  Email
                </th>
                <th className="py-2 px-4 border-r border-gray-300 dark:border-gray-700 text-left text-white  dark:text-gray-200">
                  Role
                </th>
                <th className="py-2 px-4 border-r border-gray-300 dark:border-gray-700 text-left text-white  dark:text-gray-200">
                  Status
                </th>
                <th className="py-2 px-4 text-left text-white  dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    {user.full_name}
                  </td>
                  <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    {user.email}
                  </td>
                  <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    {user.role}
                  </td>
                  <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.status === 'active'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                      {/* Dropdown to select action: Activate or Deactivate */}
                      <select
                        defaultValue="inactive"
                        onChange={(e) =>
                          handleStatusChange(user.id, e.target.value)
                        }
                        className="p-1 border rounded"
                      >
                        <option value="active">Activate</option>
                        <option value="inactive">Deactivate</option>
                      </select>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="flex items-center px-3 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                      >
                        <FaTrash className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="py-4 text-center text-gray-800 dark:text-white"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
