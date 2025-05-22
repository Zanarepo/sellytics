import React, { useState } from 'react';
import DebtTracker from './DebtTracker';
import DebtHistory from './DebtHistory';
import { FaChartLine, FaHistory } from 'react-icons/fa';  // Icons for DebTracker and DebtHistory

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('debTracker');

  const renderContent = () => {
    switch (activeTab) {
      case 'debTracker':
        return <DebtTracker />;
      case 'debtHistory':
        return <DebtHistory />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <h1 className="text-3xl font-bold text-center text-indigo-800 dark:text-white mb-6">
        Dashboard
      </h1>
      
      {/* Icon Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setActiveTab('debTracker')}
            className={`flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300 
              ${activeTab === 'debTracker' ? 'border-2 border-indigo-500' : ''}`}
          >
            <FaChartLine className="text-4xl text-indigo-600 mb-2" />
            <span className="text-lg text-indigo-800 dark:text-white">Debt Tracker</span>
          </button>
          <button
            onClick={() => setActiveTab('debtHistory')}
            className={`flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300 
              ${activeTab === 'debtHistory' ? 'border-2 border-indigo-500' : ''}`}
          >
            <FaHistory className="text-4xl text-indigo-600 mb-2" />
            <span className="text-lg text-indigo-800 dark:text-white">Debt History</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
