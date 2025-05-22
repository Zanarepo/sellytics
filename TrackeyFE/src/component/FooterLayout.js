import React from "react";
import { Outlet } from "react-router-dom";

// Footer component for specific routes (not landing page)
const Footer = () => {
  return (
    <footer className="bg-indigo-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          {/* Contact details */}
          <div className="mt-4 md:mt-0 md:ml-8 text-left">
            <p className="text-sm">sellytics@sprintifyhq.com</p>
            <p className="text-sm">+234 7088 34 7620</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// FooterLayout for specific routes
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