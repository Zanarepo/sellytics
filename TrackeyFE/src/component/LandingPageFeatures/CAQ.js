import React, { useState } from 'react';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } },
};

const accordionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const answerVariants = {
  collapsed: { opacity: 0, height: 0, marginTop: 0 },
  expanded: { opacity: 1, height: 'auto', marginTop: '1rem', transition: { duration: 0.3 } },
};

const iconVariants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 45, transition: { type: 'spring', stiffness: 300 } },
};

const FAQItem = ({ question, answer, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="mb-6 bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-md overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={accordionVariants}
    >
      <button
        type="button"
        className="w-full text-left flex justify-between items-center p-6 bg-gradient-to-r from-white/80 to-indigo-50/80 dark:from-gray-800/80 dark:to-gray-900/80 hover:from-indigo-100/80 hover:to-indigo-200/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:scale-[1.02]"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`faq-answer-${index}`}
      >
        <span className="text-lg md:text-xl font-semibold text-indigo-900 dark:text-white font-sans">
          {question}
        </span>
        <motion.span
          className="text-2xl text-indigo-600 dark:text-indigo-400"
          variants={iconVariants}
          animate={expanded ? 'expanded' : 'collapsed'}
        >
          {expanded ? '−' : '+'}
        </motion.span>
      </button>
      <motion.div
        id={`faq-answer-${index}`}
        variants={answerVariants}
        animate={expanded ? 'expanded' : 'collapsed'}
        className="overflow-hidden"
        aria-hidden={!expanded}
        layout
      >
        <p className="p-6 text-gray-600 dark:text-gray-300 text-base md:text-lg font-medium font-sans">
          {answer}
        </p>
      </motion.div>
      <svg className="w-full h-6" viewBox="0 0 1440 24" preserveAspectRatio="none">
        <path
          d="M0,12 C240,24 480,0 720,12 C960,24 1200,0 1440,12 L1440,24 L0,24 Z"
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
    </motion.div>
  );
};

const FAQ = () => {
  const faqs = [
    {
      question: "How do I begin to use Sellytics?",
      answer: "As a new user, register your store with the necessary details to start using Sellytics.",
    },
    {
      question: "How do I add products and prices?",
      answer: "Go to Products & Pricing, click 'Add,' and input the product name, description, total purchase price, and quantity purchased.",
    },
    {
      question: "How can I use Sales Tracker?",
      answer: "In Sales Tracker, click on Sales to add Product Sold, Quantity, Unit Price, and Payment Method, then click Save Sale.",
    },
    {
      question: "Can I filter or search past sales?",
      answer: "Yes, use the built-in search box to find transactions by date, product name, or payment method.",
    },
    {
      question: "What is inventory for?",
      answer: "Manage Inventory lets you track items sold and the number of items available.",
    },
    {
      question: "Will I be notified when my stock is running low?",
      answer: "Yes, you’ll get automatic alerts when any product hits its minimum stock level, so you never run out unexpectedly.",
    },
    {
      question: "Can I create a receipt for every good sold?",
      answer: "Yes, Sellytics generates clean, professional receipts for every item sold, including customer details, which can be printed or emailed.",
    },
    {
      question: "How do I manage returned items or goods?",
      answer: "Go to the Returns Tracker, select the items being returned, and capture the goods returned and their details.",
    },
    {
      question: "Can I keep track of my business expenses?",
      answer: "Yes, Sellytics allows you to log all expenses like rent and utilities. Click 'Add Expense' and input the details.",
    },
    {
      question: "Can I track customers who owe me money?",
      answer: "Yes, the Debt Manager lets you log customers who purchase on credit, tracking who owes what after registering them.",
    },
    {
      question: "How do I manage multiple stores?",
      answer: "Create an account for each store. Sellytics links them after verification, allowing you to manage all locations from a centralized dashboard.",
    },
    {
      question: "How do I manage attendants (sellers) working for me?",
      answer: "Invite attendants individually and assign them to specific stores. Each attendant manages their account and daily sales within their store.",
    },
    {
      question: "How do I use unpaid supplies?",
      answer: "Unpaid Supplies records third-party sellers who take goods to sell and return or pay after sales.",
    },
    {
      question: "How can I see how my business is performing each day?",
      answer: "Your dashboard shows a daily summary of total sales, top products, and performance trends at a glance.",
    },
    {
      question: "Can I store my customers’ details?",
      answer: "Yes, in the Customer Hub, save names, phone numbers, emails, and addresses to enhance customer service and follow-up.",
    },
    {
      question: "Will I get reports that help me make smarter business decisions?",
      answer: "Yes, Sellytics provides insightful reports on sales performance, profit margins, and top-selling items to guide decisions.",
    },
    {
      question: "Can I export or share my reports?",
      answer: "Yes, download reports instantly as PDF or CSV files for bookkeeping or sharing with your team.",
    },
    {
      question: "How do I create a receipt for a customer?",
      answer: "Go to Quick Receipts, select purchased products, enter quantities, and print or share the receipt instantly.",
    },
    {
      question: "How can I update my product prices?",
      answer: "Navigate to Products & Pricing, find the product, click Edit, adjust the price, and click Save.",
    },
    {
      question: "How can I manage unpaid supplier bills?",
      answer: "In the Unpaid Supplies section, add the supplier name and owed amount, and update the record when payment is completed.",
    },
    {
      question: "Can I manage more than one store in Sellytics?",
      answer: "Yes, in the Multi-Store View, add or select stores to monitor sales, inventory, and staff activity for each location.",
    },
    {
      question: "How do I record business expenses?",
      answer: "Open the Expense Log, enter expense details (type, amount, date), categorize it, and click Save to record the transaction.",
    },
    {
      question: "How do I manage customer information?",
      answer: "In the Customer Hub, click 'Add New Customer,' enter their details, and update or view their information anytime.",
    },
    {
      question: "Where can I access performance reports?",
      answer: "Visit the Reports section to view clear tables showing sales, stock levels, and business trends to support informed decisions.",
    },
    {
      question: "How do I handle product returns?",
      answer: "Go to the Returns Tracker, click 'Add Return,' select the item, enter the reason, and confirm. Your inventory will update automatically.",
    },
  ];

  return (
    <motion.section
      className="py-20 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden"
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-indigo-900 dark:text-white mb-12 font-sans"
          variants={sectionVariants}
        >
          Commonly Asked Questions (CAQs)
        </motion.h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} index={index} />
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default FAQ;