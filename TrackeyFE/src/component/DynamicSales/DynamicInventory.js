import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const tooltipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function InventoryManager() {
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [dynamicProducts, setDynamicProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIdCounter, setHistoryIdCounter] = useState(1);
  const [showLowStock, setShowLowStock] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [lowStockSort, setLowStockSort] = useState('quantity');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInv, setFilteredInv] = useState([]);
  const [page, setPage] = useState(0);
  const pageSize = 5;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Onboarding steps
  const onboardingSteps = [
    {
      target: '.search-input',
      content: 'Search by product name to filter inventory items.',
    },
    {
      target: '.low-stock-toggle',
      content: 'Toggle to view items with low stock levels.',
    },
    {
      target: inventory.length > 0 ? '.delete-button-0' : '.search-input',
      content: inventory.length > 0 ? 'Click to remove an item from inventory.' : 'Add products to start managing your inventory!',
    },
    
  ];

  // Check if onboarding has been completed
  useEffect(() => {
    if (!localStorage.getItem('inventoryManagerOnboardingCompleted')) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 3000); // 3-second delay
      return () => clearTimeout(timer);
    }
  }, []);

  // INITIAL LOAD
  useEffect(() => {
    const sid = parseInt(localStorage.getItem('store_id'));
    if (!sid) {
      toast.error('No store ID found in localStorage');
      return;
    }
    setStoreId(sid);

    supabase
      .from('stores')
      .select('shop_name')
      .eq('id', sid)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error(`Failed to fetch store: ${error.message}`);
        else setStoreName(data.shop_name);
      });

    fetchDynamicProducts(sid);
  }, []);

  // FETCH INVENTORY WHEN STORE ID SET
  useEffect(() => {
    if (storeId) fetchInventory(storeId);
  }, [storeId]);

  // SEED NEW PRODUCTS INTO INVENTORY
 // SEED NEW PRODUCTS INTO INVENTORY
