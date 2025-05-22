// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import {
  FaRegMoneyBillAlt,
  FaMoneyCheckAlt,
  FaBoxes,
  FaChartLine,
  FaUsers,
  FaTasks,
  FaArrowLeft,
} from 'react-icons/fa';

import ExpenseTracker from './ExpenseTracker';
import DebtTracker from './DebtTracker';
import ProductList from './ProductList';
import SalesTracker from './SalesTracker';
import Customers from './Customers';
import Inventory from './Inventory';
import SimplexFeature from './SimplexFeature';
//import  SimplexDashboard  from '../Ops/SDashboard'; 
// In MainDashboard.js




//import SimplexFeature from './SimplexFeature';


const tools = [
  {
    key: 'sales',
    label: 'Sales Tracker',
    icon: <FaChartLine className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Analyze your sales performance.',
    component: <SalesTracker />,
  },
  {
    key: 'products',
    label: 'Produts & Pricing',
    icon: <FaBoxes className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Manage your product catalog.',
    component: <ProductList />,
  },
 
 






  {
    key: 'inventory',
    label: 'Manage Inventory (Stocks)',
    icon: <FaTasks className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Track stock levels.',
    component: <Inventory />,
  },
  {
    key: 'expense',
    label: 'Expense Tracker',
    icon: <FaRegMoneyBillAlt className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Monitor store expenses.',
    component: <ExpenseTracker />,
  },
  {
    key: 'debts',
    label: 'Debts Manager',
    icon: <FaMoneyCheckAlt className="text-5xl sm:text-6xl text-indigo-600 p-1" />,
    desc: 'Track customer debts.',
    component: <DebtTracker />,
  },
  {
    key: 'customers',
    label: 'Customers Manager',
    icon: <FaUsers className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Manage your customers.',
    component: <Customers />,
  },
];

export default function Dashboard() {
  const [shopName, setShopName] = useState('Store Owner');
  const [activeTool, setActiveTool] = useState(null);

  useEffect(() => {
    const storeId = localStorage.getItem('store_id');
    if (!storeId) return;
    supabase
      .from('stores')
      .select('shop_name')
      .eq('id', storeId)
      .single()
      .then(({ data }) => {
        if (data?.shop_name) setShopName(data.shop_name);
      });
  }, []);

  const tool = tools.find(t => t.key === activeTool);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-0">
      {/* Simplex Feature */}
    
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-800 dark:text-white">
          Welcome {shopName}!
        </h1>

        <div className="mb-6">
        <SimplexFeature />
      </div>
        {!activeTool && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Select a tool below.
          </p>
        )}
      </header>

      {/* Back & Tool Info */}
      {activeTool && (
        <div className="mb-6">
          <button
            onClick={() => setActiveTool(null)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-700 dark:text-indigo-200">
            {tool.label}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{tool.desc}</p>
        </div>
      )}

      {/* Content */}
      {activeTool ? (
        <div>{tool.component}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tools.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTool(t.key)}
              className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow hover:shadow-lg transition h-48"
            >
              {t.icon}
              <span className="mt-3 text-sm sm:text-base font-medium text-indigo-800 dark:text-white">
                {t.label}
              </span>
              <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                {t.desc}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
