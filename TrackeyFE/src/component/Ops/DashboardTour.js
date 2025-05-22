import React, { useState, useEffect } from 'react';

const OnboardingTour = ({ isOpen, onClose, setActiveTab }) => {
  const [currentStep, setCurrentStep] = useState(-1); // -1 for welcome screen

  const tourSteps = [
    {
      selector: '[data-tour="my-stores"]',
      title: 'Stores Dashboard',
      content: 'Manage your stores and their details here.',
      preferredPosition: 'right',
      action: () => setActiveTab('My Stores'),
    },
    {
      selector: '[data-tour="profile"]',
      title: 'Your Profile',
      content: 'Update your personal and business information in the Profile section.',
      preferredPosition: 'right',
      action: () => setActiveTab('Profile'),
    },
    {
      selector: '[data-tour="multi-sales"]',
      title: 'Sales Dashboard',
      content: 'View and analyze sales across all your stores.',
      preferredPosition: 'right',
      action: () => setActiveTab('Multi Sales'),
    },
    {
      selector: '[data-tour="multi-inventory"]',
      title: 'Inventory Dashboard',
      content: 'Keep track of stock across your stores.',
      preferredPosition: 'right',
      action: () => setActiveTab('Multi Inventory'),
    },
    {
      selector: '[data-tour="multi-debts"]',
      title: 'Debtors Dashboard',
      content: 'Track and manage outstanding debts.',
      preferredPosition: 'right',
      action: () => setActiveTab('Multi Debts'),
    },
    {
      selector: '[data-tour="store-notifications"]',
      title: 'Notifications',
      content: 'Stay updated with store-related notifications.',
      preferredPosition: 'right',
      action: () => setActiveTab('Store Notifications'),
    },
    {
      selector: '[data-tour="employees"]',
      title: 'Employees',
      content: 'Add and manage your store employees.',
      preferredPosition: 'right',
      action: () => setActiveTab('Employees'),
    },
    {
      selector: '[data-tour="upgrade"]',
      title: 'Upgrade Your Plan',
      content: 'Unlock premium features and plans.',
      preferredPosition: 'right',
      action: () => setActiveTab('Upgrade'),
    },
    {
      selector: '[data-tour="dark-mode"]',
      title: 'Light/Dark Mode',
      content: 'Toggle between light and dark mode for a comfortable experience.',
      preferredPosition: 'top',
    },
  ];

  useEffect(() => {
    if (isOpen && currentStep >= 0 && tourSteps[currentStep]) {
      const element = document.querySelector(tourSteps[currentStep].selector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('tour-highlight');
      }
      if (tourSteps[currentStep].action) {
        tourSteps[currentStep].action();
      }
      return () => {
        if (element) {
          element.classList.remove('tour-highlight');
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isOpen]); // tourSteps is constant and doesn't need to be a dependency

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleStartTour = () => {
    setCurrentStep(0);
  };

  if (!isOpen) return null;

  // Welcome Screen
  if (currentStep === -1) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-6 rounded-lg shadow-lg w-full max-w-md text-center"
          role="dialog"
          aria-labelledby="welcome-title"
        >
          <h2 id="welcome-title" className="text-2xl font-bold mb-4">
            Welcome to Your Dashboard!
          </h2>
          <p className="mb-6 text-sm md:text-base">
            Let’s take a quick tour to explore the key features and get you started managing your stores efficiently.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleSkip}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-sm md:text-base"
              aria-label="Skip the onboarding tour"
            >
              Skip
            </button>
            <button
              onClick={handleStartTour}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm md:text-base"
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
  const currentTourStep = tourSteps[currentStep];
  const element = document.querySelector(currentTourStep.selector);
  let positionStyles = {};
  let actualPosition = currentTourStep.preferredPosition;

  if (element) {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320; // Approximate max-width of tooltip (max-w-sm ≈ 320px)
    const tooltipHeight = 200; // Approximate height of tooltip
    const padding = 16; // Padding from viewport edges

    // Check viewport boundaries
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Preferred position: right
    if (currentTourStep.preferredPosition === 'right') {
      const rightSpace = viewportWidth - rect.right;
      if (rightSpace >= tooltipWidth + padding) {
        positionStyles = {
          top: rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + window.scrollX + 10,
        };
      } else {
        // Fallback to bottom if right is not feasible
        actualPosition = 'bottom';
        const bottomSpace = viewportHeight - rect.bottom;
        if (bottomSpace >= tooltipHeight + padding) {
          positionStyles = {
            top: rect.bottom + window.scrollY + 10,
            left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
          };
        } else {
          // Fallback to top if bottom is also not feasible
          actualPosition = 'top';
          positionStyles = {
            top: rect.top + window.scrollY - tooltipHeight - 10,
            left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
          };
        }
      }
    }
    // Preferred position: top
    else if (currentTourStep.preferredPosition === 'top') {
      const topSpace = rect.top;
      if (topSpace >= tooltipHeight + padding) {
        positionStyles = {
          top: rect.top + window.scrollY - tooltipHeight - 10,
          left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
        };
      } else {
        // Fallback to bottom
        actualPosition = 'bottom';
        positionStyles = {
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
        };
      }
    }

    // Ensure tooltip stays within viewport
    positionStyles.left = Math.max(
      padding,
      Math.min(positionStyles.left, viewportWidth - tooltipWidth - padding)
    );
    positionStyles.top = Math.max(
      padding,
      Math.min(positionStyles.top, viewportHeight - tooltipHeight - padding)
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div
        className="absolute bg-white dark:bg-gray-800 text-gray-800 dark:text-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-sm"
        style={positionStyles}
        role="dialog"
        aria-labelledby={`step-title-${currentStep}`}
      >
        <h2
          id={`step-title-${currentStep}`}
          className="text-lg md:text-xl font-bold mb-2"
        >
          {currentTourStep.title}
        </h2>
        <p className="mb-4 text-sm md:text-base">
          Step {currentStep + 1} of {tourSteps.length}: {currentTourStep.content}
        </p>
        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="px-3 py-1 md:px-4 md:py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-sm md:text-base"
            aria-label="Skip the onboarding tour"
          >
            Skip Tour
          </button>
          <div>
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-3 py-1 md:px-4 md:py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 mr-2 text-sm md:text-base"
                aria-label="Go to previous tour step"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-3 py-1 md:px-4 md:py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm md:text-base"
              aria-label={
                currentStep === tourSteps.length - 1
                  ? 'Finish the tour'
                  : 'Go to next tour step'
              }
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
        ></div>
      </div>
    </div>
  );
};

export default OnboardingTour;