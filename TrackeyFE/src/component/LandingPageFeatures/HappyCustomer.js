import React from 'react';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } },
};

const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, type: 'spring', stiffness: 100 } },
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.1, transition: { type: 'spring', stiffness: 300 } },
};

export default function CustomerStoryComponent() {
  return (
    <motion.section
      className="py-20 md:py-24 px-6 md:px-20 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden"
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
        <div className="text-center mb-12 space-y-4">
          <motion.h2
            className="text-3xl md:text-4xl font-extrabold text-indigo-900 dark:text-white font-sans relative before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700"
            variants={headerVariants}
          >
            From Frustration to Freedom: A Sellytics Success Story
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 font-medium font-sans max-w-3xl mx-auto"
            variants={headerVariants}
          >
            Meet Sarah, a small business owner who struggled with manual inventory records until Sellytics transformed her workflow.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Story Section */}
          <motion.div
            className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg p-8 border-t-4 border-indigo-500"
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <h3 className="text-2xl font-bold text-indigo-900 dark:text-white mb-4">
              Sarah's Journey
            </h3>
            <p className="text-base text-gray-600 dark:text-gray-300 mb-4">
              Before Sellytics: Sarah ran a busy wholesale supply business, but tracking inventory manually was draining. Hours were lost to spreadsheets, sales mistakes, and stock confusion. </p>
            <p className="text-base text-gray-600 dark:text-gray-300 mb-4">
              After Sellytics: With real-time inventory and automated sales tracking, Sarah cut hours of admin down to minutes — and finally had time to grow her business. </p>
            <p className="text-base text-gray-600 dark:text-gray-300 italic">
              “Sellytics gave me back my evenings. Now I focus on growth, not spreadsheets.” — Sarah </p> <br/>
         
            {/* Call to Action Button */}
            <motion.a
              href="/register"
              className="inline-block w-full text-center bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white py-3 px-4 rounded-xl font-medium hover:shadow-indigo-500/30 transition-all duration-300"
              variants={buttonVariants}
              initial="rest"
              whileHover="hover"
              aria-label="Be like Sarah, let Sellytics handle your stress"
            >
              Be like Sarah, let Sellytics take away your stress, Today!!!
            </motion.a> 
          </motion.div>

          {/* Placeholder Image */}
          <motion.div
            className="flex justify-center"
            variants={cardVariants}
            whileHover={{ scale: 1.05 }}
          >
            <img
              src="images/HappyCustomer.png"
              alt="Sarah using Sellytics to manage her inventory"
              className="rounded-2xl shadow-lg max-w-full h-auto"
            />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}