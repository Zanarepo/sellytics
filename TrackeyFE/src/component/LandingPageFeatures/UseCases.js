import React from 'react';
import { FiTag, FiShuffle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, type: 'spring', stiffness: 100 } },
};

const iconVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.2, transition: { type: 'spring', stiffness: 300 } },
};

const exampleVariants = {
  rest: { y: 0 },
  hover: { y: -5, transition: { duration: 0.3 } },
};

export default function PricingUseCases() {
  const cases = [
    {
      icon: <FiTag size={40} />,
      title: 'Fixed Pricing',
      desc: 'Ideal for shops with fixed prices, like supermarkets or online stores, where rates remain consistent.',
      example: 'A supermarket selling a 50kg bag of rice at ₦5,000 daily with no price changes.',
      badge: 'Fixed Pricing',
    },
    {
      icon: <FiShuffle size={40} />,
      title: 'Negotiable Pricing',
      desc: 'Perfect for open-market vendors where prices vary based on demand, supply, or customer negotiations.',
      example: 'A Lagos phone vendor negotiating smartphone prices between ₦60,000–₦65,000 per customer.',
      badge: 'Dynamic Pricing',
    },
  ];

  return (
    <motion.section
      className="py-20 md:py-24 px-6 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      role="region"
      aria-labelledby="pricing-use-cases-title"
    >
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

      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.h2
          id="pricing-use-cases-title"
          className="text-3xl md:text-4xl font-extrabold text-center text-indigo-900 dark:text-white mb-12 font-sans relative before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700"
          variants={sectionVariants}
        >
          Pricing Models for Every Business
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {cases.map((item, idx) => (
            <motion.div
              key={idx}
              className="group relative bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 border-l-4 border-transparent group-hover:border-indigo-500 dark:group-hover:border-indigo-300"
              variants={cardVariants}
              whileHover={{ scale: 1.05, y: -10 }}
              aria-label={`${item.title} Pricing Use Case`}
            >
              {/* Hover Badge */}
              <span className="absolute top-4 right-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {item.badge}
              </span>
              <div className="flex items-center mb-4">
                <motion.div
                  className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-full group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors text-indigo-600 dark:text-indigo-400 hover:shadow-indigo-500/30"
                  variants={iconVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  {item.icon}
                </motion.div>
                <h3 className="ml-4 text-xl font-bold text-indigo-900 dark:text-white font-sans">
                  {item.title}
                </h3>
              </div>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 font-medium font-sans mb-6">
                {item.desc}
              </p>
              <motion.div
                className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6"
                variants={exampleVariants}
                initial="rest"
                whileHover="hover"
              >
                <span className="font-semibold text-gray-800 dark:text-gray-200">Example:</span>
                <p className="mt-2 text-base text-gray-600 dark:text-gray-300 italic font-sans">
                  {item.example}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}