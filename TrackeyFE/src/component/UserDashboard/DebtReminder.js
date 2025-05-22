import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { FaBell, FaTimes, FaClock, FaTrash } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function DebtReminder() {
  const storeId = Number(localStorage.getItem('store_id'));
  const [reminders, setReminders] = useState([]);
  const [toastIds, setToastIds] = useState({}); // Store Toast IDs by reminder ID
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Update next_reminder timestamp
  const updateNextReminder = useCallback(async (reminder) => {
    try {
      let nextReminder = new Date(reminder.next_reminder);

      if (reminder.reminder_type === 'one-time') {
        await supabase
          .from('debt_reminders')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', reminder.id);
        return;
      }

      if (reminder.reminder_type === 'daily') {
        nextReminder.setDate(nextReminder.getDate() + 1);
      } else if (reminder.reminder_type === 'weekly') {
        nextReminder.setDate(nextReminder.getDate() + 7);
      }

      const [hours, minutes] = reminder.reminder_time.split(':');
      nextReminder.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from('debt_reminders')
        .update({ next_reminder: nextReminder.toISOString(), updated_at: new Date().toISOString() })
        .eq('id', reminder.id);

      if (error) throw error;
    } catch (err) {
      console.error('Update Reminder Error:', err);
      toast.error('Failed to update reminder: ' + err.message);
    }
  }, []);

  // Fetch active reminders with debt details
  const fetchReminders = useCallback(async () => {
    if (!storeId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('debt_reminders')
        .select(`
          id,
          debt_id,
          customer_id,
          reminder_type,
          reminder_time,
          next_reminder,
          snoozed_until,
          is_active,
          debts (
            customer_name,
            product_name,
            owed,
            deposited
          )
        `)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .lte('next_reminder', new Date().toISOString())
        .is('snoozed_until', null)
        .order('next_reminder', { ascending: true });

      if (error) throw error;

      const remindersWithDebt = data.map(reminder => ({
        ...reminder,
        debt: reminder.debts || {}
      }));

      setReminders(remindersWithDebt);

      // Show Toast for due reminders
      remindersWithDebt.forEach(r => {
        if (new Date(r.next_reminder) <= new Date() && !toastIds[r.id]) {
          const toastId = toast.warn(
            <div>
              <p><strong>Debtor:</strong> {r.debt.customer_name || 'Unknown'}</p>
              <p><strong>Outstanding:</strong> ₦{((r.debt.owed - r.debt.deposited) || 0).toFixed(2)}</p>
              <p><strong>Product:</strong> {r.debt.product_name || 'Unknown'}</p>
              <p><strong>Due:</strong> {new Date(r.next_reminder).toLocaleString()}</p>
            </div>,
            {
              autoClose: 5000,
              onClose: () => {
                setToastIds(prev => {
                  const newToastIds = { ...prev };
                  delete newToastIds[r.id];
                  return newToastIds;
                });
              }
            }
          );
          setToastIds(prev => ({ ...prev, [r.id]: toastId }));
          updateNextReminder(r);
        }
      });
    } catch (err) {
      console.error('Fetch Reminders Error:', err);
      toast.error('Failed to fetch reminders: ' + err.message);
    }
    setIsLoading(false);
  }, [storeId, toastIds, updateNextReminder]);

  // Snooze reminder
  const snoozeReminder = async (reminderId, snoozeDuration) => {
    try {
      const snoozedUntil = new Date();
      if (snoozeDuration === '1hour') {
        snoozedUntil.setHours(snoozedUntil.getHours() + 1);
      } else if (snoozeDuration === '1day') {
        snoozedUntil.setDate(snoozedUntil.getDate() + 1);
      }

      const { error } = await supabase
        .from('debt_reminders')
        .update({ snoozed_until: snoozedUntil.toISOString(), updated_at: new Date().toISOString() })
        .eq('id', reminderId);

      if (error) throw error;

      // Dismiss associated Toast
      setToastIds(prev => {
        if (prev[reminderId]) {
          toast.dismiss(prev[reminderId]);
          const newToastIds = { ...prev };
          delete newToastIds[reminderId];
          return newToastIds;
        }
        return prev;
      });

      toast.success('Reminder snoozed.');
      fetchReminders();
    } catch (err) {
      console.error('Snooze Reminder Error:', err);
      toast.error('Failed to snooze reminder: ' + err.message);
    }
  };

  // Cancel reminder
  const cancelReminder = async (reminderId) => {
    try {
      // Dismiss associated Toast
      setToastIds(prev => {
        if (prev[reminderId]) {
          toast.dismiss(prev[reminderId]);
          const newToastIds = { ...prev };
          delete newToastIds[reminderId];
          return newToastIds;
        }
        return prev;
      });

      const { error } = await supabase
        .from('debt_reminders')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', reminderId);

      if (error) throw error;

      toast.success('Reminder cancelled.');
      fetchReminders();
    } catch (err) {
      console.error('Cancel Reminder Error:', err);
      toast.error('Failed to cancel reminder: ' + err.message);
    }
  };

  // Poll for reminders every 10 seconds
  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 10 * 1000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  if (!storeId) {
    return (
      <div className="p-4 text-center text-red-500">
        Store ID is missing. Please select a store.
      </div>
    );
  }

  return (
    <div className="relative dark:bg-gray-900 dark:text-white">
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Notification Icon */}
      <button
        onClick={() => setShowModal(true)}
        className="relative p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition"
        title="View Reminders"
      >
        <FaBell />
        {reminders.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {reminders.length}
          </span>
        )}
      </button>

      {/* Reminders Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 space-y-4 dark:bg-gray-800 dark:text-white">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Debt Reminders</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <FaTimes />
              </button>
            </div>

            {isLoading ? (
              <p>Loading reminders...</p>
            ) : reminders.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">No active reminders.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800 dark:text-indigo-400">
                    <tr>
                      <th className="text-left px-4 py-2">Debtor</th>
                      <th className="text-left px-4 py-2">Product</th>
                      <th className="text-left px-4 py-2">Balance</th>
                      <th className="text-left px-4 py-2">Next Reminder</th>
                      <th className="text-left px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.map(r => (
                      <tr key={r.id} className="border-b dark:border-gray-700">
                        <td className="px-4 py-2">{r.debt.customer_name || 'Unknown'}</td>
                        <td className="px-4 py-2">{r.debt.product_name || 'Unknown'}</td>
                        <td className="px-4 py-2">₦{((r.debt.owed - r.debt.deposited) || 0).toFixed(2)}</td>
                        <td className="px-4 py-2">{new Date(r.next_reminder).toLocaleString()}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => snoozeReminder(r.id, '1hour')}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                            title="Snooze for 1 hour"
                          >
                            <FaClock /> 1h
                          </button>
                          <button
                            onClick={() => snoozeReminder(r.id, '1day')}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                            title="Snooze for 1 day"
                          >
                            <FaClock /> 1d
                          </button>
                          <button
                            onClick={() => cancelReminder(r.id)}
                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                            title="Cancel reminder"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}