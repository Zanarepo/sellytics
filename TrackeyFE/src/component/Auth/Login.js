import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaStore, FaUsers, FaUserShield, FaUserCog } from 'react-icons/fa';
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessOptions, setAccessOptions] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const hashPwd = async (plain) => {
    const buf = new TextEncoder().encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickAccess = (opt, allAccess) => {
    const userAccess = {
      store_ids: allAccess.filter((a) => a.storeId).map((a) => a.storeId),
      owner_id: allAccess.find((a) => a.ownerId)?.ownerId || null,
      user_ids: allAccess.filter((a) => a.userId).map((a) => a.userId),
      admin_id: allAccess.find((a) => a.adminId)?.adminId || null,
      role: opt.role || opt.type,
      screenclipExtensionId: opt.screenclipExtensionId || null,
    };

    localStorage.setItem('user_access', JSON.stringify(userAccess));

    const storeId = opt.storeId || allAccess.find((a) => a.storeId)?.storeId || '3';
    const ownerId = allAccess.find((a) => a.ownerId)?.ownerId || '1';
    const userId = opt.userId || null; // Store store_users.id for team role
    const adminId = opt.adminId || null;
    const userEmail = opt.email || email; // Store email for querying

    localStorage.setItem('store_id', storeId);
    localStorage.setItem('owner_id', ownerId);
    if (userId) {
      localStorage.setItem('user_id', userId); // Store store_users.id
    }
    localStorage.setItem('user_email', userEmail); // Store email



     if (adminId) {
      localStorage.setItem('admin_id', adminId); // Store store_users.id
    }
    localStorage.setItem('user_email', userEmail);

    console.log('Set localStorage:', {
      store_id: storeId,
      owner_id: ownerId,
      user_id: userId,
      user_email: userEmail,
      admin_id: adminId,
      user_access: userAccess,
    });

    toast.success(`Accessing ${opt.label}...`, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: 'colored',
    });

    switch (opt.type) {
      case 'owner':
        navigate('/dashboard');
        break;
      case 'store_owner':
        navigate('/owner-dashboard');
        break;
      case 'team':
        navigate('/team-dashboard');
        break;
      case 'admin':
      case 'superadmin':
        navigate('/admin-dashboard');
        break;
      default:
        break;
    }
  };

  const handleLogin = async (e) => {
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
      const hashed = await hashPwd(password);

      const { data: owners = [], error: ownerErr } = await supabase
        .from('stores')
        .select('id, shop_name')
        .eq('email_address', email)
        .eq('password', hashed);

      const { data: teamData = [], error: teamErr } = await supabase
        .from('store_users')
        .select('id, role, store_id, email_address, stores(id, shop_name)')
        .eq('email_address', email)
        .eq('password', hashed);

      const { data: adminData = [], error: adminErr } = await supabase
        .from('admins')
        .select('id, role')
        .eq('email', email)
        .eq('password', hashed);

      const { data: storeOwnersData = [], error: storeOwnerErr } = await supabase
        .from('store_owners')
        .select('id, full_name')
        .eq('email', email);

      if (ownerErr || teamErr || adminErr || storeOwnerErr) {
        console.error(ownerErr, teamErr, adminErr, storeOwnerErr);
        toast.error('An error occurred. Please try again.', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
        });
        setLoading(false);
        return;
      }

      const opts = [];

      owners.forEach((o) => {
        opts.push({
          type: 'owner',
          label: `Single Store Dashboard: ${o.shop_name}`,
          storeId: o.id,
          role: 'owner',
          screenclipExtensionId: 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp',
          icon: <FaStore />,
          email: email, // Include email
        });
      });

      teamData.forEach((u) => {
        opts.push({
          type: 'team',
          label: `${u.role.charAt(0).toUpperCase() + u.role.slice(1)} @ ${u.stores.shop_name}`,
          storeId: u.store_id,
          userId: u.id, // Include store_users.id
          email: u.email_address, // Include email_address
          role: u.role,
          screenclipExtensionId: 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp',
          icon: <FaUsers />,
        });
      });

      storeOwnersData.forEach((so) => {
        opts.push({
          type: 'store_owner',
          label: `Multi-Store Dashboard (${so.full_name})`,
          ownerId: so.id,
          role: 'store_owner',
          screenclipExtensionId: 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp',
          icon: <FaUserShield />,
          email: email, // Include email
        });
      });

      adminData.forEach((a) => {
        opts.push({
          type: a.role === 'superadmin' ? 'superadmin' : 'admin',
          label: `${a.role.charAt(0).toUpperCase() + a.role.slice(1)} Panel`,
          adminId: a.id,
          role: a.role,
          screenclipExtensionId: 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp',
          icon: <FaUserCog />,
          email: email, // Include email
        });
      });

      console.log('Access Options:', opts);

      if (opts.length === 0) {
        toast.error('Invalid credentials or no access.', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: 'colored',
        });
      } else if (opts.length === 1) {
        pickAccess(opts[0], opts);
      } else {
        setAccessOptions(opts);
      }
    } catch (e) {
      console.error(e);
      toast.error('Unexpected error. Please try again.', {
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

  if (accessOptions) {
    return (
      <motion.section
        className="py-20 md:py-24 px-6 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        role="dialog"
        aria-labelledby="dashboard-selection-title"
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

        <div className="container mx-auto max-w-md relative z-10 mt-10">
          <motion.div
            className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 border-l-4 border-transparent hover:border-indigo-500 dark:hover:border-indigo-300"
            variants={cardVariants}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <motion.h2
              id="dashboard-selection-title"
              className="text-2xl md:text-3xl font-extrabold text-center text-indigo-900 dark:text-white mb-6 font-sans relative before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700"
              variants={sectionVariants}
            >
              Select Your Dashboard
            </motion.h2>
            <motion.div
              className="space-y-4"
              variants={formVariants}
              initial="hidden"
              animate="visible"
            >
              {accessOptions.map((opt, i) => (
                <motion.button
                  key={i}
                  onClick={() => pickAccess(opt, accessOptions)}
                  className="flex items-center w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white rounded-xl hover:shadow-indigo-500/30 transition-all duration-300"
                  variants={buttonVariants}
                  initial="rest"
                  whileHover="hover"
                  aria-label={`Access ${opt.label}`}
                >
                  <span className="mr-3 text-indigo-200">{opt.icon}</span>
                  <span>{opt.label}</span>
                </motion.button>
              ))}
            </motion.div>
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

  return (
    <motion.section
      className="py-20 md:py-24 px-6 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden mt-10"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      role="region"
      aria-labelledby="login-form-title"
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
          <motion.h1
            id="login-form-title"
            className="text-3xl md:text-4xl font-extrabold text-center text-indigo-900 dark:text-white mb-8 font-sans relative before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700"
            variants={sectionVariants}
          >
            Welcome Back to Sellytics
          </motion.h1>
          <motion.form
            onSubmit={handleLogin}
            className="space-y-6"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            role="form"
            aria-labelledby="login-form-title"
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
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
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
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full py-3 px-4 rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-gray-800 dark:text-white transition-all duration-200"
                  required
                  aria-label="Password input"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200"
                  aria-label="Toggle Password Visibility"
                >
                  {showPwd ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  id="password-error"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-500 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-indigo-600 hover:text-white hover:px-2 hover:py-1 hover:rounded-md transition-all duration-200"
                aria-label="Forgot Password"
              >
                Forgot password?
              </Link>
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
              aria-label="Login"
              aria-disabled={loading}
            >
              {loading ? 'Logging in…' : 'Login'}
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