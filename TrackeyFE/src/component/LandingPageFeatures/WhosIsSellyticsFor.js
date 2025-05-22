import React from 'react';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, type: 'spring', stiffness: 100 } },
};

const textVariants = {
  rest: { y: 0 },
  hover: { y: -5, transition: { duration: 0.3 } },
};

export default function WhoIsSellyticsFor() {
  const audiences = [
    {
      title: 'Open Market Operations',
      description: 'Tailored for dynamic market stalls, pop-up shops, and vendors thriving on flexible, negotiated pricing.',
      imageUrl: 'images/market.jpg',
      badge: 'Market',
      alt: 'Open market stall environment',
    },
    {
      title: 'Corporate Operations',
      description: 'Built for structured retail like supermarkets and chain stores, streamlining inventory and sales with fixed pricing.',
      imageUrl: 'images/Office.jpg',
      badge: 'Corporate',
      alt: 'Corporate retail store environment',
    },
    {
      title: 'Business Entrepreneurs',
      description: 'Ideal for entrepreneurs like Emeka, managing multiple shops on the go with real-time mobile monitoring.',
      imageUrl: 'images/Emeka.jpg',
      badge: 'Entrepreneur',
      alt: 'Entrepreneur managing multiple shops',
    },
  ];

  return (
    <motion.section
      className="py-20 md:py-24 px-6 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      role="region"
      aria-labelledby="who-is-sellytics-for-title"
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

      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.h2
          id="who-is-sellytics-for-title"
          className="text-3xl md:text-4xl font-extrabold text-center text-indigo-900 dark:text-white mb-12 font-sans relative before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700"
          variants={sectionVariants}
        >
          Who Thrives with Sellytics?
        </motion.h2>
        <div className="flex flex-col gap-16">
          {audiences.map((item, idx) => (
            <motion.div
              key={idx}
              className="group relative bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 border-l-4 border-transparent group-hover:border-indigo-500 dark:group-hover:border-indigo-300"
              variants={cardVariants}
              whileHover={{ scale: 1.05, y: -10 }}
              aria-label={`${item.title} Audience`}
            >
              {/* Hover Badge */}
              <span className="absolute top-4 right-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {item.badge}
              </span>
              <div
                className={`flex flex-col-reverse md:flex-row ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''} items-center gap-8`}
              >
                <motion.div
                  className="md:w-1/2 text-left space-y-4"
                  variants={textVariants}
                  initial="rest"
                  whileHover="hover"
                >
                  <h3 className="text-xl md:text-2xl font-bold text-indigo-900 dark:text-white font-sans">
                    {item.title}
                  </h3>
                  <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 font-medium font-sans leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
                <div className="md:w-1/2 w-full h-auto max-h-[400px] relative">
                  <img
                    src={item.imageUrl}
                    alt={item.alt}
                    className="object-cover w-full h-full rounded-xl shadow-lg group-hover:scale-105 transition-all duration-300"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="url(%23gradient)" /%3E%3Cdefs%3E%3ClinearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%"%3E%3Cstop offset="0%" style="stop-color:%23e0e7ff;stop-opacity:1" /%3E%3Cstop offset="100%" style="stop-color:%23c7d2fe;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E';
                    }}
                  />
                  <div className="absolute inset-0 bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}