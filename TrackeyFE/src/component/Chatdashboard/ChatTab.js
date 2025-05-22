import React, { useState } from 'react';
import ChatBox from './Chatbox'
import ChatWindow from './ChatWindow';  // Real-Time Chat component

const ChatTab = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);  // To toggle the visibility of the chat
  const [activeTab, setActiveTab] = useState('chatwindow');  // Keeps track of the active tab
  const [messages, setMessages] = useState([]);  // Holds the conversation

  // Toggle the chat window visibility
  const toggleChatWindow = () => {
    setIsChatOpen((prev) => !prev);
    if (isChatOpen) setActiveTab('chatwindow'); // Reset tab to default when reopening
  };

  // Handle tab change (Smart Assistant vs. Real-Time Chat)
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <>
      {/* Fixed pop-up button to open chat */}
      <div
        onClick={toggleChatWindow}
        className="fixed bottom-4 right-4 bg-green-700 p-4 text-white rounded-full cursor-pointer"
      >
        Chat
      </div>

      {/* The chat window */}
      {isChatOpen && (
        <div className="fixed bottom-16 right-4 bg-white shadow-lg rounded-lg w-80 h-96">
          {/* Header with close button */}
          <div className="p-4 bg-green-700 text-white flex justify-between items-center">
            <span className="font-bold">Chat</span>
            <button onClick={toggleChatWindow} className="text-white">
              ✕
            </button>
          </div>

          {/* Tabs for switching between components */}
          <div className="flex border-b">
            <button
              className={`w-1/2 py-2 ${activeTab === 'chatbox' ? 'bg-green-700 text-white' : 'text-green-700'}`}
              onClick={() => handleTabChange('chatbox')}
            >
              Smart Assistant
            </button>
            <button
              className={`w-1/2 py-2 ${activeTab === 'chatwindow' ? 'bg-green-700 text-white' : 'text-green-700'}`}
              onClick={() => handleTabChange('chatwindow')}
            >
              Real-Time Chat
            </button>
          </div>

          {/* Display the corresponding component based on active tab */}
          {activeTab === 'chatbox' ? (
            <ChatBox messages={messages} setMessages={setMessages} />
          ) : (
            <ChatWindow messages={messages} setMessages={setMessages} />
          )}
        </div>
      )}
    </>
  );
};

export default ChatTab;
