import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PaystackButton } from 'react-paystack';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { type: 'spring', stiffness: 300 } },
};

const PaymentComponent = () => {
  const location = useLocation();
  const { plan } = location.state || {};
  const [storeId, setStoreId] = useState('');
  const [userId, setUserId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [paymentReady, setPaymentReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedStoreId = localStorage.getItem('store_id');
    const storedUserId = localStorage.getItem('user_id');
    const storedOwnerId = localStorage.getItem('owner_id');

    if (storedStoreId || storedUserId) {
      setStoreId(storedStoreId);
      setUserId(storedUserId);
      setOwnerId(storedOwnerId);
      fetchEmails(storedUserId, storedStoreId);
    } else {
      setError('Missing store or user information. Please try again.');
      setPaymentReady(false);
    }
  }, []);

  const fetchEmails = async (user_id, store_id) => {
    try {
      if (user_id) {
        const { data: userData, error: userError } = await supabase
          .from('store_users')
          .select('email_address')
          .eq('id', user_id)
          .single();

        if (userError) throw userError;
        setUserEmail(userData.email_address);
      } else if (store_id) {
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('email_address')
          .eq('id', store_id)
          .single();

        if (storeError) throw storeError;
        setStoreEmail(storeData.email_address);
      }

      setPaymentReady(true);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Failed to load payment details. Please try again.');
      setPaymentReady(false);
    }
  };

  const paystackConfig = {
    email: userEmail || storeEmail,
    amount: plan?.price * 100,
    publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
    metadata: {
      store_id: storeId,
      user_id: userId,
      owner_id: ownerId,
      plan_id: plan?.id,
    },
  };

  return (
    <motion.section
      className="py-20 md:py-24 px-6 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      aria-label="Payment"
    >
      {/* Wavy Top Border */}
      <svg className="absolute top-0 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path
          d="M0,0 C280,100 720,0 1440,100 L1440,0 Z"
          fill="url(#gradient)"
          className="dark:fill-gray-800"
          aria-hidden="true"
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
          aria-hidden="true"
        />
      </svg>

      <div className="container mx-auto max-w-xl relative z-10">
        <motion.div
          className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 border-l-4 border-transparent hover:border-indigo-500 dark:hover:border-indigo-300"
          variants={sectionVariants}
        >
          <motion.h2
            className="text-3xl md:text-4xl font-extrabold text-center text-indigo-900 dark:text-white mb-6 font-sans relative before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-[2px] before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700"
            variants={textVariants}
          >
            Complete Your Payment
          </motion.h2>

          {paymentReady && plan ? (
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-xl p-6  text-center"
              variants={textVariants}
            >
              <h3 className="text-xl md:text-2xl font-semibold text-indigo-800 dark:text-indigo-200 mb-3">
                {plan.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg font-medium">
                {plan.description}
              </p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-6">
                ₦{plan.price.toLocaleString()}
              </p>
              <motion.div
                className="mt-6"
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
              >
                <PaystackButton
                  {...paystackConfig}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white py-3 px-8 rounded-xl text-lg font-medium shadow-md hover:shadow-lg transition-all duration-300"
                  aria-label={`Pay for ${plan.name}`}
                >
                  Pay Now
                </PaystackButton>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center h-40"
              variants={textVariants}
              role="alert"
              aria-live="polite"
            >
              {error ? (
                <p className="text-red-500 text-lg font-medium">{error}</p>
              ) : (
                <>
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-indigo-500 dark:text-indigo-400 text-lg font-medium">
                    Loading payment details...
                  </p>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default PaymentComponent;