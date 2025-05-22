// Dashboard.jsx
import React, { useState } from 'react';

import {  FaChartBar, FaArrowLeft } from 'react-icons/fa';
import WhatsAppChatPopup from '../UserDashboard/WhatsAppChatPopup';
//import ExpenseSummary from '../UserDashboard/ExpenseSummary';
//import ProductCost from '../UserDashboard/ProductCost';
import VsalesSummary from '../Ops/VsalesSummary';


export default function Dashboard() {
  const [view, setView] = useState(null); // null | 'productCost' | 'salesMetrics'

  // Card definitions
  const cards = [

    {
      key: 'salesMetrics',
      label: 'Sales Metrics',
      icon: <FaChartBar className="text-4xl text-indigo-600" />,
      component: <VsalesSummary />,
    },

  {/* 

    {
      key: 'productCost',
      label: 'Product Cost',
      icon: <FaDollarSign className="text-4xl text-indigo-600" />,
      component: <ProductCost />,
    },
   
  
    {
      key: 'expenseMetrics',
      label: 'Expense Metrics',
      icon: <FaChartBar className="text-4xl text-indigo-600" />,
      component: <ExpenseSummary />,
    },

    */}
  ];

  // If a view is selected, show its content + back button
  if (view) {
    const card = cards.find(c => c.key === view);
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <button
          onClick={() => setView(null)}
          className="flex items-center mb-4 text-indigo-600 hover:text-indigo-800"
        >
          <FaArrowLeft className="mr-2" /> Back to Dashboard
        </button>
        <h2 className="text-2xl font-semibold text-indigo-800 dark:text-white mb-2">
          {card.title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {/* Optional brief description */}
          {card.label} lets you {card.label === 'Product Cost'
            ? 'track and manage your purchase prices.'
            : 'analyze and visualize your sales performance.'}
        </p>
        <div className="bg-white dark:bg-gray-900 p-1 rounded-lg">
          {card.component}
        </div>
      </div>
    );
  }

  // Otherwise show the icon grid
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <WhatsAppChatPopup /> {/* WhatsApp chat popup */}
      
      {/* Header */}
      <h1 className="text-center text-2xl sm:text-3xl font-bold text-indigo-800 dark:text-white mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
        {cards.map(c => (
          <button
            key={c.key}
            onClick={() => setView(c.key)}
            className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-6 rounded-lg hover:shadow-lg transition"
          >
            {c.icon}
            <span className="mt-4 text-lg font-medium text-indigo-800 dark:text-white">
              {c.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
