import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaStore, FaUsers, FaUserShield, FaUserCog } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1 },
  },
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { type: 'spring', stiffness: 300 } },
};

const AccessSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get current URL path
  const [accessOptions, setAccessOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Determine current dashboard role based on URL path
  const getCurrentRole = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'owner';
    if (path === '/owner-dashboard') return 'store_owner';
    if (path === '/team-dashboard') return 'team';
    if (path === '/admin-dashboard') return ['admin', 'superadmin']; // Both admin and superadmin
    return null;
  };

  // Reconstruct accessOptions from localStorage
  useEffect(() => {
    try {
      const userAccess = JSON.parse(localStorage.getItem('user_access'));
      const userEmail = localStorage.getItem('user_email');
      if (!userAccess || !userEmail) {
        setLoading(false);
        return;
      }

      const opts = [];

      // Owner access (stores)
      if (userAccess.store_ids && userAccess.store_ids.length > 0) {
        userAccess.store_ids.forEach((storeId) => {
          opts.push({
            type: 'owner',
            label: `Single Store `,
            storeId,
            role: 'owner',
            screenclipExtensionId: userAccess.screenclipExtensionId || 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp',
            icon: <FaStore />,
            email: userEmail,
          });
        });
      }

      // Store Owner access
      if (userAccess.owner_id) {
        opts.push({
          type: 'store_owner',
          label: `Multi-Store`,
          ownerId: userAccess.owner_id,
          role: 'store_owner',
          screenclipExtensionId: userAccess.screenclipExtensionId || 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp',
          icon: <FaUserShield />,
          email: userEmail,
        });
      }

      // Team access (store_users)
      if (userAccess.user_ids && userAccess.user_ids.length > 0) {
        userAccess.user_ids.forEach((userId, index) => {
          opts.push({
            type: 'team',
            label: `Team Role: Store ${index + 1}`,
            storeId: userAccess.store_ids[index] || '3', // Fallback store_id
            userId,
            role: userAccess.role || 'team',
            screenclipExtensionId: userAccess.screenclipExtensionId || 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp',
            icon: <FaUsers />,
            email: userEmail,
          });
        });
      }

      // Admin/Superadmin access
      if (userAccess.admin_id) {
        const role = userAccess.role === 'superadmin' ? 'superadmin' : 'admin';
        opts.push({
          type: role,
          label: `${role.charAt(0).toUpperCase() + role.slice(1)} Panel`,
          adminId: userAccess.admin_id,
          role,
          screenclipExtensionId: userAccess.screenclipExtensionId || 'jmjbgcjbgmcfgbgikmbdioggjlhjegpp',
          icon: <FaUserCog />,
          email: userEmail,
        });
      }

      console.log('Reconstructed Access Options:', opts);
      setAccessOptions(opts);
      setLoading(false);
    } catch (error) {
      console.error('Error parsing user_access:', error);
      setLoading(false);
    }
  }, []);

  // Reuse pickAccess from Login.js
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
    const userId = opt.userId || null;
    const adminId = opt.adminId || null;
    const userEmail = opt.email || localStorage.getItem('user_email');

    localStorage.setItem('store_id', storeId);
    localStorage.setItem('owner_id', ownerId);
    if (userId) {
      localStorage.setItem('user_id', userId);
    } else {
      localStorage.removeItem('user_id');
    }
    if (adminId) {
      localStorage.setItem('admin_id', adminId);
    } else {
      localStorage.removeItem('admin_id');
    }
    localStorage.setItem('user_email', userEmail);

    console.log('Updated localStorage:', {
      store_id: storeId,
      owner_id: ownerId,
      user_id: userId,
      admin_id: adminId,
      user_email: userEmail,
      user_access: userAccess,
    });

    toast.success(`Switching to ${opt.label}...`, {
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

  // Filter out the current dashboard's role
  const currentRole = getCurrentRole();
  const filteredAccessOptions = accessOptions.filter((opt) => {
    if (!currentRole) return true; // Show all if no current role detected
    if (Array.isArray(currentRole)) {
      return !currentRole.includes(opt.type); // Exclude admin or superadmin
    }
    return opt.type !== currentRole; // Exclude single role
  });

  // Don't render if loading, single role, or no options remain
  if (loading || accessOptions.length <= 1 || filteredAccessOptions.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="w-full px-4 py-2 bg-white dark:bg-gray-900 backdrop-blur-md  flex flex-col sm:flex-row gap-2 justify-center items-center"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {filteredAccessOptions.map((opt, index) => (
        <motion.button
          key={index}
          onClick={() => pickAccess(opt, accessOptions)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white rounded-xl hover:shadow-indigo-500/30 transition-all duration-300 text-sm"
          variants={buttonVariants}
          initial="rest"
          whileHover="hover"
          aria-label={`Switch to ${opt.label}`}
        >
          <span className="mr-2">{opt.icon}</span>
          <span>{opt.label}</span>
        </motion.button>
      ))}
      <ToastContainer
        position="top-right"
        autoClose={3000}
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
    </motion.div>
  );
};

export default AccessSwitcher;