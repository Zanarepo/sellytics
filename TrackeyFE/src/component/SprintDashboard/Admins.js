import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaTrash, FaUserSlash, FaUserCheck, FaPrint } from 'react-icons/fa';

const AdminsTable = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch admins on component mount
  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sprintify_admin')
      .select('id, full_name, email, role, status');
    if (error) {
      console.error('Error fetching admins:', error);
      setError(error.message);
    } else {
      setAdmins(data);
    }
    setLoading(false);
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;

    const { error } = await supabase
      .from('sprintify_admin')
      .delete()
      .eq('id', adminId);

    if (error) {
      console.error('Error deleting admin:', error);
      alert('Error deleting admin.');
    } else {
      // Remove the deleted admin from local state
      setAdmins(admins.filter((admin) => admin.id !== adminId));
    }
  };

  // Toggle suspension: if active, set to inactive; if inactive, set to active.
  const handleToggleSuspension = async (adminId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (
      !window.confirm(
        `Are you sure you want to ${
          currentStatus === 'active' ? 'suspend' : 'activate'
        } this admin?`
      )
    )
      return;

    const { error } = await supabase
      .from('sprintify_admin')
      .update({ status: newStatus })
      .eq('id', adminId);

    if (error) {
      console.error('Error updating suspension status:', error);
      alert('Error updating suspension status.');
    } else {
      // Update the admin's status locally
      setAdmins(
        admins.map((admin) =>
          admin.id === adminId ? { ...admin, status: newStatus } : admin
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Admins</h2>
        <button
          onClick={handlePrint}
          className="flex items-center px-3 py-2 bg-yellow-800 text-white rounded hover:bg-yellow-600"
        >
          <FaPrint className="mr-2" /> Print
        </button>
      </div>
      {loading ? (
        <p className="text-gray-800 dark:text-white">Loading admins...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-full border border-yellow-800 dark:border-yellow-700 ">
            <thead className="bg-yellow-800 dark:bg-yellow-800">
              <tr>
                <th className="py-2 px-4 border-r border-gray-300 dark:border-gray-700 text-left text-white dark:text-gray-200">
                  Full Name
                </th>
                <th className="py-2 px-4 border-r border-gray-300 dark:border-gray-700 text-left text-white  dark:text-gray-200">
                  Email
                </th>
                <th className="py-2 px-4 border-r border-gray-300 dark:border-gray-700 text-left text-white  dark:text-gray-200">
                  Role
                </th>
                <th className="py-2 px-4 border-r border-gray-300 dark:border-gray-700 text-left text-white dark:text-gray-200">
                  Status
                </th>
                <th className="py-2 px-4 text-left text-white dark:text-gray-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    {admin.full_name}
                  </td>
                  <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    {admin.email}
                  </td>
                  <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                    {admin.role}
                  </td>
                  <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        admin.status === 'active'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {admin.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleSuspension(admin.id, admin.status)}
                        className={`flex items-center px-3 py-1 text-sm rounded ${
                          admin.status === 'active'
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {admin.status === 'active' ? (
                          <>
                            <FaUserSlash className="mr-1" />
                            Suspend
                          </>
                        ) : (
                          <>
                            <FaUserCheck className="mr-1" />
                            Activate
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="flex items-center px-3 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600"
                      >
                        <FaTrash className="mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-800 dark:text-white">
                    No admins found.
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

export default AdminsTable;
