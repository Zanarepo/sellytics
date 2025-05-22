import React from "react";
import { Outlet } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import { motion } from "framer-motion";
import { FaLinkedin, FaTwitter, FaEnvelope, FaPhone } from "react-icons/fa";

const footerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const iconVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.2, transition: { type: "spring", stiffness: 300 } },
};

const Footer = () => {
  const quickLinks = [
    { id: "features", label: "Features", to: "features", type: "scroll" },
    { id: "how-it-works", label: "How It Works", to: "how-it-works", type: "scroll" },
    { id: "pricing", label: "Pricing", to: "pricing", type: "scroll" },
    { id: "use-cases", label: "Use Cases", to: "use-cases", type: "scroll" },
    { id: "who-is-it-for", label: "Who It’s For", to: "who-is-it-for", type: "scroll" },
    { id: "faq", label: "FAQ", to: "faq", type: "scroll" },
    { id: "register", label: "Start for Free", to: "/register", type: "router" },
    { id: "login", label: "Login", to: "/login", type: "router" },
  ];

  const products = [
    "Live Stock Alerts",
    "Daily Sales Overview",
    "Customer Hub",
    "Insightful Reports",
    "Returns Tracker",
    "Quick Receipts",
    "Dynamic Pricing",
    "Debt Manager",
    "Outstanding Bills",
    "Multi-Store View",
  ];

  const quickLinksFirstColumn = quickLinks.slice(0, 4);
  const quickLinksSecondColumn = quickLinks.slice(4);

  const productsFirstColumn = products.slice(0, 5);
  const productsSecondColumn = products.slice(5);

  const socialLinks = [
    {
      href: "https://www.linkedin.com/company/sprintifyhq/",
      icon: <FaLinkedin size={24} />,
      label: "LinkedIn",
    },
    { href: "https://x.com/sprintifyhq", icon: <FaTwitter size={24} />, label: "X" },
    {
      href: "mailto:sellytics@sprintifyhq.com",
      icon: <FaEnvelope size={24} />,
      label: "Email",
    },
    { href: "tel:+2347088347620", icon: <FaPhone size={24} />, label: "Phone" },
  ];

  return (
    <motion.footer
      className="bg-indigo-800 dark:bg-gray-900 text-white py-12 w-full relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={footerVariants}
    >
      <svg
        className="absolute top-0 w-full"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
      >
        <path
          d="M0,60 C280,0 720,60 1440,0 L1440,60 Z"
          fill="url(#gradient)"
          className="dark:fill-gray-800"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#e0e7ff", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#c7d2fe", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>

      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <motion.div variants={sectionVariants} className="flex flex-col items-center mt-2">
            <h3 className="text-lg font-bold text-white mb-4 font-sans text-center">
              Quick Links
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
              <ul className="space-y-2">
                {quickLinksFirstColumn.map(({ id, label, to, type }) => (
                  <li key={id}>
                    {type === "scroll" ? (
                      <ScrollLink
                        to={to}
                        smooth={true}
                        duration={500}
                        offset={-80}
                        className="text-gray-300 hover:text-indigo-400 text-sm font-medium transition-colors duration-200 cursor-pointer"
                        aria-label={`Navigate to ${label}`}
                      >
                        {label}
                      </ScrollLink>
                    ) : (
                      <RouterLink
                        to={to}
                        className="text-gray-300 hover:text-indigo-400 text-sm font-medium transition-colors duration-200"
                        aria-label={label}
                      >
                        {label}
                      </RouterLink>
                    )}
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {quickLinksSecondColumn.map(({ id, label, to, type }) => (
                  <li key={id}>
                    {type === "scroll" ? (
                      <ScrollLink
                        to={to}
                        smooth={true}
                        duration={500}
                        offset={-80}
                        className="text-gray-300 hover:text-indigo-400 text-sm font-medium transition-colors duration-200 cursor-pointer"
                        aria-label={`Navigate to ${label}`}
                      >
                        {label}
                      </ScrollLink>
                    ) : (
                      <RouterLink
                        to={to}
                        className="text-gray-300 hover:text-indigo-400 text-sm font-medium transition-colors duration-200"
                        aria-label={label}
                      >
                        {label}
                      </RouterLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div variants={sectionVariants} className="flex flex-col items-center mt-2">
            <h3 className="text-lg font-bold text-white mb-4 font-sans text-center">
              Products
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
              <ul className="space-y-2">
                {productsFirstColumn.map((product, idx) => (
                  <li key={idx}>
                    <span className="text-gray-300 hover:text-indigo-400 text-sm font-medium transition-colors duration-200 cursor-default">
                      {product}
                    </span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {productsSecondColumn.map((product, idx) => (
                  <li key={idx}>
                    <span className="text-gray-300 hover:text-indigo-400 text-sm font-medium transition-colors duration-200 cursor-default">
                      {product}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div variants={sectionVariants} className="flex flex-col items-center mt-2">
            <h3 className="text-lg font-bold text-white mb-4 font-sans text-center">
              Connect With Us
            </h3>
            <div className="flex flex-col items-center space-y-2">
              <p className="text-sm text-gray-300">
                Email:{" "}
                <a
                  href="mailto:sellytics@sprintifyhq.com"
                  className="hover:text-indigo-400 transition-colors duration-200"
                >
                  sellytics@sprintifyhq.com
                </a>
              </p>
              <p className="text-sm text-gray-300">
                Phone:{" "}
                <a
                  href="tel:+2347088347620"
                  className="hover:text-indigo-400 transition-colors duration-200"
                >
                  +234 7088 34 7620
                </a>
              </p>
              <div className="flex space-x-4 mt-4">
                {socialLinks.map(({ href, icon, label }) => (
                  <motion.a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-indigo-400 transition-colors duration-200"
                    aria-label={label}
                    variants={iconVariants}
                    initial="rest"
                    whileHover="hover"
                  >
                    {icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-12 pt-6 border-t border-indigo-700/50 text-center text-sm text-gray-300"
          variants={sectionVariants}
        >
          <p>© {new Date().getFullYear()} Sellytics. All rights reserved.</p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

// FooterLayout for embedding components
const FooterLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default FooterLayout;