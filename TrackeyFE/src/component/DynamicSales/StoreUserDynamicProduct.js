import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import {
  FaEdit,
  FaFileCsv,
  FaFilePdf,
  FaPlus,
 
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';

const tooltipVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DynamicProducts() {
  const storeId = localStorage.getItem('store_id');

  // State
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState([{
    name: '',
    description: '',
    purchase_price: '',
    purchase_qty: '',
    selling_price: '',
    suppliers_name: '',
    device_id: '',
  }]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const itemsPerPage = 20;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Onboarding steps
  const onboardingSteps = [
    {
      target: '.add-product-button',
      content: 'Click to add a new product to your catalog.',
    },
    {
      target: '.search-input',
      content: 'Search by product name to filter the catalog.',
    },
    {
      target: products.length > 0 ? '.edit-button-0' : '.add-product-button',
      content: products.length > 0 ? 'Click to edit product details.' : 'Start by adding your first product!',
    },
  ];

  // Check if onboarding has been completed
  useEffect(() => {
    if (!localStorage.getItem('productCatalogOnboardingCompleted')) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 3000); // 3-second delay
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!storeId) {
      toast.error('No store ID found. Please log in.');
      return;
    }
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, description, purchase_price, purchase_qty, selling_price, suppliers_name, device_id, created_at')
      .eq('store_id', storeId)
      .order('id', { ascending: true });
    if (error) {
      console.error('Error fetching products:', error.message);
      toast.error('Failed to fetch products');
    } else {
      setProducts(data);
      setFiltered(data);
    }
  }, [storeId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Search filter
  useEffect(() => {
    if (!search) setFiltered(products);
    else {
      const q = search.toLowerCase();
      setFiltered(products.filter(p => p.name.toLowerCase().includes(q)));
    }
    setCurrentPage(1);
  }, [search, products]);

  // Add product handlers
  const handleAddChange = (e, index) => {
    const { name, value } = e.target;
    setAddForm(prev => {
      const newForm = [...prev];
      newForm[index][name] = value;
      return newForm;
    });
  };

  const removeProduct = (index) => {
    setAddForm(prev => prev.filter((_, i) => i !== index));
  };

  const addAnotherProduct = () => {
    setAddForm(prev => [...prev, {
      name: '',
      description: '',
      purchase_price: '',
      purchase_qty: '',
      selling_price: '',
      suppliers_name: '',
      device_id: '',
    }]);
  };

  const createProducts = async (e) => {
    e.preventDefault();
    if (addForm.length === 0) {
      toast.error('Please add at least one product');
      return;
    }
    const isValid = addForm.every(product =>
      product.name &&  product.purchase_qty
    );
    if (!isValid) {
      toast.error('Please fill all required fields for each product');
      return;
    }
    const productsToInsert = addForm.map(product => ({
      store_id: storeId,
      name: product.name,
      description: product.description,
      purchase_price: parseFloat(product.purchase_price),
      purchase_qty: parseInt(product.purchase_qty),
      selling_price: parseFloat(product.selling_price),
      suppliers_name: product.suppliers_name,
      device_id: product.device_id
    }));
    const { data: insertedProducts, error: insertError } = await supabase
      .from('dynamic_product')
      .insert(productsToInsert)
      .select();
    if (insertError) {
      toast.error(`Failed to add products: ${insertError.message}`);
      return;
    }

    // Update dynamic_inventory for each inserted product
    const inventoryUpdates = insertedProducts.map(product => ({
      dynamic_product_id: product.id,
      store_id: storeId,
      available_qty: parseInt(product.purchase_qty),
      quantity_sold: 0,
      last_updated: new Date().toISOString()
    }));
    const { error: inventoryError } = await supabase
      .from('dynamic_inventory')
      .upsert(inventoryUpdates, { onConflict: ['dynamic_product_id', 'store_id'] });
    if (inventoryError) {
      toast.error(`Failed to update inventory: ${inventoryError.message}`);
      return;
    }

    toast.success('Products added successfully');
    setShowAdd(false);
    setAddForm([{
      name: '',
      description: '',
      purchase_price: '',
      purchase_qty: '',
      selling_price: '',
      suppliers_name: '',
      device_id: '',
    }]);
    fetchProducts();
  };

  // Edit handlers
  const startEdit = p => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || '',
      purchase_price: p.purchase_price,
      purchase_qty: p.purchase_qty,
      selling_price: p.selling_price,
      suppliers_name: p.suppliers_name || '',
      device_id: p.device_id || '',
    });
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
const saveEdit = async () => {
  if (!form.name || !form.purchase_qty) {
    toast.error('Please fill all required fields');
    return;
  }

  const restockQty = parseInt(form.purchase_qty);
  if (restockQty <= 0) {
    toast.error('Restock quantity must be greater than zero');
    return;
  }

  // Log input for debugging
  console.log('Restock Quantity Entered:', restockQty);

  // Update dynamic_product (store restock amount for transaction history)
  const productUpdate = {
    name: form.name,
    description: form.description,
    purchase_price: parseFloat(form.purchase_price),
    purchase_qty: restockQty, // Record restock amount
    selling_price: parseFloat(form.selling_price),
    suppliers_name: form.suppliers_name,
    device_id: form.device_id,
  };
  const { error: productError } = await supabase
    .from('dynamic_product')
    .update(productUpdate)
    .eq('id', editing.id);
  if (productError) {
    toast.error(`Failed to update product: ${productError.message}`);
    return;
  }

  // Fetch current inventory data
  const { data: inventoryData, error: fetchInventoryError } = await supabase
    .from('dynamic_inventory')
    .select('available_qty, quantity_sold')
    .eq('dynamic_product_id', editing.id)
    .eq('store_id', storeId)
    .maybeSingle();

  // Log fetched inventory data
  console.log('Fetched Inventory Data:', inventoryData);
  console.log('Fetch Inventory Error:', fetchInventoryError);

  let newAvailableQty = restockQty; // Default for new inventory entries
  let existingQuantitySold = 0; // Default for new entries
  if (inventoryData) {
    // Add restock quantity to existing available_qty
    newAvailableQty = inventoryData.available_qty + restockQty;
    existingQuantitySold = inventoryData.quantity_sold || 0;
  } else if (fetchInventoryError) {
    toast.error(`Failed to fetch inventory: ${fetchInventoryError.message}`);
    return;
  }

  // Log calculated new available_qty
  console.log('Calculated New Available Qty:', newAvailableQty);

  // Update or insert dynamic_inventory
  const inventoryUpdate = {
    dynamic_product_id: editing.id,
    store_id: storeId,
    available_qty: newAvailableQty,
    quantity_sold: existingQuantitySold,
    last_updated: new Date().toISOString(),
  };
  const { error: inventoryError } = await supabase
    .from('dynamic_inventory')
    .upsert([inventoryUpdate], { onConflict: ['dynamic_product_id', 'store_id'] });
  if (inventoryError) {
    toast.error(`Failed to update inventory: ${inventoryError.message}`);
    return;
  }

  toast.success('Product restocked successfully');
  setEditing(null);
  fetchProducts();
};




  // Export CSV
  const exportCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Name,Description,PurchasePrice,Qty,SellingPrice,Supplier,DeviceID,CreatedAt\n";
    filtered.forEach(p => {
      const row = [
        p.name,
        (p.description || '').replace(/,/g, ' '),
        parseFloat(p.purchase_price).toFixed(2),
        p.purchase_qty,
        parseFloat(p.selling_price).toFixed(2),
        p.suppliers_name || '',
        p.device_id || '',
        p.created_at
      ].join(',');
      csv += row + '\n';
    });
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = 'dynamic_products.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF
  const exportPDF = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      let y = 10;
      doc.text('Dynamic Products', 10, y);
      y += 10;
      filtered.forEach(p => {
        const line = `Name: ${p.name}, Purchase: $${parseFloat(p.purchase_price).toFixed(2)}, Qty: ${p.purchase_qty}, Sell: $${parseFloat(p.selling_price).toFixed(2)}`;
        doc.text(line, 10, y);
        y += 10;
      });
      doc.save('dynamic_products.pdf');
    });
  };

  // Onboarding handlers
  const handleNextStep = () => {
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      setShowOnboarding(false);
      localStorage.setItem('productCatalogOnboardingCompleted', 'true');
    }
  };

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('productCatalogOnboardingCompleted', 'true');
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

  return (
    <div className="p-0 mt-24">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white search-input"
        />
        <button
          onClick={() => setShowAdd(true)}
          className="w-full sm:w-auto flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 add-product-button"
        >
          <FaPlus /> Products
        </button>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-4 overflow-y-auto pt-24 ">
          <div className="w-full max-w-3xl mx-auto  ">
            <form
              onSubmit={createProducts}
              className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full dark:text-white"
            >
              <h2 className="text-2xl font-bold mb-6 ">Add Products</h2>
              {addForm.map((product, index) => (
                <div key={index} className="mb-4 p-4 border rounded ">
                  <h3 className="text-lg font-semibold mb-2">Product {index + 1}</h3>
                  {[
                    { name: 'name', label: 'Name' },
                    { name: 'description', label: 'Description' },
   
                    { name: 'purchase_qty', label: 'Quantity Bought' },
                    { name: 'selling_price', label: 'Selling Price' },
                    { name: 'suppliers_name', label: 'Supplier Name' },
                    { name: 'device_id', label: 'Product ID' },
                  ].map(field => (
                    <div key={field.name} className="mb-2">
                      <label className="block mb-1">{field.label}</label>
                      <input
                        type={field.name.includes('price') || field.name.includes('qty') ? 'number' : 'text'}
                        step="0.01"
                        name={field.name}
                        value={product[field.name]}
                        onChange={(e) => handleAddChange(e, index)}
                        required={['name',  'purchase_qty'].includes(field.name)}
                        className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addAnotherProduct}
                className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Another Product
              </button>
              <div className="w-full flex justify-center gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Add Products
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg shadow dark:text-white">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              {['Name', 'Description', 'Purchase', 'Qty', 'Selling', 'Supplier', 'Product ID', 'Date', 'Edit/Restock'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-sm font-semibold dark:bg-gray-900 dark:text-indigo-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {paginatedProducts.map((p, index) => (
              <tr key={p.id}>
                <td className="px-4 py-2 text-sm">{p.name}</td>
                <td className="px-4 py-2 text-sm">{p.description}</td>
                <td className="px-4 py-2 text-sm">
                  {p.purchase_price != null
                    ? parseFloat(p.purchase_price).toFixed(2)
                    : ''}
                </td>
                <td className="px-4 py-2 text-sm">{p.purchase_qty}</td>
                <td className="px-4 py-2 text-sm">
                  {p.selling_price != null
                    ? parseFloat(p.selling_price).toFixed(2)
                    : ''}
                </td>
                <td className="px-4 py-2 text-sm">{p.suppliers_name}</td>
                <td className="px-4 py-2 text-sm">{p.device_id}</td>
                <td className="px-4 py-2 text-sm">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => startEdit(p)} className={`text-indigo-600 hover:text-indigo-800 edit-button-${index}`}>
                    <FaEdit />
                  </button>
                  
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
        >
          Prev
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${currentPage === i + 1
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Exports */}
      <div className="flex justify-center gap-4 mt-4">
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          <FaFileCsv /> CSV
        </button>
        <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          <FaFilePdf /> PDF
        </button>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md overflow-y-auto max-h-[90vh] mt-32">
            <h2 className="text-xl font-bold mb-4">Edit {editing.name}</h2>
            {[
              { name: 'name', label: 'Name' },
              { name: 'description', label: 'Description' },
          
              { name: 'purchase_qty', label: 'Qty Bought (Restock)' },
              { name: 'selling_price', label: 'Selling Price' },
              { name: 'suppliers_name', label: 'Supplier Name' },
              { name: 'device_id', label: 'Product ID' },
            ].map(field => (
              <div className="mb-3" key={field.name}>
                <label className="block mb-1">{field.label}</label>
                <input
                  type={field.name.includes('price') || field.name.includes('qty') ? 'number' : 'text'}
                  step="0.01"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleFormChange}
                  required={['name', 'purchase_price', 'purchase_qty'].includes(field.name)}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
              <button onClick={saveEdit} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tooltip */}
      {showOnboarding && onboardingStep < onboardingSteps.length && (
        <motion.div
          className="fixed z-50  bg-indigo-600 dark:bg-gray-900 border rounded-lg shadow-lg p-4 max-w-xs"
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
                className="text-sm text-gray-300 hover:text-gray-800 dark:text-gray-300"
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