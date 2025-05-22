import { useState, useEffect } from 'react';
  import { supabase } from '../../supabaseClient';

  export default function Dashboard({ session }) {
    const [sales, setSales] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [preferences, setPreferences] = useState({
      email_address: '',
      frequency: 'daily',
      low_sales_threshold: 1000,
    });
    const [alerts, setAlerts] = useState([]);
    const [newAlert, setNewAlert] = useState({ inventoryId: '', threshold: 5 });
    const [loading, setLoading] = useState(true);
    const [storeId, setStoreId] = useState(null);

    // Get store_id from local storage
    useEffect(() => {
      const id = localStorage.getItem('store_id');
      if (id) {
        setStoreId(parseInt(id));
      } else {
        console.error('No store_id found in local storage');
        setLoading(false);
      }
    }, []);

    // Fetch sales data
    useEffect(() => {
      if (!storeId) return;
      const fetchSales = async () => {
        const { data, error } = await supabase
          .from('dynamic_sales')
          .select('quantity, amount, sold_at')
          .eq('store_id', storeId)
          .gte('sold_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        if (error) {
          console.error(error);
        } else {
          setSales(data);
        }
        setLoading(false);
      };
      fetchSales();
    }, [storeId]);

    // Fetch inventory data
    useEffect(() => {
      if (!storeId) return;
      const fetchInventory = async () => {
        const { data, error } = await supabase
          .from('dynamic_inventory')
          .select('id, dynamic_product_id, quantity, available_qty, quantity_sold')
          .eq('store_id', storeId);
        if (error) {
          console.error(error);
        } else {
          setInventory(data);
        }
      };
      fetchInventory();
    }, [storeId]);

    // Fetch store email and preferences
    useEffect(() => {
      if (!storeId) return;
      const fetchData = async () => {
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('email_address')
          .eq('id', storeId)
          .single();
        if (storeError) {
          console.error(storeError);
          return;
        }

        const { data: prefs, error: prefsError } = await supabase
          .from('store_preferences')
          .select('email_address, frequency, low_sales_threshold')
          .eq('store_id', storeId)
          .single();
        if (prefsError && prefsError.code !== 'PGRST116') {
          console.error(prefsError);
        }

        setPreferences({
          email_address: prefs?.email_address || store.email_address || '',
          frequency: prefs?.frequency || 'daily',
          low_sales_threshold: prefs?.low_sales_threshold || 1000,
        });
      };
      fetchData();
    }, [storeId]);

    // Fetch inventory alerts
    useEffect(() => {
      if (!storeId) return;
      const fetchAlerts = async () => {
        const { data, error } = await supabase
          .from('inventory_alerts')
          .select('inventory_id, low_stock_threshold')
          .eq('store_id', storeId);
        if (error) {
          console.error(error);
        } else {
          setAlerts(data);
        }
      };
      fetchAlerts();
    }, [storeId]);

    const updatePreferences = async (e) => {
      e.preventDefault();
      setLoading(true);
      const { error } = await supabase.from('store_preferences').upsert({
        store_id: storeId,
        email_address: preferences.email_address || null,
        frequency: preferences.frequency,
        low_sales_threshold: parseFloat(preferences.low_sales_threshold),
      });
      if (error) {
        alert(error.message);
      } else {
        alert('Preferences updated!');
      }
      setLoading(false);
    };

    const addInventoryAlert = async (e) => {
      e.preventDefault();
      setLoading(true);
      const { error } = await supabase.from('inventory_alerts').upsert({
        store_id: storeId,
        inventory_id: parseInt(newAlert.inventoryId),
        low_stock_threshold: parseInt(newAlert.threshold),
      });
      if (error) {
        alert(error.message);
      } else {
        alert('Low stock alert added!');
        setAlerts([...alerts, { inventory_id: parseInt(newAlert.inventoryId), low_stock_threshold: parseInt(newAlert.threshold) }]);
        setNewAlert({ inventoryId: '', threshold: 5 });
      }
      setLoading(false);
    };

    const totalSales = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalAmount = sales.reduce((sum, sale) => sum + sale.amount, 0);

    if (!storeId) return <p>No store ID found. Please log in again.</p>;

    return (
      <div>
        <h1>Sales Dashboard (Store ID: {storeId})</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <h2>Sales Summary (Last 7 Days)</h2>
            <p>Total Sales: {totalSales} units</p>
            <p>Total Amount: ${totalAmount.toFixed(2)}</p>
            <h2>Update Sales Email Preferences</h2>
            <form onSubmit={updatePreferences}>
              <label>
                Email Address (leave blank to use store email):
                <input
                  type="email"
                  value={preferences.email_address}
                  onChange={(e) => setPreferences({ ...preferences, email_address: e.target.value })}
                  placeholder="Custom email (optional)"
                />
              </label>
              <br />
              <label>
                Email Frequency:
                <select
                  value={preferences.frequency}
                  onChange={(e) => setPreferences({ ...preferences, frequency: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
              <br />
              <label>
                Low Sales Threshold ($):
                <input
                  type="number"
                  value={preferences.low_sales_threshold}
                  onChange={(e) =>
                    setPreferences({ ...preferences, low_sales_threshold: e.target.value })
                  }
                />
              </label>
              <br />
              <button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Preferences'}
              </button>
            </form>
            <h2>Manage Low Stock Alerts</h2>
            <form onSubmit={addInventoryAlert}>
              <label>
                Inventory ID:
                <input
                  type="number"
                  value={newAlert.inventoryId}
                  onChange={(e) => setNewAlert({ ...newAlert, inventoryId: e.target.value })}
                  placeholder="Enter inventory ID"
                />
              </label>
              <br />
              <label>
                Low Stock Threshold (units):
                <input
                  type="number"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                  min="1"
                />
              </label>
              <br />
              <button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Alert'}
              </button>
            </form>
            <h3>Current Inventory</h3>
            <ul>
              {inventory.map((item) => (
                <li key={item.id}>
                  Inventory ID: {item.id}, Product ID: {item.dynamic_product_id}, Quantity: {item.quantity}, 
                  Available Qty: {item.available_qty}, Quantity Sold: {item.quantity_sold}
                </li>
              ))}
            </ul>
            <h3>Current Low Stock Alerts</h3>
            <ul>
              {alerts.map((alert) => (
                <li key={alert.inventory_id}>
                  Inventory ID: {alert.inventory_id}, Threshold: {alert.low_stock_threshold} units
                </li>
              ))}
            </ul>
          </>
        )}
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </div>
    );
  }