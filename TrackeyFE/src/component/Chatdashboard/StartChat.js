// src/components/Chatdashboard/StartChat.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatWindow from  './ChatWindow'

const StartChat = () => {
  const [guestEmail, setGuestEmail] = useState('');
  const navigate = useNavigate(); // Use `useNavigate` hook from React Router v6

  // Function to set user role in local storage
  const setUserRole = (email, role) => {
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_role', role); // role can be 'client', 'cleaner', 'admin', or 'guest'
  };

  useEffect(() => {
    // Assign a guest role when the user hasn't logged in yet
    const guestId = localStorage.getItem('user_email');
    if (!guestId) {
      const generatedEmail = `guest-${Date.now()}@example.com`; // generate a unique email for the guest session
      setGuestEmail(generatedEmail);
      setUserRole(generatedEmail, 'guest');
    }
  }, []);

  const handleStartChat = () => {
    if (!guestEmail) return;

    // Use `navigate` to change routes programmatically
    navigate(`/chat/${guestEmail}`);
  };

  return (
    <div className="start-chat p-4">
      <button className="bg-blue-500 text-white p-2 rounded" onClick={handleStartChat}>
        Start New Chat
      </button>
      <ChatWindow/>
    </div>
  );
};

export default StartChat;
