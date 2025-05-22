import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
// import ChatNotification from './ChatNotification';
import { FaBars, FaTimes } from 'react-icons/fa';

const AdminChatUi = ({ darkMode }) => { // Dark mode is controlled by the parent component
  const [messages, setMessages] = useState([]);
  const [response, setResponse] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guestList, setGuestList] = useState([]);
  const [guestNames, setGuestNames] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- DARK MODE SETUP (controlled by parent) ---
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  // --------------------------------

  // Fetch distinct guests (excluding admin)
  useEffect(() => {
    const fetchGuestList = async () => {
      try {
        const { data, error } = await supabase
          .from('sprints_messages')
          .select('sender')
          .neq('sender', 'admin');
        if (error) throw error;

        const distinctGuests = [...new Set(data.map((entry) => entry.sender))];
        setGuestList(distinctGuests);

        // Map guest IDs to friendly names (e.g., "Sprinters 1", "Sprinters 2")
        const namesMapping = distinctGuests.reduce((acc, guest, index) => {
          acc[guest] = `Sprinters ${index + 1}`;
          return acc;
        }, {});
        setGuestNames(namesMapping);
      } catch (error) {
        console.error('Error fetching guest list:', error.message);
      }
    };

    fetchGuestList();
  }, []);

  // Fetch messages for the selected guest
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedGuest) return;

      try {
        const { data, error } = await supabase
          .from('sprints_messages')
          .select('*')
          .or(`sender.eq.${selectedGuest},receiver.eq.${selectedGuest}`)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error.message);
      }
    };

    fetchMessages();
  }, [selectedGuest]);

  // Subscribe to real-time message updates
  useEffect(() => {
    const channel = supabase
      .channel('sprints_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sprints_messages' },
        (payload) => {
          if (
            payload.new.sender === selectedGuest ||
            payload.new.receiver === selectedGuest
          ) {
            setMessages((prevMessages) => [...prevMessages, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedGuest]);

  // Send a reply from the admin
  const handleSendReply = async () => {
    if (!response.trim() || !selectedGuest) return;

    const newMessage = {
      sender: 'admin',
      receiver: selectedGuest,
      text: response,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('sprints_messages').insert([newMessage]);
      if (error) throw error;
      setResponse('');
    } catch (error) {
      console.error('Error sending message:', error.message);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Conditionally render the Sidebar only when open.
          When closed, it doesn't render so the Chat UI occupies full width. */}
      {isSidebarOpen && (
        <div className="transition-all duration-300 bg-gray-800 text-white flex-shrink-0 w-64">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-yellow-700">
            <h2 className="font-bold text-yellow-600 flex-1 text-center">Sprinters</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="focus:outline-none"
            >
              <FaTimes size={20} />
            </button>
          </div>
          {/* Guest List */}
          <ul className="overflow-y-auto h-full">
            {guestList.length === 0 ? (
              <li className="p-4 text-gray-400">No Sprinters yet.</li>
            ) : (
              guestList.map((guest, index) => (
                <li
                  key={index}
                  className={`p-4 cursor-pointer ${
                    selectedGuest === guest
                      ? 'bg-yellow-700 text-white'
                      : 'hover:bg-yellow-700'
                  }`}
                  onClick={() => setSelectedGuest(guest)}
                >
                  {guestNames[guest] || guest}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 relative">
        {/* If the sidebar is closed, display an absolute toggle button 
            so that the Chat UI occupies full width */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-0 top-4 p-2 z-10 bg-gray-800 text-white rounded focus:outline-none"
          >
            <FaBars size={20} />
          </button>
        )}

        {/* Chat Header */}
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b">
          <h1 className="text-xl font-bold text-justify-center  text-yellow-800 dark:text-yellow">
            {selectedGuest
              ? guestNames[selectedGuest] || selectedGuest
              : 'Select a Sprinter'}
          </h1>
        </header>

        {/* Messages Section */}
        <div className="flex-1 overflow-auto p-4 border-b">
          {messages.length === 0 ? (
            <p className="text-yellow-800">No messages yet. Start chatting!</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex mb-2 ${
                  msg.sender === 'admin' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div>
                  <p
                    className={`inline-block p-2 rounded-lg max-w-xs ${
                      msg.sender === 'admin'
                        ? 'bg-yellow-700 text-white text-right'
                        : 'bg-yellow-600 text-white text-left'
                    }`}
                  >
                    {msg.text}
                  </p>
                  {/* Display message sent date */}
                  <small className="block text-xs text-gray-500 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </small>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Section */}
        <div className="p-4 border-t flex items-center text-yellow-800 dark:text-yellow">
          <input
            type="text"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type a reply..."
            className="flex-1 border rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            onClick={handleSendReply}
            className="bg-yellow-800 font-semibold text-white p-2 rounded-r-md hover:bg-yellow-600 focus:outline-none"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminChatUi;
