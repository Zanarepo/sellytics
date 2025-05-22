import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';

const REMINDER_TIMES = [
  { label: '1 hour', value: 1 },
  { label: '4 hours', value: 4 },
  { label: 'Tomorrow', value: 24 },
];

export default function LowInventoryAlert({ storeId, isVisible, onClose }) {
  const [lowItems, setLowItems] = useState([]);
  const [reminderTime, setReminderTime] = useState(null);

  useEffect(() => {
    if (!storeId || !isVisible) return;

    const checkInventory = async () => {
      const { data: inventory, error } = await supabase
        .from('dynamic_inventory')
        .select('dynamic_product_id, available_qty, dynamic_product(name)')
        .eq('store_id', storeId)
        .lte('available_qty', 5);

      if (error) {
        toast.error(`Failed to fetch low inventory: ${error.message}`);
        return;
      }

      if (!inventory || inventory.length === 0) {
        setLowItems([]);
        return;
      }

      const lowStockItems = inventory.map((item) => ({
        dynamic_product_id: item.dynamic_product_id,
        product_name: item.dynamic_product?.name || 'Unknown Product',
        available_qty: item.available_qty,
      }));

      setLowItems(lowStockItems);
    };

    checkInventory();
    const interval = setInterval(checkInventory, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [storeId, isVisible]);

  const handleSnooze = () => {
    if (!reminderTime) {
      toast.error('Please select a snooze duration.');
      return;
    }
    const nextReminder = new Date();
    nextReminder.setHours(nextReminder.getHours() + reminderTime);
    localStorage.setItem(`low_stock_snooze_until_${storeId}`, nextReminder.toISOString());
    toast.info(`Low stock alert snoozed for ${reminderTime} hour${reminderTime > 1 ? 's' : ''}.`);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!storeId || !isVisible || lowItems.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-red-500 dark:text-red-400">Low Stock Alert</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
            title="Close alert"
          >
            <FaTimes />
          </button>
        </div>
        <div className="p-4">
          {lowItems.length > 5 ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Multiple items are low on stock. Please review and restock your inventory.
            </p>
          ) : (
            <ul className="space-y-2">
              {lowItems.map((item) => (
                <li
                  key={item.dynamic_product_id}
                  className={`flex justify-between text-sm p-2 rounded ${
                    item.available_qty <= 2 ? 'bg-red-100 dark:bg-red-900' : 'bg-orange-100 dark:bg-orange-900'
                  }`}
                >
                  <span>{item.product_name}</span>
                  <span className={item.available_qty <= 2 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}>
                    {item.available_qty} left
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Remind me in:</label>
            <select
              className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onChange={(e) => setReminderTime(Number(e.target.value))}
              value={reminderTime || ''}
            >
              <option value="">Select time</option>
              {REMINDER_TIMES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
            title="Close without snoozing"
          >
            Close
          </button>
          <button
            onClick={handleSnooze}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            title="Snooze alert"
          >
            Snooze
          </button>
        </div>
      </div>
    </div>
  );
}