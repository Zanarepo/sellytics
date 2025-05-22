import React from 'react';

const Partners = () => {
  // Sample partner data (replace with actual data)
  const partners = [
    { name: 'Sellytics', logo: '/Sellytics.jpg' }, 
    { name: 'Sprintify', logo: 'Sprintify2.png' },
  
  ];

  return (
    <>
      {/* eslint-disable-next-line */}
      <section
        className="py-20 md:py-24 px-6 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden"
        aria-label="Our Partners"
      >
        {/* Wavy Top Border */}
        <svg className="absolute top-0 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path
            d="M0,0 C280,100 720,0 1440,100 L1440,0 Z"
            fill="url(#gradient)"
            className="dark:fill-gray-800"
            aria-hidden="true"
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
            aria-hidden="true"
          />
        </svg>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 border-l-4 border-transparent hover:border-indigo-500 dark:hover:border-indigo-300">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center text-indigo-900 dark:text-white mb-4 font-sans relative before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-[2px] before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700">
              Our Partners
            </h2>
            <p className="text-center text-indigo-500 dark:text-indigo-400 mb-8">
              Trusted by leading companies worldwide
            </p>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              role="list"
            >
              {partners.map((partner, index) => (
                <div
                  key={`partner-${index}`}
                  className="p-6 rounded-2xl bg-white dark:bg-gray-900 shadow-md flex flex-col items-center space-y-2"
                  role="listitem"
                >
                  <span className="text-base md:text-lg font-medium text-gray-600 dark:text-gray-300 text-center">
                    {partner.name}
                  </span>
                  <img
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    className="h-10 md:h-12 w-auto"
                    aria-label={`${partner.name} logo`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Partners;