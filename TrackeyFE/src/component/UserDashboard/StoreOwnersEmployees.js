import React, { useState } from 'react';
import TeamMembers from './TeamMembers';
import InviteLink from './InviteLink';
import AttendantsTable from './AttendantsTable';
import { FaUserFriends, FaLink, FaUsers } from 'react-icons/fa';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('attendants');

  const renderContent = () => {
    switch (activeTab) {
      case 'teamMembers':
        return <TeamMembers />;
      case 'inviteLink':
        return <InviteLink />;
      case 'attendants':
        return <AttendantsTable />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4">
      <h1 className="text-3xl font-bold text-center text-indigo-800 dark:text-white mb-6">
        Dashboard
      </h1>
      
      {/* Icon Navigation */}
      <div className="flex justify-center mb-6">
  <div className="flex flex-col md:flex-row gap-4 items-center justify-center w-full max-w-md">
    <button
      onClick={() => setActiveTab('attendants')}
      className={`flex flex-col items-center w-full md:w-auto p-4 bg-white dark:bg-gray-900 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300 
        ${activeTab === 'attendants' ? 'border-2 border-indigo-500' : ''}`}
    >
      <FaUsers className="text-3xl md:text-4xl text-indigo-600 mb-2" />
      <span className="text-base md:text-lg text-indigo-800 dark:text-white">Attendants</span>
    </button>

    <button
      onClick={() => setActiveTab('teamMembers')}
      className={`flex flex-col items-center w-full md:w-auto p-4 bg-white dark:bg-gray-900 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300 
        ${activeTab === 'teamMembers' ? 'border-2 border-indigo-500' : ''}`}
    >
      <FaUserFriends className="text-3xl md:text-4xl text-indigo-600 mb-2" />
      <span className="text-base md:text-lg text-indigo-800 dark:text-white">Team Members</span>
    </button>

    <button
      onClick={() => setActiveTab('inviteLink')}
      className={`flex flex-col items-center w-full md:w-auto p-4 bg-white dark:bg-gray-900 rounded-lg shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300 
        ${activeTab === 'inviteLink' ? 'border-2 border-indigo-500' : ''}`}
    >
      <FaLink className="text-3xl md:text-4xl text-indigo-600 mb-2" />
      <span className="text-base md:text-lg text-indigo-800 dark:text-white">Invite Link</span>
    </button>
  </div>
</div>


      {/* Content Area */}
      <div className="bg-white dark:bg-gray-900">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;