import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
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

export default function RegisterAccount() {
  const [shopName, setShopName] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [natureOfBusiness, setNatureOfBusiness] = useState('');
  const [otherBusiness, setOtherBusiness] = useState('');
  const [password, setPassword] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const businessOptions = [
    { group: 'Commerce', options: ['Retail', 'E-commerce', 'Wholesale', 'Grocery Store', 'Boutique'] },
    { group: 'Food & Beverage', options: ['Restaurant', 'Bakery'] },
    { group: 'Specialty Retail', options: ['Fashion', 'Electronics', 'Health & Beauty', 'Home & Garden', 'Sports & Outdoors', 'Automotive', 'Toys & Games', 'Books & Stationery', 'Jewelry', 'Pet Supplies', 'Arts & Crafts'] },
    { group: 'Services', options: ['Hair & Beauty'] },
    { group: 'Other', options: ['Other'] },
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!shopName || shopName.length < 2 || shopName.length > 50) {
      newErrors.shopName = 'Shop name must be 2-50 characters.';
    }
    if (!fullName || fullName.length < 2 || fullName.length > 100 || !/^[a-zA-Z\s]+$/.test(fullName)) {
      newErrors.fullName = 'Full name must be 2-100 characters, letters and spaces only.';
    }
    if (!emailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address.';
    }
    if (!natureOfBusiness) {
      newErrors.natureOfBusiness = 'Please select a business type.';
    } else if (natureOfBusiness === 'Other' && (!otherBusiness || otherBusiness.length < 2 || otherBusiness.length > 50)) {
      newErrors.otherBusiness = 'Please specify a business type (2-50 characters).';
    }
    if (
      !password ||
      password.length < 6 ||
     !/^(?=.*[A-Z]).{6,}$/.test(password)

    ) {
      newErrors.password =
        'Password must be at least 6 characters, including an uppercase';
    }
    if (!businessAddress || businessAddress.length < 5 || businessAddress.length > 200) {
      newErrors.businessAddress = 'Business address must be 5-200 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const arrayBufferToHex = (buffer) => {
    return Array.prototype.map
      .call(new Uint8Array(buffer), (x) => ('00' + x.toString(16)).slice(-2))
      .join('');
  };

  const hashPassword = async (plainText) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return arrayBufferToHex(hashBuffer);
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
      const hashedPassword = await hashPassword(password);
      const finalNatureOfBusiness =
        natureOfBusiness === 'Other' && otherBusiness.trim() ? otherBusiness.trim() : natureOfBusiness;

      const { error } = await supabase.from('stores').insert([
        {
          shop_name: shopName,
          full_name: fullName,
          email_address: emailAddress,
          nature_of_business: finalNatureOfBusiness,
          password: hashedPassword,
          business_address: businessAddress,
        },
      ]);

      if (error) {
        if (error.message.includes('duplicate key value violates unique constraint')) {
          toast.error('This email address is already registered. Please use another email or log in.', {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: 'colored',
          });
        } else {
          toast.error(`Error: ${error.message}`, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: 'colored',
          });
        }
      } else {
        toast.success('Registration successful! Welcome to Sellytics!', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
        });
        setShopName('');
        setFullName('');
        setEmailAddress('');
        setNatureOfBusiness('');
        setOtherBusiness('');
        setPassword('');
        setBusinessAddress('');
        setErrors({});
      }
    } catch (err) {
      toast.error(`Unexpected error: ${err.message}`, {
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
      className="py-20 md:py-24 px-6 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden mt-12"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      role="region"
      aria-labelledby="register-form-title"
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

      <div className="container mx-auto max-w-2xl relative z-10">
        <motion.div
          className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 border-l-4 border-transparent hover:border-indigo-500 dark:hover:border-indigo-300"
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -10 }}
        >
          <motion.h1
            id="register-form-title"
            className="text-3xl md:text-4xl font-extrabold text-center text-indigo-900 dark:text-white mb-8 font-sans relative before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700"
            variants={sectionVariants}
          >
            Start Your Sellytics Journey
          </motion.h1>
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            role="form"
            aria-labelledby="register-form-title"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Shop Name
                </label>
                <input
                  type="text"
                  id="shopName"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Enter your shop name"
                  className="w-full py-3 px-4 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-gray-800 dark:text-white transition-all duration-200"
                  required
                  aria-label="Shop Name input"
                  aria-describedby={errors.shopName ? 'shopName-error' : undefined}
                />
                {errors.shopName && (
                  <motion.p
                    id="shopName-error"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    variants={errorVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {errors.shopName}
                  </motion.p>
                )}
              </div>
              <div>
                <label
                  htmlFor="businessAddress"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Business Address
                </label>
                <input
                  type="text"
                  id="businessAddress"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Enter your business address"
                  className="w-full py-3 px-4 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-gray-800 dark:text-white transition-all duration-200"
                  required
                  aria-label="Business Address input"
                  aria-describedby={errors.businessAddress ? 'businessAddress-error' : undefined}
                />
                {errors.businessAddress && (
                  <motion.p
                    id="businessAddress-error"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    variants={errorVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {errors.businessAddress}
                  </motion.p>
                )}
              </div>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full py-3 px-4 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-gray-800 dark:text-white transition-all duration-200"
                  required
                  aria-label="Full Name input"
                  aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                />
                {errors.fullName && (
                  <motion.p
                    id="fullName-error"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    variants={errorVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {errors.fullName}
                  </motion.p>
                )}
              </div>
              <div>
                <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="emailAddress"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full py-3 px-4 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-gray-800 dark:text-white transition-all duration-200"
                  required
                  aria-label="Email input"
                  aria-describedby={errors.emailAddress ? 'emailAddress-error' : undefined}
                />
                {errors.emailAddress && (
                  <motion.p
                    id="emailAddress-error"
                    className="mt-1 text-sm text-red-600 dark:text-red-400"
                    variants={errorVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {errors.emailAddress}
                  </motion.p>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="natureOfBusiness"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Nature of Business
              </label>
              <select
                id="natureOfBusiness"
                value={natureOfBusiness}
                onChange={(e) => setNatureOfBusiness(e.target.value)}
                className="w-full py-3 px-4 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-gray-800 dark:text-white transition-all duration-200"
                required
                aria-label="Nature of Business select"
                aria-describedby={errors.natureOfBusiness ? 'natureOfBusiness-error' : undefined}
              >
                <option value="">Select a business type</option>
                {businessOptions.map((group) => (
                  <optgroup key={group.group} label={group.group}>
                    {group.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.natureOfBusiness && (
                <motion.p
                  id="natureOfBusiness-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  >
                  {errors.natureOfBusiness}
                </motion.p>
              )}
              {natureOfBusiness === 'Other' && (
                <div className="mt-4">
                  <input
                    type="text"
                    id="otherBusiness"
                    value={otherBusiness}
                    onChange={(e) => setOtherBusiness(e.target.value)}
                    placeholder="Specify your business type"
                    className="w-full py-3 px-4 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-gray-800 dark:text-white transition-all duration-200"
                    required
                    aria-label="Other Business input"
                    aria-describedby={errors.otherBusiness ? 'otherBusiness-error' : undefined}
                  />
                  {errors.otherBusiness && (
                    <motion.p
                      id="otherBusiness-error"
                      className="mt-1 text-sm text-red-600 dark:text-red-400"
                      variants={errorVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {errors.otherBusiness}
                    </motion.p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full py-3 px-4 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-gray-800 dark:text-white transition-all duration-200"
                  required
                  aria-label="Password input"
                  aria-describedby={errors.password ? 'password-error' : 'password-helper'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                  aria-label="Toggle Password Visibility"
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
              <p
                id="password-helper"
                className={`mt-1 text-sm ${
                  errors.password ? 'text-red-600 dark:text-red-400' : 'text-indigo-500 dark:text-indigo-400'
                }`}
              >
                {errors.password ||
                  'Password must be at least 6 characters, including an uppercase'}
              </p>
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
              aria-label="Register"
              aria-disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
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
}