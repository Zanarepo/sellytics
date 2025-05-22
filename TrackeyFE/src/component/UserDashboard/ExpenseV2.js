import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

const ExpenseManager = () => {
  const [form, setForm] = useState({ expense_date: '', expense_type: '', amount: '', description: '' });
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

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
      setFilteredExpenses(data);
    }
  }, [storeId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ expense_date: '', expense_type: '', amount: '', description: '' });
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

    const response = editingId
      ? await supabase.from('expense_tracker').update(payload).eq('id', editingId)
      : await supabase.from('expense_tracker').insert(payload);

    if (response.error) {
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

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    const filtered = expenses.filter(
      (expense) =>
        expense.expense_type.toLowerCase().includes(value) ||
        expense.description?.toLowerCase().includes(value)
    );
    setFilteredExpenses(filtered);
    setCurrentPage(1);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Date', 'Type', 'Amount', 'Description']],
      body: filteredExpenses.map((e) => [
        format(new Date(e.expense_date), 'PPP'),
        e.expense_type,
        `₦${e.amount}`,
        e.description || '',
      ]),
    });
    doc.save('expenses.pdf');
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredExpenses.map((e) => ({
        Date: format(new Date(e.expense_date), 'PPP'),
        Type: e.expense_type,
        Amount: e.amount,
        Description: e.description || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, 'expenses.xlsx');
  };

  const monthlyData = expenses.reduce((acc, curr) => {
    const month = format(parseISO(curr.expense_date), 'MMM yyyy');
    acc[month] = (acc[month] || 0) + Number(curr.amount);
    return acc;
  }, {});

  const monthlyChart = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount,
  }));

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Expense Manager</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded" onClick={() => {
          resetForm();
          setShowForm(!showForm);
        }}>
          {showForm ? 'Close Form' : 'Add Expense'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-4 space-y-4">
          {/* Form Inputs (unchanged) */}
          <input type="date" name="expense_date" value={form.expense_date} onChange={handleInputChange} required className="w-full border p-2" />
          <input type="text" name="expense_type" placeholder="Expense Type" value={form.expense_type} onChange={handleInputChange} required className="w-full border p-2" />
          <input type="number" name="amount" placeholder="Amount" value={form.amount} onChange={handleInputChange} required className="w-full border p-2" />
          <textarea name="description" placeholder="Description" value={form.description} onChange={handleInputChange} className="w-full border p-2" />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">{editingId ? 'Update Expense' : 'Add Expense'}</button>
        </form>
      )}

      {/* Search and Export */}
      <div className="flex flex-wrap gap-2 justify-between mb-2">
        <input type="text" placeholder="Search..." value={search} onChange={handleSearch} className="border p-2 w-full sm:w-auto" />
        <div className="space-x-2">
          <button onClick={exportPDF} className="bg-red-600 text-white px-3 py-1 rounded">Export PDF</button>
          <button onClick={exportExcel} className="bg-green-600 text-white px-3 py-1 rounded">Export Excel</button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Date</th>
              <th className="p-2">Type</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Description</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((expense) => (
              <tr key={expense.id} className="border-t">
                <td className="p-2">{format(new Date(expense.expense_date), 'PPP')}</td>
                <td className="p-2">{expense.expense_type}</td>
                <td className="p-2">₦{expense.amount}</td>
                <td className="p-2">{expense.description}</td>
                <td className="p-2 space-x-2">
                  <button className="text-indigo-600" onClick={() => handleEdit(expense)}>Edit</button>
                  {isOwner && <button className="text-red-600" onClick={() => handleDelete(expense.id)}>Delete</button>}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">No expenses found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p>Page {currentPage} of {totalPages}</p>
        <div className="space-x-2">
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded">Prev</button>
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded">Next</button>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Monthly Expenses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExpenseManager;
