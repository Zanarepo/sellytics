// DynamicDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
 
import {
  FaRegMoneyBillAlt,
  FaMoneyCheckAlt,
  FaBoxes,
  FaChartLine,
  //FaUsers,
  FaTasks,
  FaArrowLeft,
  FaReceipt,
  FaUndoAlt,
  FaBoxOpen,
  FaSearch


} from 'react-icons/fa';

import DynamicInventory from '../DynamicSales/DynamicInventory';
import DynamicProducts  from '../DynamicSales/DynamicProducts';
import DynamicSales     from '../DynamicSales/DynamicSales';
import ExpenseTracker   from './ExpenseTracker';
//import DynamicDebtTracker      from '../VariexContents/DynamicDebtTracker';
//import Customers        from './Customers';
//import VariexFeature  from '../DynamicSales/VariexFeature';
import Receipts from '../VariexContents/Receipts'
import ReturnedItems from '../VariexContents/ReturnedItems'
import DebtTracker from './DebtTracker'
import Unpaidsupplies from '../UserDashboard/Unpaidsupplies'
import Suppliers from '../Ops/Suppliers'

const tools = [
  {
    key: 'sales',
    label: 'Sales Tracker',
    icon: <FaChartLine className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Analyze your sales performance.',
    component: <DynamicSales />,
  },
  {
    key: 'products',
    label: 'Products & Pricing',
    icon: <FaBoxes className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Manage your product catalog.',
    component: <DynamicProducts />,
  },
  {
    key: 'inventory',
    label: 'Manage Inventory (Stocks)',
    icon: <FaTasks className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Track stock levels.',
    component: <DynamicInventory />,
  },

  {
    key: 'receipts',
    label: 'Sales Receipts',
    icon: <FaReceipt className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Monitor store expenses.',
    component: <Receipts />,
  },


  {
    key: 'returns',
    label: ' Returned Items Tracker',
    icon: < FaUndoAlt className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Track returned items from customers.',
    component: <ReturnedItems/>,
  },


  {
    key: 'expenses',
    label: 'Expenses Tracker',
    icon: <FaRegMoneyBillAlt className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Monitor store expenses.',
    component: <ExpenseTracker />,
  },

  {
    key: 'unpaid supplies',
    label: 'Unpaid Supplies',
    icon: <FaBoxOpen className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Track unpaid supplies.',
    component: <Unpaidsupplies />,
  },



  {
    key: 'Product Search',
    label: 'Product Search',
    icon: <FaSearch className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Track Products and Suppliers.',
    component: <Suppliers />,
  },

  




  {
    key: 'debts',
    label: 'Debtors',
    icon: <FaMoneyCheckAlt className="text-5xl sm:text-6xl text-indigo-600" />,
    desc: 'Track debtors.',
    component: <DebtTracker/>,
  },


];

export default function DynamicDashboard() {
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
      .then(({ data, error }) => {
        if (!error && data?.shop_name) {
          setShopName(data.shop_name);
        }
      });
  }, []);

  const tool = tools.find(t => t.key === activeTool);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-0">
  
      <header className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-800 dark:text-white">
          Welcome, {shopName}!
        </h1>

            
<div className="mb-6">
   
      </div>
      
        {!activeTool && (
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Choose a tool to continue.
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

      {/* Grid or Content */}
      {activeTool ? (
        <div className="w-full">
          {tool.component}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tools.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTool(t.key)}
              className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-6 rounded-xl shadow hover:shadow-lg transition h-48"
            >
              {t.icon}
              <span className="mt-3 text-sm sm:text-base font-medium text-indigo-800 dark:text-white">
                {t.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
