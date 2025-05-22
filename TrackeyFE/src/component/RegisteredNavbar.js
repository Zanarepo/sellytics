import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white p-0 flex justify-center items-center z-50 shadow-md ">
      <Link to="/">
      <img
  src="/Sellytics.jpg"
  alt="Sellytics Logo"
  className="h-16 md:h-20 w-auto"
/>

      </Link>
    </nav>
  );
};

export default Navbar;
