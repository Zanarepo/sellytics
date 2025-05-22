import React from 'react';
import { FiUserPlus, FiBox, FiPrinter, FiBarChart2 } from 'react-icons/fi';
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

export default function HowItWorks() {
  const steps = [
    {
      icon: <FiUserPlus size={40} />,
      title: 'Sign Up & Create Store',
      desc: 'Quickly register and set up your electronics store in minutes.',
      ariaLabel: 'Step 1: Sign Up & Create Store',
    },
    {
      icon: <FiBox size={40} />,
      title: 'Add Products',
      desc: 'List your phones, laptops, and electronics with quantities and pricing.',
      ariaLabel: 'Step 2: Add Products',
    },
    {
      icon: <FiPrinter size={40} />,
      title: 'Record Sales & Track Stock',
      desc: 'Instantly log sales, monitor inventory levels, and manage returns.',
      ariaLabel: 'Step 3: Record Sales & Track Stock',
    },
    {
      icon: <FiBarChart2 size={40} />,
      title: 'Get Insights Instantly',
      desc: 'View easy-to-read tables of stock, sales, and expenses for smarter decisions.',
      ariaLabel: 'Step 4: Get Insights Instantly',
    },
  ];

  return (
    <motion.section
      id="how-it-works"
      className="py-20 md:py-16 px-6 md:px-20 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
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

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.h2
          className="text-3xl md:text-4xl font-extrabold text-center text-indigo-900 dark:text-white mb-12 font-sans relative before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700"
          variants={sectionVariants}
        >
          How It Works
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="flex flex-col items-center text-center p-2 bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 hover:bg-gradient-to-r hover:from-indigo-100/80 hover:to-indigo-200/80 transition-all duration-300 space-y-4"
              variants={cardVariants}
              whileHover={{ scale: 1.05, y: -10 }}
              aria-label={step.ariaLabel}
            >
              <motion.div
                className="text-indigo-600 dark:text-indigo-400 mb-4 hover:shadow-indigo-500/30 rounded-full p-2"
                variants={iconVariants}
                initial="rest"
                whileHover="hover"
              >
                {step.icon}
              </motion.div>
              <h3 className="text-xl font-bold text-indigo-900 dark:text-white mb-3 font-sans">
                {step.title}
              </h3>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 font-medium font-sans">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}