import React, { useState, useEffect, useMemo } from 'react';

const OnboardingTour = ({ isOpen, onClose, setActiveTab }) => {
  const [currentStep, setCurrentStep] = useState(-1);

  const tourSteps = useMemo(
    () => [
      {
        selector: '[data-tour="toolkits"]',
        title: 'Toolkits',
        content: 'Access your store management tools here.',
        preferredPosition: 'right',
        action: () => setActiveTab('Toolkits'),
      },
      {
        selector: '[data-tour="sales-summary"]',
        title: 'Sales Dashboard',
        content: 'View and analyze sales data across your stores.',
        preferredPosition: 'right',
        action: () => setActiveTab('Sales Summary'),
      },
      {
        selector: '[data-tour="notifications"]',
        title: 'Notifications',
        content: 'Stay updated with store-related notifications.',
        preferredPosition: 'right',
        action: () => setActiveTab('Notifications'),
      },
      {
        selector: '[data-tour="colleagues"]',
        title: 'Colleagues',
        content: 'Manage your colleagues and their roles.',
        preferredPosition: 'right',
        action: () => setActiveTab('Colleagues'),
      },
      {
        selector: '[data-tour="profile"]',
        title: 'Your Profile',
        content: 'Update your personal and business information.',
        preferredPosition: 'right',
        action: () => setActiveTab('Profile'),
      },
     
     
      {
        selector: '[data-tour="dark-mode"]',
        title: 'Light/Dark Mode',
        content: 'Toggle between light and dark mode for a comfortable experience.',
        preferredPosition: 'top',
      },
    ],
    [setActiveTab]
  );

  useEffect(() => {
    if (!isOpen || currentStep < 0 || !tourSteps[currentStep]) return;

    const element = document.querySelector(tourSteps[currentStep].selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add(
        'tour-highlight',
        'relative',
        'z-50',
        'shadow-[0_0_10px_3px_rgba(99,102,241,0.7)]',
        'border-2',
        'border-indigo-500',
        'rounded-lg'
      );
      if (window.innerWidth < 768) {
        document.querySelector('aside').classList.add('w-64');
        document.querySelector('aside > div').classList.remove('hidden');
      }
    }
    tourSteps[currentStep].action?.();

    return () => {
      if (element) {
        element.classList.remove(
          'tour-highlight',
          'relative',
          'z-50',
          'shadow-[0_0_10px_3px_rgba(99,102,241,0.7)]',
          'border-2',
          'border-indigo-500',
          'rounded-lg'
        );
      }
      if (window.innerWidth < 768) {
        document.querySelector('aside').classList.remove('w-64');
        document.querySelector('aside > div').classList.add('hidden');
      }
    };
  }, [currentStep, isOpen, tourSteps]);

  const handleNext = () => {
    currentStep < tourSteps.length - 1 ? setCurrentStep(currentStep + 1) : onClose();
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSkip = () => onClose();

  const handleStartTour = () => setCurrentStep(0);

  if (!isOpen) return null;

  // Welcome Screen
  if (currentStep === -1) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-md text-center"
          role="dialog"
          aria-labelledby="welcome-title"
        >
          <h2 id="welcome-title" className="text-xl md:text-2xl font-bold mb-4">
            Welcome to Your Dashboard!
          </h2>
          <p className="mb-4 text-sm md:text-base">
            Explore key features to manage your stores efficiently.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleSkip}
              className="px-3 py-1 md:px-4 md:py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-sm md:text-base"
              aria-label="Skip the onboarding tour"
            >
              Skip
            </button>
            <button
              onClick={handleStartTour}
              className="px-3 py-1 md:px-4 md:py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm md:text-base"
              aria-label="Start the onboarding tour"
            >
              Start Tour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tour Steps
  const { selector, title, content, preferredPosition } = tourSteps[currentStep];
  const element = document.querySelector(selector);
  let positionStyles = {};
  let actualPosition = preferredPosition;

  if (element) {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const padding = 16;
    const { innerWidth: viewportWidth, innerHeight: viewportHeight } = window;

    if (preferredPosition === 'right' && viewportWidth - rect.right >= tooltipWidth + padding) {
      positionStyles = {
        top: rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2,
        left: rect.right + window.scrollX + 10,
      };
    } else if (preferredPosition === 'right' || preferredPosition === 'bottom') {
      actualPosition = 'bottom';
      if (viewportHeight - rect.bottom >= tooltipHeight + padding) {
        positionStyles = {
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
        };
      } else {
        actualPosition = 'top';
        positionStyles = {
          top: rect.top + window.scrollY - tooltipHeight - 10,
          left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
        };
      }
    } else if (preferredPosition === 'top' && rect.top >= tooltipHeight + padding) {
      positionStyles = {
        top: rect.top + window.scrollY - tooltipHeight - 10,
        left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
      };
    } else {
      actualPosition = 'bottom';
      positionStyles = {
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
      };
    }

    positionStyles.left = Math.max(padding, Math.min(positionStyles.left, viewportWidth - tooltipWidth - padding));
    positionStyles.top = Math.max(padding, Math.min(positionStyles.top, viewportHeight - tooltipHeight - padding));
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div
        className="absolute bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-sm transition-opacity duration-300"
        style={positionStyles}
        role="dialog"
        aria-labelledby={`step-title-${currentStep}`}
      >
        <h2 id={`step-title-${currentStep}`} className="text-lg md:text-xl font-bold mb-2">
          {title}
        </h2>
        <p className="mb-4 text-sm md:text-base">
          Step {currentStep + 1} of {tourSteps.length}: {content}
        </p>
        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="px-3 py-1 md:px-4 md:py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-sm md:text-base"
            aria-label="Skip the onboarding tour"
          >
            Skip Tour
          </button>
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-3 py-1 md:px-4 md:py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm md:text-base"
                aria-label="Go to previous tour step"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-3 py-1 md:px-4 md:py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm md:text-base"
              aria-label={currentStep === tourSteps.length - 1 ? 'Finish the tour' : 'Go to next tour step'}
            >
              {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
        <div
          className={`absolute w-3 h-3 bg-white dark:bg-gray-800 transform rotate-45 ${
            actualPosition === 'right'
              ? '-left-1.5 top-1/2 -translate-y-1/2'
              : actualPosition === 'bottom'
              ? 'left-1/2 -translate-x-1/2 -top-1.5'
              : 'left-1/2 -translate-x-1/2 -bottom-1.5'
          }`}
        />
      </div>
    </div>
  );
};

export default OnboardingTour;