import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { FaPlus } from 'react-icons/fa';

const ITEMS_PER_PAGE = 5;

const ExpenseManager = () => {
  const [form, setForm] = useState({
    expense_date: '',
    expense_type: '',
    amount: '',
    description: '',
  });
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const storeId = Number(localStorage.getItem('store_id'));
  const userId = localStorage.getItem('user_id');
  const isOwner = !userId;

  const fetchExpenses = useCallback(async () => {
    const { data, error } = await supabase
      .from('expense_tracker')
      .select('*')
      .eq('store_id', storeId)
      .order('expense_date', { ascending: false });

    if (error) {
      toast.error('Failed to fetch expenses');
    } else {
      setExpenses(data);
    }
  }, [storeId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    const filtered = expenses.filter(
      (expense) =>
        expense.expense_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.description && expense.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredExpenses(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, expenses]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      expense_date: '',
      expense_type: '',
      amount: '',
      description: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.expense_date || !form.expense_type || !form.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      store_id: storeId,
      expense_date: form.expense_date,
      expense_type: form.expense_type,
      amount: Number(form.amount),
      description: form.description || null,
      created_by_user: isOwner ? null : Number(userId),
      created_by_owner: isOwner ? storeId : null,
    };

    let response;
    if (editingId) {
      response = await supabase.from('expense_tracker').update(payload).eq('id', editingId);
    } else {
      response = await supabase.from('expense_tracker').insert(payload);
    }

    const { error } = response;
    if (error) {
      toast.error('Error saving expense');
      return;
    }

    toast.success(`Expense ${editingId ? 'updated' : 'added'} successfully`);
    resetForm();
    setShowForm(false);
    fetchExpenses();
  };

  const handleEdit = (expense) => {
    setForm({
      expense_date: format(new Date(expense.expense_date), 'yyyy-MM-dd'),
      expense_type: expense.expense_type,
      amount: expense.amount,
      description: expense.description || '',
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!isOwner) {
      toast.error('Only the store owner can delete expenses');
      return;
    }

    const { error } = await supabase.from('expense_tracker').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete expense');
      return;
    }

    toast.success('Expense deleted');
    fetchExpenses();
  };

  // Pagination helpers
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-1 sm:p-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
     <div className="mb-6 text-center">
  <h1 className="text-2xl font-bold dark:bg-gray-900 dark:text-white">
    Expense Dashboard
  </h1>
</div>

<div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
  
  <button
    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
    onClick={() => {
      resetForm();
      setShowForm(!showForm);
    }}
  >
    <FaPlus className="text-sm" />
    {showForm ? 'Close Form' : 'Expense'}
  </button>
</div>

      <input
        type="text"
        placeholder="Search by type or description"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded shadow mb-4 space-y-4 dark:bg-gray-900 dark:text-white"
        >
          <div>
            <label className="block font-medium">Date</label>
            <input
              type="date"
              name="expense_date"
              value={form.expense_date}
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full dark:bg-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Expense Type</label>
            <input
              type="text"
              name="expense_type"
              placeholder="e.g., Rent, Utilities"
              value={form.expense_type}
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full dark:bg-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Amount</label>
            <input
              type="number"
              name="amount"
              placeholder="0.00"
              value={form.amount}
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full dark:bg-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Description</label>
            <textarea
              name="description"
              placeholder="Optional description"
              value={form.description}
              onChange={handleInputChange}
              className="border rounded px-3 py-2 w-full dark:bg-gray-900 dark:text-white"
            />
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
            {editingId ? 'Update Expense' : 'Add Expense'}
          </button>
        </form>
      )}

<div className="overflow-x-auto w-full">
  <table className="min-w-full table-auto border-collapse dark:bg-gray-900 dark:text-white">
    <thead>
      <tr className="bg-gray-200 text-indigo-500 dark:bg-gray-900 dark:text-indigo-600 text-left text-sm sm:text-base">
        <th className="p-3 min-w-[120px]">Date</th>
        <th className="p-3 min-w-[100px]">Type</th>
        <th className="p-3 min-w-[100px]">Amount</th>
        <th className="p-3 min-w-[150px]">Descr.</th>
        <th className="p-3 min-w-[100px]">Actions</th>
      </tr>
    </thead>
    <tbody>
      {paginatedExpenses.map((expense) => (
        <tr key={expense.id} className="border-t text-sm sm:text-base">
          <td className="p-3">{format(new Date(expense.expense_date), 'PPP')}</td>
          <td className="p-3">{expense.expense_type}</td>
          <td className="p-3">₦{expense.amount}</td>
          <td className="p-3">{expense.description}</td>
          <td className="p-3 space-x-2">
            <button
              className="text-indigo-600 hover:underline"
              onClick={() => handleEdit(expense)}
            >
              Edit
            </button>
            {isOwner && (
              <button
                className="text-red-600 hover:underline"
                onClick={() => handleDelete(expense.id)}
              >
                Delete
              </button>
            )}
          </td>
        </tr>
            ))}
            {paginatedExpenses.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No expenses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center mt-4 space-x-2">
        <button
          className="px-3 py-1 border rounded dark:bg-gray-900 dark:text-white"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <span className="px-3 py-1 dark:bg-gray-900 dark:text-white">{`Page ${currentPage} of ${totalPages}`}</span>
        <button
          className="px-3 py-1 border rounded dark:bg-gray-900 dark:text-white"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ExpenseManager;
