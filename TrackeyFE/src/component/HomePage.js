import React from 'react';
import { Link } from 'react-router-dom';
import Features from './LandingPageFeatures/Features';
import HowItWorks from './LandingPageFeatures/HowItWorks';
import UseCases from './LandingPageFeatures/UseCases';
import Reviews from './LandingPageFeatures/Reviews';
import WhosIsSellyticsFor from './LandingPageFeatures/WhosIsSellyticsFor';
import CAQ from './LandingPageFeatures/CAQ';
import PricingPlanLandingPage from './Payments/PricingPlanLandingPage';
import { motion } from 'framer-motion';
import WhatsAppChatPopup from './UserDashboard/WhatsAppChatPopup'
import Partners from './LandingPageFeatures/Partners';
import HappyCustomer  from './LandingPageFeatures/HappyCustomer';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const buttonVariants = {
  rest: { scale: 1, rotate: 0 },
  hover: { scale: 1.1, rotate: 2, transition: { type: 'spring', stiffness: 300 } },
};

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <WhatsAppChatPopup/>
      <section className="min-h-screen flex flex-col-reverse md:flex-row items-center justify-between bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-6 md:px-24 py-20 md:py-24 gap-12 relative overflow-hidden mt-10">
        {/* Wavy Bottom Border */}
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path
            d="M0,100 C280,0 720,100 1440,0 L1440,100 Z"
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

        <motion.div
          className="max-w-2xl bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } },
          }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-extrabold text-indigo-900 dark:text-white leading-tight mb-6 font-sans"
            variants={textVariants}
          >
            Track Inventory, Sales & Monitor Your Business — Without Stress
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 font-medium font-sans"
            variants={textVariants}
          >
            Sellytics empowers SME businesses to manage stock, monitor sales, set pricing, track expenses & more — all in one simple, mobile-friendly dashboard.
          </motion.p>
          <Link to="/register">
            <motion.button
              className="bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white px-8 py-4 text-lg rounded-xl shadow-md transition duration-300 ease-in-out hover:shadow-lg font-medium font-sans"
              variants={buttonVariants}
              initial="rest"
              whileHover="hover"
            >
              Start for Free
            </motion.button>
          </Link>
        </motion.div>

        <motion.div
          className="w-full md:w-[550px] h-[400px] flex items-center justify-center relative"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/30 to-indigo-400/30 rounded-2xl"></div>
          <img
            src="images/welcome.jpg"
            alt="Nigerian shop owner managing inventory"
            className="w-full h-full object-cover rounded-2xl shadow-xl relative z-10"
          />
        </motion.div>
      </section>



      {/* Other Sections (Unchanged) */}
      <motion.section id="features" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="py-16 px-6 md:px-20">
        <Features />
      </motion.section>

      <motion.section id="how-it-works" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="py-16 px-6 md:px-20">
        <HowItWorks />
      </motion.section>





      <motion.section id="pricing" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="py-16 px-6 md:px-20 bg-gray-50 dark:bg-gray-800">
        <PricingPlanLandingPage />
      </motion.section>

      <motion.section id="use-cases" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="py-16 px-6 md:px-20">
        <UseCases />
      </motion.section>

      <motion.section id="who-is-it-for" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="py-16 px-6 md:px-20 bg-gray-50 dark:bg-gray-800">
        <WhosIsSellyticsFor />
      </motion.section>

     
      <motion.section id="reviews" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="py-16 px-6 md:px-20 bg-gray-50 dark:bg-gray-800">
        <Reviews />
      </motion.section>


     
      <motion.section id="" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="py-16 px-6 md:px-20">
        <HappyCustomer />
      </motion.section>



       <motion.section id="faq" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="py-16 px-6 md:px-20">
        <CAQ />
      </motion.section>

      <motion.section id="partners" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="py-16 px-6 md:px-20">
        <Partners/>
      </motion.section>


    </>



  );
}