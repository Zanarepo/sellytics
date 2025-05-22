import React, { useState } from 'react';
import ExpenseTracker from './ExpenseTracker';
import DebtTracker from './DebtTracker';
import ProductList from './ProductList';
import SalesTracker from './SalesTracker';
import Customers from './Customers';
import Inventory from './Inventory';
import { FaRegMoneyBillAlt, FaMoneyCheckAlt, FaBoxes, FaChartLine, FaUsers , FaTasks } from 'react-icons/fa';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('sales');

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <>
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Products</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage your product catalog...track your inventory and sales.
            </p>
            <ProductList />
          </>
        );
      case 'sales':
        return (
          <>
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Sales</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Analyze your sales performance...grow your business with data-driven insights.
            </p>
            <SalesTracker />
          </>
        );
      case 'Inventory':
        return (
          <>
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Inventory</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage your inventory...track stock levels and product availability.
            </p>
            <Inventory />
          </>
        );
      case 'expense':
        return (
          <>
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Expenses</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Track and manage all your store expenses...make informed financial decisions.
            </p>
            <ExpenseTracker />
          </>
        );
      case 'debt':
        return (
          <>
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Debts</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Monitor customer debts...track payments and outstanding balances.
            </p>
            <DebtTracker />
          </>
        );
      case 'customers':
        return (
          <>
            <h2 className="text-2xl font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Customers</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage your customer base...grow relationships and improve service.
            </p>
            <Customers />
          </>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { key: 'sales',     label: 'Sales',     icon: <FaChartLine className="text-4xl text-indigo-600 mb-2" /> },
    { key: 'products',  label: 'Products',  icon: <FaBoxes className="text-4xl text-indigo-600 mb-2" /> },
    { key: 'Inventory', label: 'Inventory', icon: <FaTasks className="text-4xl text-indigo-600 mb-2" /> },
    { key: 'expense',   label: 'Expenses',  icon: <FaRegMoneyBillAlt className="text-4xl text-indigo-600 mb-2" /> },
    { key: 'debt',      label: 'Debts',     icon: <FaMoneyCheckAlt className="text-4xl text-indigo-600 mb-2" /> },
    { key: 'customers', label: 'Customers', icon: <FaUsers className="text-4xl text-indigo-600 mb-2" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-indigo-800 dark:text-white my-4">
        Keep Records and Organize all your Finances
      </h1>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-4">
        <div className="flex flex-wrap gap-3 justify-center w-full px-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center flex-1 min-w-[100px] p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition
                ${activeTab === tab.key ? 'border-2 border-indigo-500' : ''}`}
            >
              {tab.icon}
              <span className="text-sm sm:text-base text-indigo-800 dark:text-white">
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area (no background or extra padding) */}
      <div className="w-full px-2 sm:px-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
