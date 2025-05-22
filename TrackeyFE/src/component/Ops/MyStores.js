import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import PricingFeatures from '../Payments/PricingFeatures'
import {
  FaStore,
  FaHome,
  FaArrowDown,
} from 'react-icons/fa';
import {
  Sun,
  Moon,
  Phone,
  Mail,
  //BarChart2,

} from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardAccess from '../Ops/DashboardAccess';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const ownerId = Number(localStorage.getItem('owner_id'));
  const [stores, setStores] = useState([]);
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPricing, setShowPricing] = useState(false);

  // UI state
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('nameAsc');
  const [profileOpen, setProfileOpen] = useState(false);

  // apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // fetch owner + stores
  useEffect(() => {
    if (!ownerId) {
      setError('No owner_id found. Please log in again.');
      setLoading(false);
      return;
    }
    (async () => {
      // owner
      const { data: owner, error: ownerErr } = await supabase
        .from('store_owners')
        .select('full_name')
        .eq('id', ownerId)
        .single();
      if (ownerErr) {
        setError(ownerErr.message);
        setLoading(false);
        return;
      }
      setOwnerName(owner.full_name);

      // stores
      const { data, error: storesErr } = await supabase
        .from('stores')
        .select('id, shop_name, physical_address, phone_number, email_address, is_active')
        .eq('owner_user_id', ownerId)
        .order('created_at', { ascending: false });
      if (storesErr) {
        setError(storesErr.message);
      } else {
        setStores(data || []);
      }
      setLoading(false);
    })();
  }, [ownerId]);

  // filter + sort
  const filtered = stores.filter(store => {
    const nameMatch = store.shop_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return nameMatch;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'nameAsc') {
      return a.shop_name.localeCompare(b.shop_name);
    }
    if (sortKey === 'nameDesc') {
      return b.shop_name.localeCompare(a.shop_name);
    }
    if (sortKey === 'activeFirst') {
      return (b.is_active === true) - (a.is_active === true);
    }
    if (sortKey === 'inactiveFirst') {
      return (b.is_active === false) - (a.is_active === false);
    }
    return 0;
  });

  // handlers
  const toggleDarkMode = () => setDarkMode(prev => !prev);
  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // loading skeleton
  const SkeletonCard = () => (
    <div className="p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow animate-pulse h-48" />
  );

  if (loading) {
    return (
      <div className="p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6 text-red-600 text-center">Error: {error}</div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <DashboardAccess />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* ─── HEADER ────────────────────────────────────────── */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <FaHome className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
          <h1 className="text-3xl font-bold">My Stores</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* dark mode */}
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(open => !open)}
              className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white"
              aria-label="Profile menu"
            >
              {ownerName.charAt(0)}
            </button>
            {profileOpen && (
              <ul className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow">
               
                <li
                  onClick={logout}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  Logout
                </li>
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* ─── WELCOME ──────────────────────────────────────── */}
      <section className="text-center mb-8">
        <h2 className="text-3xl">
          Welcome, <span className=" text-3xl font-semibold text-indigo-800">{ownerName}</span>!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Click a card to manage that store’s dashboard <br/>
          <FaArrowDown className="inline text-indigo-600" />
        </p>
      </section>

      {/* ─── SEARCH & SORT ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search stores…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
        />
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value)}
          className="mt-2 sm:mt-0 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="nameAsc">Name (A–Z)</option>
          <option value="nameDesc">Name (Z–A)</option>
          <option value="activeFirst">Active first</option>
          <option value="inactiveFirst">Inactive first</option>
        </select>
      </div>

      {/* ─── EMPTY STATE ─────────────────────────────────── */}
      {sorted.length === 0 && !showPricing && (
  <div className="text-center text-gray-600 dark:text-gray-400 py-20">
    <p className="mb-4">This is a premium feature. Upgrade to access store management.</p>
    <button
      onClick={() => setShowPricing(true)}
      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
    >
      Upgrade to Premium
    </button>
  </div>
)}

{showPricing && <PricingFeatures />}

      {/* ─── STORES GRID ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map(store => (
          <div
            key={store.id}
            onClick={() => {
              localStorage.setItem('store_id', store.id);
              navigate('/dashboard');
            }}
            className="relative p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-lg transform hover:scale-105 transition cursor-pointer"
          >
            {/* status badge */}
            <span
              className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${
                store.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {store.is_active ? 'Active' : 'Inactive'}
            </span>

            <div className="flex items-center gap-2 mb-3">
              <FaStore className="text-2xl text-indigo-500 dark:text-indigo-300" />
              <h3 className="text-xl font-semibold">
                {store.shop_name}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                #{store.id}
              </span>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {store.physical_address}
            </p>

            <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {store.phone_number}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {store.email_address}
              </div>
              {/*  */}
            {/*  <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Orders:  store.stats?.newOrders ?? 0 
              </div>*/}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
