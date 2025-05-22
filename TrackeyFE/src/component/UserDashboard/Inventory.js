// InventoryManager.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Edit2, Trash2, Save, X, RefreshCw,  AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function InventoryManager() {
  const [storeId, setStoreId] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);

  // Search & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInv, setFilteredInv] = useState([]);
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Restock/edit state
  const [restockQty, setRestockQty] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState(0);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const sid = parseInt(localStorage.getItem('store_id'), 10);
    if (!sid) return;
    setStoreId(sid);

    supabase
      .from('stores')
      .select('shop_name')
      .eq('id', sid)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error(error.message);
        else setStoreName(data.shop_name);
      });

    fetchProducts(sid);
  }, []);

  // --- FETCH INVENTORY WHEN STORE ID SET ---
  useEffect(() => {
    if (storeId) fetchInventory(storeId);
  }, [storeId]);

  // --- SEED NEW PRODUCTS INTO INVENTORY ---
  useEffect(() => {
    if (!storeId || products.length === 0) return;
    const payload = products.map(p => ({
      product_id: p.id,
      store_id: storeId,
      available_qty: p.purchase_qty,
      quantity_sold: 0
    }));

    (async () => {
      const { error } = await supabase
        .from('inventory')
        .insert(payload, {
          onConflict: ['product_id','store_id'],
          ignoreDuplicates: true
        });
      if (error) toast.error(`Seed error: ${error.message}`);
      fetchInventory(storeId);
    })();
  }, [products, storeId]);

  // --- REAL-TIME SYNC: PRODUCT INSERT/UPDATE ---
  useEffect(() => {
    if (!storeId) return;
    const chan = supabase
      .channel(`inv-sync-${storeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products', filter: `store_id=eq.${storeId}` },
        async ({ new: p }) => {
          await supabase
            .from('inventory')
            .insert({
              product_id: p.id,
              store_id: storeId,
              available_qty: p.purchase_qty,
              quantity_sold: 0
            })
            .then(({ error }) => error && toast.error(error.message));
          fetchInventory(storeId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products', filter: `store_id=eq.${storeId}` },
        async ({ new: p }) => {
          await supabase
            .from('inventory')
            .update({ available_qty: p.purchase_qty, updated_at: new Date() })
            .eq('product_id', p.id)
            .eq('store_id', storeId)
            .then(({ error }) => error && toast.error(error.message));
          fetchInventory(storeId);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(chan);
  }, [storeId]);

  // --- FETCHERS ---
  async function fetchProducts(sid) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, purchase_qty')
      .eq('store_id', sid)
      .order('name');
    if (error) toast.error(error.message);
    else setProducts(data);
  }

  async function fetchInventory(sid) {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        id,
        product_id,
        available_qty,
        quantity_sold,
        product:products(name)
      `)
      .eq('store_id', sid)
      .order('name', {
        ascending: true,
        foreignTable: 'products'
      });
  
    if (error) {
      toast.error(`Failed to load inventory: ${error.message}`);
      return;
    }
    setInventory(data);
  }
  

  // --- SEARCH & PAGINATION ---
  useEffect(() => {
    const q = searchTerm.toLowerCase();
    const results = !q
      ? inventory
      : inventory.filter(i => i.product.name.toLowerCase().includes(q));
    setFilteredInv(results);
    setPage(0);
  }, [inventory, searchTerm]);

  // --- HANDLERS ---
  async function handleRestock(id) {
    const qty = parseInt(restockQty[id] || '0', 10);
    if (qty <= 0) return;
    const item = inventory.find(i => i.id === id);
    const newAvail = item.available_qty + qty;

    const { error } = await supabase
      .from('inventory')
      .update({ available_qty: newAvail, updated_at: new Date() })
      .eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Restocked');
      setRestockQty({ ...restockQty, [id]: '' });
      fetchInventory(storeId);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditQty(item.available_qty);
  }
  function cancelEdit() {
    setEditingId(null);
  }
  async function saveEdit(id) {
    const { error } = await supabase
      .from('inventory')
      .update({ available_qty: editQty, updated_at: new Date() })
      .eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Saved');
      setEditingId(null);
      fetchInventory(storeId);
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Deleted');
      fetchInventory(storeId);
    }
  }

  if (!storeId) return <div className="p-4">Loading…</div>;

  const start = page * pageSize;
  const pageData = filteredInv.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredInv.length / pageSize));

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">{storeName} Inventory</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by product…"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full sm:w-1/2 p-2 border rounded mb-4"
      />

      {/* Table */}
      <div className="w-full overflow-x-auto dark:bg-gray-800 dark:text-white">
  <table className="min-w-full table-auto table-fixed border-collapse">
    <thead className="bg-gray-200 text-indigo-500 dark:bg-gray-800 dark:text-indigo-600">
      <tr>
        {['ID', 'Item', 'Avail.', 'Sold', 'Restock', 'Actions'].map((h, i) => (
          <th
            key={i}
            className="p-2 text-left whitespace-nowrap"
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {pageData.map(item => (
        <tr key={item.id} className="border-b hover:bg-gray-100">
          <td className="p-2 whitespace-nowrap">{item.id}</td>
          <td className="p-2 whitespace-nowrap">{item.product.name}</td>
          <td className="p-2 whitespace-nowrap">
            {editingId === item.id ? (
              <input
                type="number"
                min="0"
                value={editQty}
                onChange={e => setEditQty(+e.target.value)}
                className="border p-1 rounded w-20"
              />
            ) : (
              <div className="flex items-center gap-1">
                {item.available_qty}
                {item.available_qty < 5 && (
                  <AlertCircle size={16} className="text-red-500" />
                )}
              </div>
            )}
          </td>
          <td className="p-2 whitespace-nowrap">{item.quantity_sold}</td>
          <td className="p-2 whitespace-nowrap">
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={restockQty[item.id] || ''}
                onChange={e => setRestockQty({ ...restockQty, [item.id]: e.target.value })}
                className="border p-1 rounded w-16"
                placeholder="Qty"
              />
              <button onClick={() => handleRestock(item.id)} className="p-1 bg-indigo-500 text-white rounded">
                <RefreshCw size={14} />
              </button>
            </div>
          </td>
          <td className="p-2 whitespace-nowrap">
            <div className="flex gap-2">
              {editingId === item.id ? (
                <>
                  <button onClick={() => saveEdit(item.id)} className="p-1 bg-green-600 text-white rounded">
                    <Save size={14} />
                  </button>
                  <button onClick={cancelEdit} className="p-1 bg-gray-300 rounded">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(item)} className="p-1 bg-yellow-400 text-white rounded">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1 bg-red-500 text-white rounded">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

    

      {/* Pagination */}
      {filteredInv.length>0 && (
        <div className="flex justify-between items-center">
          <button onClick={()=>setPage(p=>Math.max(p-1,0))} disabled={page===0} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
            Prev
          </button>
          <span className="px-3 py-1 bg-gray-200 rounded">
            Page {page+1} of {totalPages}
          </span>
          <button onClick={()=>setPage(p=>Math.min(p+1,totalPages-1))} disabled={page+1>=totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
