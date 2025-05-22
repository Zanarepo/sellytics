// components/LandingNavbar.jsx
import React from 'react';
import { Link as ScrollLink } from 'react-scroll';

const sections = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'use-cases', label: 'Use Cases' },
  { id: 'who-is-it-for', label: 'Who It’s For' },
  { id: 'faq', label: 'FAQ' },
  { id: 'reviews', label: 'Reviews' },
];

export default function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md">
      <nav className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="text-xl font-bold text-indigo-700">Sellytics</div>
        <ul className="flex space-x-4 text-sm md:text-base">
          {sections.map(({ id, label }) => (
            <li key={id}>
              <ScrollLink
                to={id}
                smooth={true}
                duration={500}
                spy={true}
                offset={-80}
                activeClass="text-indigo-700 font-semibold"
                className="cursor-pointer text-gray-700 dark:text-gray-200 hover:text-indigo-600 transition"
              >
                {label}
              </ScrollLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
