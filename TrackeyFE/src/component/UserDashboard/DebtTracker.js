// DebtTracker.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-toastify';
import DebtHistory from './DebtHistory';


export default function DebtTracker() {
  const store_id = Number(localStorage.getItem('store_id'));

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [newDebt, setNewDebt] = useState({
    customer_id: '',
    product_id: '',
    amount_owed: ''
  });

  const [, setDebts] = useState([]);
  const [,] = useState({});
  const [,] = useState('');
  const [,] = useState(1);

  const fetchCustomers = useCallback(async () => {
    const { data, error } = await supabase
      .from('customer')
      .select('id,fullname')
      .eq('store_id', store_id)
      .order('fullname');
    if (error) toast.error('Failed to load customers');
    else setCustomers(data);
  }, [store_id]);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id,name')
      .eq('store_id', store_id)
      .order('name');
    if (error) toast.error('Failed to load products');
    else setProducts(data);
  }, [store_id]);

  const fetchDebts = useCallback(async () => {
    const { data, error } = await supabase
      .from('debt_tracker')
      .select(`
        id,
        customer_id,
        product_id,
        amount_owed,
        amount_deposited,
        debt_date,
        store_id,
        customer:customer_id(fullname),
        product:product_id(name)
      `)
      .eq('store_id', store_id)
      .order('amount_remaining', { ascending: false });
    if (error) toast.error('Failed to load debts');
    else setDebts(data || []);
  }, [store_id]);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchDebts();
  }, [fetchCustomers, fetchProducts, fetchDebts]);

  const handleNewChange = e => {
    setNewDebt(d => ({ ...d, [e.target.name]: e.target.value }));
  };
  const handleAddDebt = async e => {
    e.preventDefault();
    const payload = {
      store_id,
      customer_id: Number(newDebt.customer_id),
      product_id: newDebt.product_id ? Number(newDebt.product_id) : null,
      amount_owed: parseFloat(newDebt.amount_owed),
      amount_deposited: 0,
      debt_date: new Date().toISOString(),
      created_by_owner: store_id,
      created_by_user: null
    };
    const { error } = await supabase.from('debt_tracker').insert([payload]);
    if (error) toast.error(error.message);
    else {
      toast.success('Debt added');
      setNewDebt({ customer_id:'', product_id:'', amount_owed:'' });
      fetchDebts();
    }
  };




  return (
    <div className="max-w-4xl mx-auto p-0 space-y-6">
      <h2 className="text-xl font-bold dark:bg-gray-900 dark:text-white">Add New Debt</h2>
      <form
        onSubmit={handleAddDebt}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-0 rounded dark:bg-gray-900 dark:text-white"
      >
        <select
          name="customer_id"
          value={newDebt.customer_id}
          onChange={handleNewChange}
          required
          className="p-2 border rounded dark:bg-gray-900 dark:text-white"
        >
          <option value="">Select Customer</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.fullname}</option>
          ))}
        </select>

        <select
          name="product_id"
          value={newDebt.product_id}
          onChange={handleNewChange}
          className="p-2 border rounded dark:bg-gray-900 dark:text-white"
        >
          <option value="">Select Product </option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <input
          type="number"
          name="amount_owed"
          placeholder="Amount Owed"
          step="0.01"
          value={newDebt.amount_owed}
          onChange={handleNewChange}
          required
          className="p-2 border rounded dark:bg-gray-900 dark:text-white"
        />

        <button
          type="submit"
          className="col-span-full sm:col-span-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Add Debt
        </button>
      </form>

         

   
      <DebtHistory key={Date.now()} />
    </div>
  );
}
