import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const REMINDER_TIMES = [
  { label: '1 hour', value: 1 },
  { label: '4 hours', value: 4 },
  { label: 'Tomorrow', value: 24 }
];

// Alert component for low stock in the 'inventory' table, referencing 'products'
export default function LowInventoryAlert() {
  const [lowItems, setLowItems] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);

  // Retrieve storeId from localStorage
  const storedId = localStorage.getItem('store_id');
  const storeId = storedId ? parseInt(storedId, 10) : null;

  useEffect(() => {
    if (!storeId) return;

    const checkInventory = async () => {
      // Fetch low-stock items for this store from 'inventory'
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('store_id', storeId)
        .lte('available_qty', 5);

      if (error) {
        console.error('Inventory fetch error:', error);
        return;
      }
      if (!inventory || inventory.length === 0) {
        setLowItems([]);
        setShowAlert(false);
        return;
      }

      // Fetch product names from 'products'
      const productIds = inventory.map(item => item.product_id);
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (prodErr) {
        console.error('Products fetch error:', prodErr);
      }

      // Combine inventory with product names
      const lowStockWithNames = inventory.map(item => {
        const product = products?.find(p => p.id === item.product_id);
        return {
          ...item,
          product_name: product ? product.name : 'Unknown Product'
        };
      });

      setLowItems(lowStockWithNames);

      // Snooze logic
      const lastSnooze = localStorage.getItem(`low_stock_snooze_until_${storeId}`);
      const now = new Date();
      const snoozedUntil = lastSnooze ? new Date(lastSnooze) : null;
      if (!snoozedUntil || snoozedUntil < now) {
        setShowAlert(lowStockWithNames.length > 0);
      }
    };

    checkInventory();
    // Optional: re-check every 5 minutes
    const interval = setInterval(checkInventory, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [storeId]);

  const handleSnooze = () => {
    if (reminderTime) {
      const nextReminder = new Date();
      nextReminder.setHours(nextReminder.getHours() + reminderTime);
      localStorage.setItem(
        `low_stock_snooze_until_${storeId}`,
        nextReminder.toISOString()
      );
    }
    setShowAlert(false);
  };

  const handleCancel = () => {
    setShowAlert(false);
  };

  // Don't render if no storeId or alert is hidden
  if (!storeId || !showAlert) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border p-4 shadow-lg rounded-md w-80 z-50">
      <h2 className="text-lg font-semibold mb-2 text-red-500">Low Stock Alert</h2>

      {lowItems.length > 5 ? (
        <p>Several items are low on stock. Please restock your inventory.</p>
      ) : (
        <ul className="list-disc pl-5 mb-2">
          {lowItems.map((item, idx) => (
            <li key={idx}>{item.product_name} (Qty: {item.available_qty})</li>
          ))}
        </ul>
      )}

      <div className="mb-2">
        <label className="text-sm">Remind me in:</label>
        <select
          className="w-full p-2 border rounded mt-1"
          onChange={e => setReminderTime(Number(e.target.value))}
          value={reminderTime || ''}
        >
          <option value="">Select time</option>
          {REMINDER_TIMES.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <button className="text-sm px-3 py-1 border rounded" onClick={handleCancel}>
          Cancel
        </button>
        <button className="text-sm px-3 py-1 bg-blue-500 text-white rounded" onClick={handleSnooze}>
          Snooze
        </button>
      </div>
    </div>
  );
}
