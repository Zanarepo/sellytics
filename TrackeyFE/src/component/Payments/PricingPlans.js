import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const featureVariants = {
  collapsed: { opacity: 0, height: 0, marginTop: 0 },
  expanded: { opacity: 1, height: 'auto', marginTop: '1rem', transition: { duration: 0.3 } },
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.1, transition: { type: 'spring', stiffness: 300 } },
};

const features = {
  free: [
    '✅ Manage up to 50 products with ease',
    '✅ Basic sales tracking for daily operations',
    '✅ Inventory, product, and pricing management',
    '✅ Track expenses and customer debts',
    '✅ View sales history (last 30 days)',
    '❌ Team collaboration features',
    '❌ Multi-store management',
    '❌ Staff training resources',
    '❌ Priority support',
    '❌ Printable receipts',
  ],
  premium: [
    '✅ All Free Plan features',
    '✅ Advanced sales analytics dashboard',
    '✅ Full sales history and downloadable reports',
    '✅ Staff onboarding and training',
    '✅ Priority customer support (24/7)',
    '✅ Printable and email-ready receipts',
    '✅ Single-store team collaboration',
    '❌ Multi-store management',
    '❌ Advanced product insights',
  ],
  business: [
    '✅ All Free and Premium Plan features',
    '✅ Manage up to 3 stores with multi-store dashboard',
    '✅ Advanced product insights and analytics',
    '✅ Multi-store team management',
    '✅ Dedicated account manager',
  ],
};

const plans = [
  { id: 1, name: 'Free', price: 0 },
  { id: 2, name: 'Premium', price: 5000 },
  { id: 3, name: 'Business', price: 15000 },
];

export default function SubscriptionPlansComponent() {
  const [expandedPlans, setExpandedPlans] = useState({});
  const navigate = useNavigate();

  const toggleDetails = (planId) => {
    setExpandedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const handleSubscribe = (plan) => {
    const normalizedPlan = {
      ...plan,
      nameKey: plan.name?.toLowerCase().trim(),
    };
    navigate('/payment', { state: { plan: normalizedPlan } });
  };

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
            Unlock Your Business Potential
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 font-medium font-sans max-w-3xl mx-auto"
            variants={headerVariants}
          >
            Whether you’re launching a small shop or scaling multiple stores, our flexible plans empower your growth. Pick from Free, Premium, or Business to find your perfect fit.
          </motion.p>
          <motion.p
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 font-medium font-sans max-w-3xl mx-auto"
            variants={headerVariants}
          >
            Each plan is crafted to fuel your success with scalable features, analytics, and seamless management tools.
          </motion.p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const planKey = plan.name.toLowerCase().trim();
            const isFree = plan.price === 0;
            const isPremium = plan.name === 'Premium';
            const isExpanded = expandedPlans[plan.id] || false;

            return (
              <motion.div
                key={plan.id}
                className={`relative bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 p-8 flex flex-col justify-between border-t-4 ${
                  isPremium
                    ? 'border-blue-500'
                    : plan.name === 'Business'
                    ? 'border-purple-500'
                    : 'border-green-500'
                }`}
                variants={cardVariants}
                whileHover={{ scale: 1.05, y: -10 }}
                aria-label={`${plan.name} Plan Card`}
              >
                {/* Popular Badge for Premium */}
                {isPremium && (
                  <span className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="space-y-4">
                  <h2
                    className={`text-2xl font-bold capitalize ${
                      isPremium
                        ? 'text-blue-600 dark:text-blue-400'
                        : plan.name === 'Business'
                        ? 'text-purple-700 dark:text-purple-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    {plan.name} Plan
                  </h2>
                  <p className="text-3xl font-extrabold text-indigo-900 dark:text-white">
                    {isFree ? '₦0' : `₦${plan.price.toLocaleString()}`}
                    <span className="text-base text-gray-500 dark:text-gray-400 font-normal"> /month</span>
                  </p>
                  <motion.button
                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white py-2 px-4 rounded-xl font-medium hover:shadow-indigo-500/30 transition-all duration-300"
                    onClick={() => toggleDetails(plan.id)}
                    variants={buttonVariants}
                    initial="rest"
                    whileHover="hover"
                    aria-expanded={isExpanded}
                    aria-controls={`features-${plan.id}`}
                    aria-label={`Toggle ${plan.name} Plan Details`} 
                  >
                    {isExpanded ? 'Hide Details' : 'Show Details'}
                  </motion.button> <p/>
                  <motion.ul
                    id={`features-${plan.id}`}
                    variants={featureVariants}
                    animate={isExpanded ? 'expanded' : 'collapsed'}
                    className="text-base text-gray-600 dark:text-gray-300 space-y-3 overflow-hidden"
                  >
                    {features[planKey].map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">{feature.startsWith('✅') ? '✅' : '❌'}</span>
                        <span>{feature.slice(2)}</span>
                      </li>
                    ))}
                  </motion.ul>
                </div>
                <motion.button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isFree}
                  className={`mt吕布6 w-full py-3 px-4 font-medium rounded-xl transition-all duration-300 ${
                    isFree
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : isPremium
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-500/30'
                      : plan.name === 'Business'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:shadow-purple-500/30'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-green-500/30'
                  }`}
                  variants={buttonVariants}
                  initial="rest"
                  whileHover="hover"
                  aria-label={`Subscribe to ${plan.name} Plan`}
                >
                  {isFree ? 'Current Plan' : `Subscribe to ${plan.name}`}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}