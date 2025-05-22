import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function DynamicProducts() {
  const storeId = localStorage.getItem('store_id');

  // STATES
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState([
    { name: '', description: '', purchase_price: '', purchase_qty: '', selling_price: '', suppliers_name: '', deviceIds: [''] }
  ]);

  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    purchase_price: '',
    selling_price: '',
    suppliers_name: '',
    deviceIds: []
  });

  const [showDetail, setShowDetail] = useState(null);
  const [soldDeviceIds, setSoldDeviceIds] = useState([]);
  const [isLoadingSoldStatus, setIsLoadingSoldStatus] = useState(false);
  const [refreshDeviceList, setRefreshDeviceList] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // For modal device ID pagination
  const [detailPage, setDetailPage] = useState(1);
  const detailPageSize = 5;

  const filteredDevices = useMemo(() => {
    return showDetail?.deviceList || [];
  }, [showDetail]);

  const totalDetailPages = Math.ceil(filteredDevices.length / detailPageSize);

  const paginatedDevices = useMemo(() => {
    const start = (detailPage - 1) * detailPageSize;
    const end = start + detailPageSize;
    return filteredDevices.slice(start, end);
  }, [filteredDevices, detailPage]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, description, purchase_price, purchase_qty, selling_price, suppliers_name, device_id, dynamic_product_imeis, created_at')
      .eq('store_id', storeId)
      .order('id', { ascending: true });
    if (error) {
      toast.error('Failed to fetch products');
      return;
    }
    const withIds = data.map(p => ({
      ...p,
      deviceList: p.dynamic_product_imeis ? p.dynamic_product_imeis.split(',').filter(id => id.trim()) : []
    }));
    setProducts(withIds);
    setFiltered(withIds);
  }, [storeId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts, refreshDeviceList]);

  // Search filter
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(products);
    } else {
      setFiltered(
        products.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.deviceList.some(id => id.toLowerCase().includes(q))
        )
      );
    }
    setCurrentPage(1);
  }, [search, products]);

  // Check which device IDs are sold
  const checkSoldDevices = useCallback(async (deviceIds) => {
    if (!deviceIds || deviceIds.length === 0) return [];
    setIsLoadingSoldStatus(true);
    try {
      const normalizedIds = deviceIds.map(id => id.trim());
      console.log("Checking device IDs:", normalizedIds);
      const { data, error } = await supabase
        .from('dynamic_sales')
        .select('device_id')
        .in('device_id', normalizedIds);
      if (error) {
        console.error('Error fetching sold devices:', error);
        return [];
      }
      console.log("Response from sales table:", data);
      const soldIds = data.map(item => item.device_id.trim());
      console.log("Identified sold IDs:", soldIds);
      setSoldDeviceIds(soldIds);
      return soldIds;
    } catch (error) {
      console.error('Error:', error);
      return [];
    } finally {
      setIsLoadingSoldStatus(false);
    }
  }, []);

  useEffect(() => {
    if (showDetail && showDetail.deviceList.length > 0) {
      checkSoldDevices(showDetail.deviceList);
    } else {
      setSoldDeviceIds([]);
    }
  }, [showDetail, checkSoldDevices]);

  // Remove device ID from product (details modal)
  const removeDeviceId = async (deviceId) => {
    if (!showDetail) return;
    if (!window.confirm(`Remove device ID ${deviceId} from ${showDetail.name}?`)) return;
    try {
      const updatedDeviceList = showDetail.deviceList.filter(id => id !== deviceId);
      const { error } = await supabase
        .from('dynamic_product')
        .update({
          dynamic_product_imeis: updatedDeviceList.join(',')
        })
        .eq('id', showDetail.id);
      if (error) {
        toast.error('Failed to remove device ID');
        console.error(error);
        return;
      }
      const { data: inv } = await supabase
        .from('dynamic_inventory')
        .select('available_qty, quantity_sold')
        .eq('dynamic_product_id', showDetail.id)
        .eq('store_id', storeId)
        .maybeSingle();
      if (inv) {
        await supabase
          .from('dynamic_inventory')
          .update({
            available_qty: Math.max(0, (inv.available_qty || 0) - 1),
            last_updated: new Date().toISOString()
          })
          .eq('dynamic_product_id', showDetail.id)
          .eq('store_id', storeId);
      }
      setShowDetail({
        ...showDetail,
        deviceList: updatedDeviceList
      });
      setRefreshDeviceList(prev => !prev);
      toast.success('Device ID removed');
    } catch (error) {
      console.error('Error removing device ID:', error);
      toast.error('An error occurred');
    }
  };

  // Pagination
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage]
  );

  // Add handlers
  const handleAddChange = (idx, field, val) => {
    const f = [...addForm];
    f[idx][field] = val;
    setAddForm(f);
  };

  const handleAddId = (pIdx, iIdx, val) => {
    const f = [...addForm];
    const trimmedVal = val.trim();
    if (trimmedVal && f[pIdx].deviceIds.includes(trimmedVal)) {
      toast.error(`Device ID "${trimmedVal}" already exists in this product`);
      return;
    }
    f[pIdx].deviceIds[iIdx] = val;
    setAddForm(f);
  };

  const addIdField = pIdx => {
    const f = [...addForm];
    f[pIdx].deviceIds.push('');
    setAddForm(f);
  };

  const removeIdField = (pIdx, iIdx) => {
    const f = [...addForm];
    f[pIdx].deviceIds.splice(iIdx, 1);
    setAddForm(f);
  };

  const addAnotherProduct = () => {
    setAddForm(prev => [...prev, { name: '', description: '', purchase_price: '', purchase_qty: '', selling_price: '', suppliers_name: '', deviceIds: [''] }]);
  };

  const removeProductForm = (index) => {
    setAddForm(prev => prev.filter((_, i) => i !== index));
  };

  // Create products with uniqueness check
  const createProducts = async e => {
    e.preventDefault();
    if (!addForm.length) {
      toast.error('Add at least one product');
      return;
    }
    for (const p of addForm) {
      if (!p.name.trim() || p.deviceIds.filter(d => d.trim()).length === 0) {
        toast.error('Name and at least one Device ID required');
        return;
      }
    }

    const allNewIds = addForm.flatMap(p => p.deviceIds.filter(id => id.trim()).map(id => id.trim()));
    const uniqueNewIds = new Set(allNewIds);
    if (uniqueNewIds.size < allNewIds.length) {
      toast.error('Duplicate Device IDs detected within the new products');
      return;
    }

    const { data: existingProducts, error: fetchError } = await supabase
      .from('dynamic_product')
      .select('id, dynamic_product_imeis')
      .eq('store_id', storeId);
    if (fetchError) {
      toast.error('Failed to validate Device IDs');
      return;
    }

    const existingIds = existingProducts
      .flatMap(p => p.dynamic_product_imeis ? p.dynamic_product_imeis.split(',').map(id => id.trim()) : [])
      .filter(id => id);
    const duplicates = allNewIds.filter(id => existingIds.includes(id));
    if (duplicates.length > 0) {
      toast.error(`Device IDs already exist in other products: ${duplicates.join(', ')}`);
      return;
    }

    const toInsert = addForm.map(p => ({
      store_id: storeId,
      name: p.name,
      description: p.description,
      purchase_price: parseFloat(p.purchase_price) || 0,
      purchase_qty: parseInt(p.purchase_qty) || p.deviceIds.filter(d => d).length,
      selling_price: parseFloat(p.selling_price) || 0,
      suppliers_name: p.suppliers_name,
      dynamic_product_imeis: p.deviceIds.filter(d => d.trim()).join(',')
    }));
    const { data: newProds, error } = await supabase.from('dynamic_product').insert(toInsert).select();
    if (error) {
      toast.error('Failed to add products');
      return;
    }

    const invUpdates = newProds.map(p => ({
      dynamic_product_id: p.id,
      store_id: storeId,
      available_qty: p.dynamic_product_imeis.split(',').length,
      quantity_sold: 0,
      last_updated: new Date().toISOString()
    }));
    await supabase.from('dynamic_inventory').upsert(invUpdates, { onConflict: ['dynamic_product_id', 'store_id'] });

    toast.success('Products added');
    setShowAdd(false);
    setAddForm([{ name: '', description: '', purchase_price: '', purchase_qty: '', selling_price: '', suppliers_name: '', deviceIds: [''] }]);
    fetchProducts();
  };

  // Enhanced Edit functionality
  const openEdit = p => {
    setEditing(p);
    setEditForm({
      name: p.name,
      description: p.description,
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      suppliers_name: p.suppliers_name,
      deviceIds: [...p.deviceList]
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDeviceIdChange = (idx, val) => {
    const trimmedVal = val.trim();
    if (trimmedVal && editForm.deviceIds.some((id, i) => i !== idx && id.trim() === trimmedVal)) {
      toast.error(`Device ID "${trimmedVal}" already exists in this product`);
      return;
    }
    const arr = [...editForm.deviceIds];
    arr[idx] = val;
    setEditForm(prev => ({ ...prev, deviceIds: arr }));
  };

  const addDeviceId = () => {
    setEditForm(prev => ({ ...prev, deviceIds: [...prev.deviceIds, ''] }));
  };

  const removeEditDeviceId = idx => {
    setEditForm(prev => ({
      ...prev,
      deviceIds: prev.deviceIds.filter((_, i) => i !== idx)
    }));
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    const cleanedDeviceIds = editForm.deviceIds
      .filter(id => id.trim())
      .map(id => id.trim());

    if (cleanedDeviceIds.length === 0) {
      toast.error('At least one Device ID is required');
      return;
    }

    const uniqueIds = new Set(cleanedDeviceIds);
    if (uniqueIds.size < cleanedDeviceIds.length) {
      toast.error('Duplicate Device IDs detected within this product');
      return;
    }

    const { data: existingProducts, error: fetchError } = await supabase
      .from('dynamic_product')
      .select('id, dynamic_product_imeis')
      .eq('store_id', storeId)
      .neq('id', editing.id);
    if (fetchError) {
      toast.error('Failed to validate Device IDs');
      return;
    }

    const existingIds = existingProducts
      .flatMap(p => p.dynamic_product_imeis ? p.dynamic_product_imeis.split(',').map(id => id.trim()) : [])
      .filter(id => id);
    const duplicates = cleanedDeviceIds.filter(id => existingIds.includes(id));
    if (duplicates.length > 0) {
      toast.error(`Device IDs already exist in other products: ${duplicates.join(', ')}`);
      return;
    }

    const { error: prodErr } = await supabase
      .from('dynamic_product')
      .update({
        name: editForm.name,
        description: editForm.description,
        purchase_price: parseFloat(editForm.purchase_price) || 0,
        purchase_qty: cleanedDeviceIds.length,
        selling_price: parseFloat(editForm.selling_price) || 0,
        suppliers_name: editForm.suppliers_name,
        dynamic_product_imeis: cleanedDeviceIds.join(',')
      })
      .eq('id', editing.id);

    if (prodErr) {
      console.error(prodErr);
      toast.error('Failed to update product');
      return;
    }

    const { data: inv } = await supabase
      .from('dynamic_inventory')
      .select('available_qty, quantity_sold')
      .eq('dynamic_product_id', editing.id)
      .eq('store_id', storeId)
      .maybeSingle();

    const newAvail = cleanedDeviceIds.length;

    await supabase
      .from('dynamic_inventory')
      .upsert({
        dynamic_product_id: editing.id,
        store_id: storeId,
        available_qty: newAvail,
        quantity_sold: inv?.quantity_sold || 0,
        last_updated: new Date().toISOString()
      }, { onConflict: ['dynamic_product_id', 'store_id'] });

    toast.success('Product updated successfully');
    setEditing(null);
    fetchProducts();
  };

  // Delete
  const deleteProduct = async p => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    await supabase.from('dynamic_product').delete().eq('id', p.id);
    await supabase.from('dynamic_inventory').delete()
      .eq('dynamic_product_id', p.id)
      .eq('store_id', storeId);
    toast.success('Deleted');
    fetchProducts();
  };

  return (
    <div className="p-4 mt-4 dark:bg-gray-900 dark:text-white">
      <ToastContainer />
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name or Device ID..."
          className="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded text-sm sm:text-base hover:bg-indigo-700 transition-all"
        >
          <FaPlus className="text-sm sm:text-base" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={createProducts}
            className="bg-white dark:bg-gray-900 max-w-xl w-full max-h-[80vh] overflow-y-auto p-6 rounded-lg shadow-lg space-y-6"
          >
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Add Products</h2>

            {addForm.map((p, pi) => (
              <div key={pi} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg relative shadow-sm bg-gray-50 dark:bg-gray-800">
                {addForm.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProductForm(pi)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg"
                    title="Remove this product"
                  >
                    ×
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={p.name}
                    onChange={e => handleAddChange(pi, 'name', e.target.value)}
                    className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Supplier Name"
                    value={p.suppliers_name}
                    onChange={e => handleAddChange(pi, 'suppliers_name', e.target.value)}
                    className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <textarea
                    placeholder="Description"
                    value={p.description}
                    onChange={e => handleAddChange(pi, 'description', e.target.value)}
                    className="p-2 border rounded w-full md:col-span-2 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Purchase Price"
                    value={p.purchase_price}
                    onChange={e => handleAddChange(pi, 'purchase_price', e.target.value)}
                    className="p-2 border rounded w-full md:col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Selling Price"
                    value={p.selling_price}
                    onChange={e => handleAddChange(pi, 'selling_price', e.target.value)}
                    className="p-2 border rounded w-full md:col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="mt-4">
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Device IDs</label>
                  {p.deviceIds.map((id, i) => (
                    <div key={i} className="flex gap-2 mt-2">
                      <input
                        value={id}
                        onChange={e => handleAddId(pi, i, e.target.value)}
                        placeholder="Device ID"
                        className={`flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          id.trim() && p.deviceIds.some((otherId, j) => j !== i && otherId.trim() === id.trim())
                            ? 'border-red-500'
                            : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeIdField(pi, i)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove ID"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addIdField(pi)}
                    className="mt-2 text-indigo-600 hover:underline text-sm dark:text-indigo-400"
                  >
                    + Add Device ID
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={addAnotherProduct}
                className="text-indigo-600 hover:underline text-sm dark:text-indigo-400"
              >
                + Add Another Product
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
        <table className="min-w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase text-gray-600 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Name</th>
              <th className="px-4 py-3 whitespace-nowrap">Description</th>
              <th className="px-4 py-3 whitespace-nowrap">Purchase</th>
              <th className="px-4 py-3 whitespace-nowrap">Qty</th>
              <th className="px-4 py-3 whitespace-nowrap">Selling</th>
              <th className="px-4 py-3 whitespace-nowrap">Supplier</th>
              <th className="px-4 py-3 whitespace-nowrap">Product ID</th>
              <th className="px-4 py-3 whitespace-nowrap">Date</th>
              <th className="px-4 py-3 whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginated.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td className="px-4 py-3 whitespace-nowrap">{p.name}</td>
                <td className="px-4 py-3 whitespace-nowrap">{p.description}</td>
                <td className="px-4 py-3 whitespace-nowrap">{p.purchase_price?.toFixed(2)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{p.deviceList.length}</td>
                <td className="px-4 py-3 whitespace-nowrap">{p.selling_price?.toFixed(2)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{p.suppliers_name}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => setShowDetail(p)}
                    className="text-indigo-600 hover:underline focus:outline-none dark:text-indigo-400"
                  >
                    {p.device_id || 'View'}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => deleteProduct(p)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(cp => cp - 1)}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
        >
          Prev
        </button>
        <span className="px-3 py-1">{currentPage} / {totalPages || 1}</span>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage(cp => cp + 1)}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
        >
          Next
        </button>
      </div>

      {showDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded max-w-xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{showDetail.name} Device IDs</h2>

            {isLoadingSoldStatus ? (
              <div className="flex justify-center py-4">
                <p className="text-gray-600 dark:text-gray-400">Loading device status...</p>
              </div>
            ) : (
              <div>
                <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedDevices.map((id, i) => {
                    const q = search.trim().toLowerCase();
                    const match = id.toLowerCase().includes(q);
                    const isSold = soldDeviceIds.includes(id);
                    return (
                      <li key={i} className={`py-2 px-1 flex items-center justify-between ${match ? 'bg-yellow-50 dark:bg-yellow-800' : ''}`}>
                        <div className="flex items-center">
                          <span className={match ? 'font-semibold' : ''}>
                            {id}
                          </span>
                          {isSold && (
                            <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-300">
                              SOLD
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeDeviceId(id)}
                          className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Remove this device ID"
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {totalDetailPages > 1 && (
                  <div className="flex justify-between items-center mt-4 text-sm text-gray-700 dark:text-gray-300">
                    <button
                      onClick={() => setDetailPage(p => Math.max(p - 1, 1))}
                      disabled={detailPage === 1}
                      className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                    >
                      Prev
                    </button>
                    <span>
                      Page {detailPage} of {totalDetailPages}
                    </span>
                    <button
                      onClick={() => setDetailPage(p => Math.min(p + 1, totalDetailPages))}
                      disabled={detailPage === totalDetailPages}
                      className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowDetail(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded max-w-xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Edit Product</h2>

            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Product Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => handleEditChange('name', e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={e => handleEditChange('description', e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.purchase_price}
                      onChange={e => handleEditChange('purchase_price', e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.selling_price}
                      onChange={e => handleEditChange('selling_price', e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={editForm.suppliers_name}
                    onChange={e => handleEditChange('suppliers_name', e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Device IDs</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device IDs</label>
                  {editForm.deviceIds.map((id, i) => (
                    <div key={i} className="flex gap-2 mt-2">
                      <input
                        value={id}
                        onChange={e => handleDeviceIdChange(i, e.target.value)}
                        placeholder="Device ID"
                        className={`flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          id.trim() && editForm.deviceIds.some((otherId, j) => j !== i && otherId.trim() === id.trim())
                            ? 'border-red-500'
                            : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeEditDeviceId(i)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDeviceId}
                    className="mt-2 text-indigo-600 hover:underline text-sm dark:text-indigo-400"
                  >
                    + Add Device ID
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DynamicProducts;