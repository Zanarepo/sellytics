import React from "react";
//import { Linkedin, X, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-indigo-800 text-white py-6">
      <div className="container mx-auto px-4">
        
        <div className="flex flex-col md:flex-row items-center md:items-start">
         {/*  <div className="flex items-center space-x-4">
            <a
              href="https://www.linkedin.com/company/sprintifyhq/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-blue-400"
            >
              <Linkedin size={24} />
            </a>
            <a
              href="https://x.com/sprintifyhq"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-blue-400"
            >
              <X size={24} />
            </a>
            <a
              href="mailto:hello@sprintifyhq.com"
              className="flex items-center hover:text-blue-400"
            >
              <Mail size={24} />
            </a>
            <a
              href="tel:2347088347620"
              className="flex items-center hover:text-blue-400"
            >
              <Phone size={24} />
            </a>
          </div>*/}
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

export default Footer;