useEffect(() => {
  if (!storeId || dynamicProducts.length === 0) return;

  const payload = dynamicProducts
    .filter(p => !inventory.some(i => i.dynamic_product?.id === p.id))
    .map(p => ({
      dynamic_product_id: p.id,
      store_id: storeId,
      available_qty: p.purchase_qty,
      quantity_sold: 0
    }));

  if (payload.length === 0) return;

  (async () => {
    const { error } = await supabase
      .from('dynamic_inventory')
      .insert(payload, {
        onConflict: ['dynamic_product_id', 'store_id'],
        ignoreDuplicates: true
      });
    if (error) {
      // Suppress notification for unique constraint violation
      if (!error.message.includes('unique_product_store')) {
        toast.error(`Seed error: ${error.message}`);
      }
    } else {
      toast.success(`Seeded ${payload.length} new products to inventory`);
    }
    fetchInventory(storeId);
  })();
}, [dynamicProducts, storeId, inventory]);

  // REAL-TIME SYNC: PRODUCT INSERT/UPDATE
  useEffect(() => {
    if (!storeId) return;
    const chan = supabase
      .channel(`inv-sync-${storeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dynamic_product', filter: `store_id=eq.${storeId}` },
        async ({ new: p }) => {
          console.log('Real-time INSERT received:', p);
          const { error } = await supabase
            .from('dynamic_inventory')
            .upsert(
              {
                dynamic_product_id: p.id,
                store_id: storeId,
                available_qty: p.purchase_qty,
                quantity_sold: 0
              },
              {
                onConflict: ['dynamic_product_id', 'store_id']
              }
            );

           // Check if error is due to unique constraint violation
        if (error) {
          if (error.message.includes('unique_product_store')) {
            console.log("Unique constraint violation handled, no need to display error.");
            return; // Avoid displaying error message for constraint violation
          }
        } else {
          toast.success(`Added ${p.name} to inventory`);
          setHistory(prev => [
            {
              id: historyIdCounter,
              action: 'insert',
              product_name: p.name,
              quantity: p.purchase_qty,
              timestamp: new Date().toISOString()
            },
            ...prev.slice(0, 9)
          ]);
          setHistoryIdCounter(prev => prev + 1);
        }

        // Fetch latest dynamic products and inventory
        fetchDynamicProducts(storeId);
        fetchInventory(storeId);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'dynamic_product', filter: `store_id=eq.${storeId}` },
      async ({ new: p }) => {
        console.log('Real-time UPDATE received:', p);
        // Fetch inventory to check if it exists
        const { data: existing } = await supabase
          .from('dynamic_inventory')
          .select('available_qty')
          .eq('dynamic_product_id', p.id)
          .eq('store_id', storeId)
          .maybeSingle();

        if (!existing) {
          // If no inventory exists, create it
          const { error } = await supabase
            .from('dynamic_inventory')
            .upsert(
              {
                dynamic_product_id: p.id,
                store_id: storeId,
                available_qty: p.purchase_qty,
                quantity_sold: 0,
                last_updated: new Date().toISOString(),
              },
              { onConflict: ['dynamic_product_id', 'store_id'] }
            );

          if (error) {
            toast.error(`Sync insert error: ${error.message}`);
          } else {
            toast.success(`Initialized ${p.name} in inventory`);
            setHistory(prev => [
              {
                id: historyIdCounter,
                action: 'insert',
                product_name: p.name,
                quantity: p.purchase_qty,
                timestamp: new Date().toISOString(),
              },
              ...prev.slice(0, 9),
            ]);
            setHistoryIdCounter(prev => prev + 1);
          }
        }
        // Do not update available_qty to avoid overwriting restock logic
        fetchDynamicProducts(storeId); // Refresh product names if changed
        fetchInventory(storeId);
      }
    )
    .subscribe(status => {
      console.log('Subscription status:', status);
    });

    return () => {
      supabase.removeChannel(chan);
      console.log('Unsubscribed from channel:', `inv-sync-${storeId}`);
    };
  }, [storeId, historyIdCounter]);
 
 
  // FETCHERS
  async function fetchDynamicProducts(sid) {
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, purchase_qty')
      .eq('store_id', sid)
      .order('name');
    if (error) {
      toast.error(`Failed to fetch products: ${error.message}`);
      setDynamicProducts([]);
    } else {
      setDynamicProducts(data || []);
    }
  }

  async function fetchInventory(storeId) {
    const { data, error } = await supabase
      .from('dynamic_inventory')
      .select(`
        id,
        available_qty,
        quantity_sold,
        dynamic_product (
          id,
          name
        )
      `)
      .eq('store_id', storeId);

    if (error) {
      toast.error(`Failed to fetch inventory: ${error.message}`);
      setInventory([]);
      return;
    }

    setInventory(data || []);
    console.log('Fetched inventory:', data);
  }

  // SEARCH & PAGINATION
  useEffect(() => {
    const q = searchTerm.toLowerCase();
    const results = !q
      ? inventory
      : inventory.filter(i => {
          const name = i.dynamic_product?.name || '';
          return name.toLowerCase().includes(q);
        });

    setFilteredInv(results);
    setPage(0);
  }, [inventory, searchTerm]);

  // LOW STOCK ITEMS
  const lowStockItems = inventory
    .filter(item => item.available_qty <= lowStockThreshold)
    .sort((a, b) => {
      if (lowStockSort === 'quantity') {
        return a.available_qty - b.available_qty;
      }
      return (a.dynamic_product?.name || '').localeCompare(b.dynamic_product?.name || '');
    });

  
  // Onboarding handlers
  const handleNextStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
      localStorage.setItem('inventoryManagerOnboardingCompleted', 'true');
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('inventoryManagerOnboardingCompleted', 'true');
  };

  // Tooltip positioning
  const getTooltipPosition = (target) => {
    const element = document.querySelector(target);
    if (!element) return { top: 0, left: 0 };
    const rect = element.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 10,
      left: rect.left + window.scrollX,
    };
  };

  if (!storeId) return <div className="p-4">Loading…</div>;

  const start = page * pageSize;
  const pageData = filteredInv.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredInv.length / pageSize));

  return (
    <div className="p-0 space-y-6 dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold text-center">{storeName} Inventory</h1>

      {/* Search and Low Stock Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search by product…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/2 p-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-600 search-input"
        />

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Threshold Input */}
          <input
            type="number"
            min="0"
            value={lowStockThreshold}
            onChange={e => setLowStockThreshold(parseInt(e.target.value) || 5)}
            className="p-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-600 w-full sm:w-24"
            placeholder="Threshold"
          />

          {/* Sort Dropdown */}
          <select
            value={lowStockSort}
            onChange={e => setLowStockSort(e.target.value)}
            className="p-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-600 w-full sm:w-auto"
          >
            <option value="quantity">Sort by Quantity</option>
            <option value="name">Sort by Name</option>
          </select>

          {/* Toggle Button */}
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            disabled={lowStockItems.length === 0}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 w-full sm:w-auto low-stock-toggle
              ${lowStockItems.length === 0
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none'}
            `}
          >
            {showLowStock ? <EyeOff size={18} /> : <Eye size={18} />}
            {lowStockItems.length === 0
              ? 'No Low Stock'
              : `${showLowStock ? '' : ''} Low Stock (${lowStockItems.length})`}
          </button>
        </div>
      </div>

      {/* Low Stock Table */}
      {showLowStock && lowStockItems.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Low Stock Items (Below {lowStockThreshold} Units)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-200 text-indigo-500 dark:bg-gray-700 dark:text-indigo-400">
                <tr>
                  {['Product', 'Available Qty', 'Quantity Sold'].map((h, i) => (
                    <th key={i} className="p-2 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700">
                    <td className="p-2 whitespace-nowrap">{item.dynamic_product?.name || 'Unknown'}</td>
                    <td className="p-2 whitespace-nowrap text-red-500">{item.available_qty}</td>
                    <td className="p-2 whitespace-nowrap">{item.quantity_sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="w-full overflow-x-auto dark:bg-gray-900 dark:text-white">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-gray-200 text-indigo-500 dark:bg-gray-700 dark:text-indigo-400">
            <tr>
              {['ID', 'Item', 'Avail.', 'Sold'].map((h, i) => (
                <th key={i} className="p-2 text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((item, index) => (
              <tr key={item.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="p-2 whitespace-nowrap">{item.id}</td>
                <td className="p-2 whitespace-nowrap">{item.dynamic_product?.name || 'Unknown'}</td>
                <td className="p-2 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {item.available_qty}
                    {item.available_qty <= lowStockThreshold && (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                  </div>
                </td>
                <td className="p-2 whitespace-nowrap">{item.quantity_sold}</td>
             
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredInv.length > 0 && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => setPage(p => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            Prev
          </button>
          <span className="px-3 py-1 bg-gray-200 rounded dark:bg-gray-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
            disabled={page + 1 >= totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            Next
          </button>
        </div>
      )}

      {/* History Section */}
      <div className="mt-6 history-table">
        <h2 className="text-xl font-semibold mb-4">Inventory Action History</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No actions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead className="bg-gray-200 text-indigo-500 dark:bg-gray-700 dark:text-indigo-400">
                <tr>
                  {['ID', 'Time', 'Action', 'Product', 'Quantity'].map((h, i) => (
                    <th key={i} className="p-2 text-left whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(entry => (
                  <tr key={entry.id} className="border-b hover:bg-gray-100 dark:hover:bg-gray-700">
                    <td className="p-2 whitespace-nowrap">{entry.id}</td>
                    <td className="p-2 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="p-2 whitespace-nowrap capitalize">{entry.action}</td>
                    <td className="p-2 whitespace-nowrap">{entry.product_name}</td>
                    <td className="p-2 whitespace-nowrap">
                      {entry.quantity !== null ? entry.quantity : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboarding Tooltip */}
      {showOnboarding && onboardingStep < onboardingSteps.length && (
        <motion.div
          className="fixed z-50 bg-indigo-600 dark:bg-gray-900 border rounded-lg shadow-lg p-4 max-w-xs"
          style={getTooltipPosition(onboardingSteps[onboardingStep].target)}
          variants={tooltipVariants}
          initial="hidden"
          animate="visible"
        >
          <p className="text-sm text-white dark:text-gray-300 mb-2">
            {onboardingSteps[onboardingStep].content}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-200">
              Step {onboardingStep + 1} of {onboardingSteps.length}
            </span>
            <div className="space-x-2">
              <button
                onClick={handleSkipOnboarding}
                className="text-sm text-white hover:text-gray-800 dark:text-gray-300"
              >
                Skip
              </button>
              <button
                onClick={handleNextStep}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded"
              >
                {onboardingStep + 1 === onboardingSteps.length ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}