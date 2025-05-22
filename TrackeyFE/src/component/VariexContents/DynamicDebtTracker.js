import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import DynamicPaymentHistory from './DynamicPaymentHistory';
import DynamicDebtHistory from './DynamicDebtHistory';

export default function DebtTracker() {
  const store_id = Number(localStorage.getItem('store_id'));

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [newDebt, setNewDebt] = useState({
    customer_id: '',
    product_id: '',
    suppliers_name: '',
    device_id: '',
    quantity: 1,
    amount_owed: '',
    amount_deposited: ''
  });
  const [debts, setDebts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // fetch customers
  const fetchCustomers = useCallback(async () => {
    const { data, error } = await supabase
      .from('customer')
      .select('id, fullname, phone_number')
      .eq('store_id', store_id)
      .order('fullname');
    if (error) toast.error('Failed to load customers');
    else setCustomers(data);
  }, [store_id]);

  // fetch products
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('dynamic_product')
      .select('id, name, suppliers_name, device_id')
      .eq('store_id', store_id)
      .order('name');
    if (error) toast.error('Failed to load products');
    else setProducts(data);
  }, [store_id]);

  // fetch debts
  const fetchDebts = useCallback(async () => {
    const { data, error } = await supabase
      .from('debt_tracker2')
      .select(`
        id,
        customer_id,
        product_id,
        quantity,
        amount_owed,
        amount_deposited,
        debt_date,
        customer:customer_id(fullname),
        dynamic_product(name,suppliers_name,device_id)
      `)
      .eq('store_id', store_id)
      .order('debt_date', { ascending: false });
    if (error) toast.error('Failed to load debts');
    else setDebts(data || []);
  }, [store_id]);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchDebts();
  }, [fetchCustomers, fetchProducts, fetchDebts]);

  // on product select, auto-populate supplier & device
  const handleProductChange = e => {
    const productId = e.target.value;
    const product = products.find(p => p.id === Number(productId));
    setNewDebt(d => ({
      ...d,
      product_id: productId,
      suppliers_name: product?.suppliers_name || '',
      device_id: product?.device_id || ''
    }));
  };

  const handleNewChange = e => {
    const { name, value } = e.target;
    setNewDebt(d => ({ ...d, [name]: value }));
  };

  const handleAddDebt = async e => {
    e.preventDefault();

    const payload = {
      store_id,
      customer_id: Number(newDebt.customer_id),
      product_id: newDebt.product_id ? Number(newDebt.product_id) : null,
      quantity: Number(newDebt.quantity),
      amount_owed: parseFloat(newDebt.amount_owed),
      amount_deposited: parseFloat(newDebt.amount_deposited),
      debt_date: new Date().toISOString(),
      created_by_owner: store_id,
      created_by_user: null
    };

    const { data: insertedDebt, error: debtError } = await supabase
      .from('debt_tracker2')
      .insert([payload])
      .select()
      .single();

    if (debtError) {
      toast.error(debtError.message);
      return;
    }

    const amountPaid = parseFloat(newDebt.amount_deposited) || 0;
    let paymentError = null;

    if (amountPaid > 0) {
      const { error } = await supabase
        .from('debt_payment_history2')
        .insert([{
          store_id,
          customer_id: Number(newDebt.customer_id),
          debt_tracker_id: insertedDebt.id,
          debt_product_id: newDebt.product_id ? Number(newDebt.product_id) : null,
          amount_paid: amountPaid,
          payment_date: new Date().toISOString()
        }]);
      paymentError = error;
    }

    if (paymentError) {
      toast.error(paymentError.message);
    }

    toast.success('Debt and payment history created');
    setNewDebt({ customer_id: '', product_id: '', suppliers_name: '', device_id: '', quantity: 1, amount_owed: '', amount_deposited: '' });
    fetchDebts();
    setShowForm(false);
  };

  const handleUpdate = async e => {
    e.preventDefault();
    const { id, ...updates } = { id: editingId, ...newDebt };

    const { error } = await supabase
      .from('debt_tracker2')
      .update({
        customer_id: Number(updates.customer_id),
        product_id: updates.product_id ? Number(updates.product_id) : null,
        quantity: Number(updates.quantity),
        amount_owed: parseFloat(updates.amount_owed),
        amount_deposited: parseFloat(updates.amount_deposited)
      })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Debt updated');
    setEditingId(null);
    setNewDebt({ customer_id: '', product_id: '', suppliers_name: '', device_id: '', quantity: 1, amount_owed: '', amount_deposited: '' });
    fetchDebts();
    setShowForm(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this debt?')) return;
    const { error } = await supabase.from('debt_tracker2').delete().eq('id', id);
    if (error) toast.error(error.message);
    else fetchDebts();
  };

  return (
    <div className="max-w-5xl mx-auto p-0 space-y-6 dark:bg-gray-900 text-gray-800 dark:text-white">
      <h2 className="text-3xl font-bold text-center text-indigo-700 mb-4">Debt Trackers</h2>


      <DynamicPaymentHistory />
        
        <DynamicDebtHistory />


        
      {/* Toggle button for form */}


      <div className="text-center">
        <button
          onClick={() => setShowForm(prev => !prev)}
          className="mb-4 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
        >
          {showForm ? 'Close Form' : (editingId ? 'Edit Debt' : '+ New Debt')}
        </button>
      </div>
      
      {/* Conditionally rendered form */}
      {showForm && (
        
        <form
          onSubmit={editingId ? handleUpdate : handleAddDebt}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-100 p-4 rounded dark:bg-gray-900 text-gray-800 dark:text-white"
        >

          <select
            name="customer_id"
            value={newDebt.customer_id}
            onChange={handleNewChange}
            required
            className="p-2 border rounded dark:bg-gray-900 text-gray-800 dark:text-white"
          >
            <option value="">Select Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.fullname} ({c.phone_number})
              </option>
            ))}
          </select>

          <select
            name="product_id"
            value={newDebt.product_id}
            onChange={handleProductChange}
            className="p-2 border rounded dark:bg-gray-900 text-gray-800 dark:text-white"
          >
            <option value="">Select	Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="suppliers_name"
            value={newDebt.suppliers_name}
            readOnly
            placeholder="Supplier"
            className="p-2 border rounded bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-white"
          />
          <input
            type="text"
            name="device_id"
            value={newDebt.device_id}
            readOnly
            placeholder="Product ID"
            className="p-2 border rounded bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-white"
          />

          <input
            type="number"
            name="quantity"
            min="1"
            step="1"
            placeholder="Qty"
            value={newDebt.quantity}
            onChange={handleNewChange}
            required
            className="p-2 border rounded dark:bg-gray-900 text-gray-800 dark:text-white"
          />
          <input
            type="number"
            name="amount_owed"
            placeholder="Amount Owed"
            step="0.01"
            value={newDebt.amount_owed}
            onChange={handleNewChange}
            required
            className="p-2 border rounded dark:bg-gray-900 text-gray-800 dark:text-white"
          />
          <input
            type="number"
            name="amount_deposited"
            placeholder="Amount Deposited"
            step="0.01"
            value={newDebt.amount_deposited}
            onChange={handleNewChange}
            required
            className="p-2 border rounded dark:bg-gray-900 text-gray-800 dark:text-white"
          />

          <button
            type="submit"
            className="col-span-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
          >
            {editingId ? 'Update Debt' : 'Create Debt'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto w-full">
        <table className="min-w-full table-auto bg-white shadow rounded whitespace-nowrap dark:bg-gray-900 text-gray-800 dark:text-white">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-900 text-gray-800 dark:text-indigo-600">
              <th className="p-2 text-left">Customer</th>
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">Supplier</th>
              <th className="p-2 text-left">Product ID</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Owed</th>
              <th className="p-2 text-right">Deposited</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {debts.map(d => (
              <tr key={d.id} className="border-t">
                <td className="p-2">{d.customer.fullname}</td>
                <td className="p-2">{d.dynamic_product.name}</td>
                <td className="p-2">{d.dynamic_product.suppliers_name}</td>
                <td className="p-2">{d.dynamic_product.device_id}</td>
                <td className="p-2 text-center">{d.quantity}</td>
                <td className="p-2 text-right">{d.amount_owed.toFixed(2)}</td>
                <td className="p-2 text-right">{d.amount_deposited.toFixed(2)}</td>
                <td className="p-2">{new Date(d.debt_date).toLocaleDateString()}</td>
                <td className="p-2 flex space-x-2 justify-center">
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
       
      </div>
     
    </div>
  );
}
