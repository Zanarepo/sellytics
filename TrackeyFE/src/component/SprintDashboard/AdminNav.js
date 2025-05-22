import React, { useState } from "react";
import { Link } from "react-router-dom";


const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Toggle the mobile menu state
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle logout confirmation
  const handleLogout = (e) => {
    if (!window.confirm("Are you sure you want to logout?")) {
      e.preventDefault();
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full font-bold bg-gray-100 p-0 text-yellow-800 flex justify-between items-center z-50 shadow-md">
      <span className="absolute left-0 bottom-2 w-full border-b-4 border-double border-yellow-800"></span>
      {/* Left side: Hamburger menu and Home link */}
      <div className="flex items-center">
        {/* Hamburger Icon (visible on mobile only) */}
        <button onClick={toggleMenu} className="md:hidden mr-2 focus:outline-none">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        {/* Home Link always visible */}
         <Link to="/">
         <img src="/Sellytics.jpg" alt="Sellytics Logo" className="h-20 w-auto ml-2" />
        
                
                      </Link>
      </div>

      {/* Desktop Menu (visible on md and up) */}
      <div className="hidden md:flex gap-6 items-center pr-6">
        <Link to="/dashboard" className="hover:underline">
          My Toolsboard
        </Link>

        
        
        <Link to="/sticky" className="hover:underline">
          StickyBoard
        </Link>

        
        <Link 
          to="/login" 
          className="hover:underline" 
          onClick={handleLogout}
        >
          Logout
        </Link>
      </div>

      {/* Right side: Registered Users App Launcher */}
    

      {/* Mobile Menu (dropdown) */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-yellow-800 text-white flex flex-col items-start p-4 md:hidden">
          <Link
            to="/dashboard"
            className="py-2 w-full hover:underline"
            onClick={() => setIsMenuOpen(false)}
          >
            My Toolsboard
          </Link>
          <Link
            to="/allapps2"
            className="py-2 w-full hover:underline"
            onClick={() => setIsMenuOpen(false)}
          >
            All-in-one
          </Link>
          <Link to="/sticky" className="hover:underline">
          StickyBoard
        </Link>

          
          <Link
            to="/login"
            className="py-2 w-full hover:underline"
            onClick={(e) => {
              if (!window.confirm("Are you sure you want to logout?")) {
                e.preventDefault();
              } else {
                setIsMenuOpen(false);
              }
            }}
          >
            Logout
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
