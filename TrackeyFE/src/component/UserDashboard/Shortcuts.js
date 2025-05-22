import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBox, FiFileText, FiPackage } from 'react-icons/fi';

export default function DashboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts = [
    { icon: <FiBox />,      label: 'Inventory', to: '/inventory' },
    { icon: <FiFileText />,  label: 'Receipts',  to: '/receipts' },
    { icon: <FiPackage />,   label: 'Products',  to: '/products' },
  ];

  return (
    <div className="fixed top-4 right-4 flex space-x-2 z-50 mt-36">
      {shortcuts.map(({ icon, label, to }) => (
        <button
          key={label}
          onClick={() => navigate(to)}
          title={label}
          className="bg-white dark:bg-gray-800 p-2 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <span className="text-gray-600 dark:text-gray-200 text-xl sm:text-2xl">
            {icon}
          </span>
        </button>
      ))}
    </div>
  );
}
