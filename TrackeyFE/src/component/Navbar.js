import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';
import { motion } from 'framer-motion';
import { FaBars } from 'react-icons/fa';

const navVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const linkVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.1 } },
};


const mobileMenuVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, type: 'spring', stiffness: 100 } },
};

const mobileLinkVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const scrollItems = [
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'use-cases', label: 'Use Cases' },
    { id: 'who-is-it-for', label: 'Who It’s For' },
    { id: 'faq', label: 'CAQ' },
    // { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 w-full z-50 bg-white/70 dark:bg-gray-800/80 backdrop-blur-md shadow-md hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300"
        initial="hidden"
        animate="visible"
        variants={navVariants}
        role="navigation"
        aria-label="Main Navigation"
      >
        <div className="flex items-center justify-between px-6 md:px-8 h-20">
          {/* Logo Section */}
          <div className="flex items-center">
            <RouterLink to="/" aria-label="Sellytics Home">
              <motion.img
                src="/Sellytics.jpg"
                alt="Sellytics Logo"
                className="h-16 md:h-20 w-auto"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
            </RouterLink>
          </div>

          {/* Desktop Navigation */}
          <motion.div
            className="hidden md:flex items-center space-x-8 text-gray-700 dark:text-gray-300 font-sans"
            variants={linkVariants}
            initial="hidden"
            animate="visible"
          >
            {scrollItems.map(({ id, label }) => (
              <ScrollLink
                key={id}
                to={id}
                smooth={true}
                duration={500}
                offset={-80}
                spy={true}
                activeClass="text-indigo-700 dark:text-indigo-300 relative before:absolute before:bottom-[-4px] before:left-0 before:w-full before:h-0.5 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700"
                className="cursor-pointer text-base font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 relative"
                aria-label={`Navigate to ${label}`}
                aria-current={undefined}
              >
                {label}
              </ScrollLink>
            ))}
            <RouterLink
              to="/register"
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white font-medium px-4 py-2 rounded-xl hover:shadow-indigo-500/30 transition-all duration-300"
              aria-label="Start for Free"
            >
              Start for Free
            </RouterLink>
            <RouterLink
              to="/login"
              className="border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-medium px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-indigo-500 hover:to-indigo-600 hover:text-white dark:hover:text-white transition-all duration-300"
              aria-label="Login"
            >
              Login
            </RouterLink>
          </motion.div>

          {/* Hamburger Icon */}
          <motion.button
            onClick={toggleMenu}
            className="md:hidden focus:outline-none"
            whileTap={{ scale: 0.9 }}
            animate={{ rotate: isMenuOpen ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            aria-label="Toggle Menu"
            aria-expanded={isMenuOpen}
          >
            <FaBars className="w-8 h-8 text-indigo-800 dark:text-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200" />
          </motion.button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <motion.div
            className="md:hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-indigo-800 dark:text-indigo-300 p-4 pt-6 rounded-b-2xl shadow-lg relative z-50"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex flex-col space-y-4">
              {scrollItems.map(({ id, label }) => (
                <motion.div key={id} variants={mobileLinkVariants}>
                  <ScrollLink
                    to={id}
                    smooth={true}
                    duration={500}
                    offset={-80}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-lg font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-all duration-200 relative before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-indigo-600 before:transition-all before:duration-300 hover:before:w-full"
                    aria-label={`Navigate to ${label}`}
                  >
                    {label}
                  </ScrollLink>
                </motion.div>
              ))}
              <motion.div variants={mobileLinkVariants}>
                <RouterLink
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-lg font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-all duration-200 relative before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-indigo-600 before:transition-all before:duration-300 hover:before:w-full"
                  aria-label="Start for Free"
                >
                  Start for Free
                </RouterLink>
              </motion.div>
              <motion.div variants={mobileLinkVariants}>
                <RouterLink
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 text-lg font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-all duration-200 relative before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5 before:bg-indigo-600 before:transition-all before:duration-300 hover:before:w-full"
                  aria-label="Login"
                >
                  Login
                </RouterLink>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Wavy Bottom Border */}
      <div className="fixed top-[80px] left-0 w-full z-[-1]">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full absolute">
          <path
            d="M0,60 C280,0 720,60 1440,0 L1440,60 Z"
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
      </div>
    </>
  );
};

export default Navbar;