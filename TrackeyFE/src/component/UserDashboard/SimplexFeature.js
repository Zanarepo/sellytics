// SimplexInfo.js
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

const SimplexInfo = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const lastShown = localStorage.getItem("simplexInfoShown");
    const today = new Date().toDateString();

    if (lastShown !== today) {
      setShowPopup(true);
      localStorage.setItem("simplexInfoShown", today);
    }
  }, []);

  if (!showPopup) return null;

  return (
    <motion.div
      className="fixed bottom-4 right-4 max-w-md bg-white dark:bg-gray-900 shadow-lg p-4 rounded-lg z-50 border border-gray-300"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Info className="text-indigo-600" />
          <h3 className="font-bold text-lg text-gray-800 dark:text-white">Simplex Dashboard</h3>
        </div>
        <button
          onClick={() => setShowPopup(false)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-white"
        >
          &times;
        </button>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        This dashboard is designed for businesses with stable, non-volatile pricing and inventory. Use Simplex if your products rarely change in price and are not subject to negotiation.
      </p>
    </motion.div>
  );
};

export default SimplexInfo;
