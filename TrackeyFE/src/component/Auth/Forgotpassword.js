import { useState } from 'react';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, type: 'spring', stiffness: 100 } },
};

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.1, transition: { type: 'spring', stiffness: 300 } },
};

const errorVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://trackitbe.onrender.com/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast.success('Password reset email sent. Check your inbox.', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
      });
      setEmail('');
    } catch (err) {
      toast.error(err.message, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      className="py-20 md:py-24 px-6 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden mt-10"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      role="region"
      aria-labelledby="forgot-password-form-title"
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

      <div className="container mx-auto max-w-md relative z-10">
        <motion.div
          className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 border-l-4 border-transparent hover:border-indigo-500 dark:hover:border-indigo-300"
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -10 }}
        >
          <motion.h2
            id="forgot-password-form-title"
            className="text-3xl md:text-4xl font-extrabold text-center text-indigo-900 dark:text-white mb-8 font-sans relative before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700"
            variants={sectionVariants}
          >
            Reset Your Password
          </motion.h2>
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            role="form"
            aria-labelledby="forgot-password-form-title"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full py-3 px-4 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-gray-800 dark:text-white transition-all duration-200"
                required
                aria-label="Email Address input"
                aria-describedby={errors.email ? 'email-error' : 'email-helper'}
              />
              <p
                id="email-helper"
                className="mt-1 text-sm text-indigo-500 dark:text-indigo-400"
              >
                We’ll send a reset link to this email.
              </p>
              {errors.email && (
                <motion.p
                  id="email-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-indigo-500/30 transition-all duration-300 ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              variants={buttonVariants}
              initial="rest"
              whileHover="hover"
              aria-label="Send Reset Link"
              aria-disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastClassName="bg-white/70 dark:bg-gray-800/80 backdrop-blur-md text-indigo-900 dark:text-white rounded-xl shadow-lg"
        progressClassName="bg-indigo-500"
      />
    </motion.section>
  );
};

export default ForgotPassword;