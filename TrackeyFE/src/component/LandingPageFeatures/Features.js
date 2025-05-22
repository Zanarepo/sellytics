import React from 'react';
import { FiBox, FiTrendingUp, FiDollarSign, FiUsers, FiBarChart2, FiFileText, FiRefreshCw, FiPrinter, FiTag, FiBookOpen, FiActivity, FiLayers } from 'react-icons/fi';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const iconVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.2, transition: { type: 'spring', stiffness: 300 } },
};

export default function FeaturesGrid() {
  const features = [
    { icon: <FiBox size={28} />, title: 'Live Stock Alerts', desc: 'Get instant notifications when stock runs low.' },
    { icon: <FiTrendingUp size={28} />, title: 'Daily Sales Overview', desc: 'See your sales numbers at a glance.' },
    { icon: <FiDollarSign size={28} />, title: 'Easy Expense Log', desc: 'Quickly record and categorize expenses.' },
    { icon: <FiUsers size={28} />, title: 'Customer Hub', desc: 'Store customer info and track interactions.' },
    { icon: <FiBarChart2 size={28} />, title: 'Insightful Reports', desc: 'Simple tables for smarter decisions.' },
    { icon: <FiFileText size={28} />, title: 'Download Reports', desc: 'Export data as CSV or PDF in one click.' },
    { icon: <FiRefreshCw size={28} />, title: 'Returns Tracker', desc: 'Manage returned items seamlessly.' },
    { icon: <FiPrinter size={28} />, title: 'Quick Receipts', desc: 'Generate customer receipts on the spot.' },
    { icon: <FiTag size={28} />, title: 'Dynamic Pricing', desc: 'Adjust prices on the go for any item.' },
    { icon: <FiBookOpen size={28} />, title: 'Debt Manager', desc: 'Keep tabs on loans and repayments.' },
    { icon: <FiActivity size={28} />, title: 'Outstanding Bills', desc: 'Monitor unpaid supplies and credits.' },
    { icon: <FiLayers size={28} />, title: 'Multi‑Store View', desc: 'Control all your shops from one dashboard.' },
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-indigo-50 to-indigo-200 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Wavy Top Border */}
      <svg className="absolute top-0 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path
          d="M0,0 C280,100 720,0 1440,100 L1440,0 Z"
          fill="url(#gradient)"
          className="dark:fill-gray-800"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#e0e7ff', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#c7d2fe', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>

      {/* Wavy Bottom Border */}
      <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path
          d="M0,100 C280,0 720,100 1440,0 L1440,100 Z"
          fill="url(#gradient)"
          className="dark:fill-gray-800"
        />
      </svg>

      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-indigo-900 dark:text-white mb-12 font-sans">
          All-in-One Business Toolkit
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg flex items-start space-x-4 hover:shadow-xl transition-transform duration-300"
              initial="hidden"
              animate="visible"
              custom={idx}
              variants={cardVariants}
              whileHover={{ scale: 1.05, translateY: -5 }}
            >
              <motion.div
                className="text-indigo-600 dark:text-indigo-400 mt-1"
                variants={iconVariants}
                initial="rest"
                whileHover="hover"
              >
                {f.icon}
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-indigo-900 dark:text-white font-sans">
                  {f.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300 font-medium font-sans">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}