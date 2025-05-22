import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Import Supabase client
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { AiOutlineMessage } from 'react-icons/ai'; // Chat icon




const ChatWindow = () => {
  const [messages, setMessages] = useState([]); // Holds the messages in the chat
  const [message, setMessage] = useState(''); // Holds the input message
  const [guestId, setGuestId] = useState(''); // Unique guest ID
  const [isChatStarted, setIsChatStarted] = useState(false); // Chat started flag
  const [isChatVisible, setIsChatVisible] = useState(false); // Popup visibility flag

  const receiver = 'admin'; // Admin is always the receiver in guest chats
  useEffect(() => {
    const storedGuestId = localStorage.getItem('guest_id');
    if (storedGuestId) {
      setGuestId(storedGuestId);
      setIsChatStarted(true); // Resume chat if guest ID exists
    } else {
      setIsChatStarted(false); // No chat started
    }
  }, []);

  // Fetch messages for the current guest ID
  useEffect(() => {
    const fetchMessages = async () => {
      if (!guestId) return;

      const { data, error } = await supabase
        .from('sprints_messages')
        .select('*')
        .or(`sender.eq.${guestId},receiver.eq.${guestId}`) // Filter by guest ID
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data); // Update messages
      }
    };

    fetchMessages();
  }, [guestId]);

  // Subscribe to real-time updates for the 'messages' table
  useEffect(() => {
    if (!guestId) return;

    const channel = supabase
      .channel('sprints_messages') // Use the channel method
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sprints_messages' }, (payload) => {
        if (
          payload.new.sender === guestId || 
          payload.new.receiver === guestId
        ) {
          setMessages((prevMessages) => [...prevMessages, payload.new]); // Add new message to the list
        }
      })
      .subscribe();

    // Clean up subscription on component unmount or when guestId changes
    return () => {
      supabase.removeChannel(channel); // Remove the channel when the component is unmounted
    };
  }, [guestId]); // Re-subscribe when guestId changes

  // Send a new message
  const handleSendMessage = async () => {
    if (!message.trim() || !guestId) return;

    const newMessage = {
      sender: guestId,
      receiver: receiver,
      text: message,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('sprints_messages').insert([newMessage]);

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setMessage(''); // Clear input
    }
  };

  // Start a new chat (generate a new guest ID)
  const handleStartNewChat = () => {
    const newGuestId = uuidv4(); // Generate new unique ID
    localStorage.setItem('guest_id', newGuestId); // Store in localStorage
    setGuestId(newGuestId);
    setMessages([]); // Clear previous messages
    setIsChatStarted(true); // Mark chat as started
  };

  // Toggle chat popup visibility
  const toggleChatVisibility = () => {
    setIsChatVisible(!isChatVisible);
  };


  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChatVisibility}
        className="fixed bottom-4 right-4 bg-yellow-800 text-white p-4 rounded-full shadow-lg hover:bg-yellow-600 focus:outline-none z-50"
      >
        <AiOutlineMessage size={24} />
      </button>

      {isChatVisible && (
  <div className="fixed bottom-32 right-4 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-50">
    {/* Chat Header */}
    <div className="bg-yellow-700 text-white p-4 flex justify-between items-center">
      <h3 className="font-bold text-white-600 flex-1 text-center">Hello Sprinter</h3>
      <button
        onClick={toggleChatVisibility}
        className="text-white focus:outline-none"
      >
        ✕
      </button>
    </div>

    {/* Messages Section */}
    <div className="messages h-64 overflow-auto p-4">
      {messages.length === 0 ? (
        <p className="text-white-700">
          Welcome to Sprintify. We are Here to Assist You! And How May We Assist You, Today?
        </p>
      ) : (
        messages.map((msg, index) => (
          <div
            key={index}
            className={`flex mb-2 ${
              msg.sender === guestId ? 'justify-end' : 'justify-start'
            }`}
          >
            <p
              className={`p-2 rounded-lg max-w-xs break-words ${
                msg.sender === guestId
                  ? 'bg-yellow-800 text-white text-right'
                  : 'bg-yellow-600 text-white text-left'
              }`}
            >
              {msg.text}
            </p>
          </div>
        ))
      )}
    </div>

    {/* Input Section */}
    {isChatStarted && (
      <div className="input-area flex items-center p-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border p-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSendMessage}
          className="bg-yellow-800 font-semibold text-white p-2 rounded-r-md hover:bg-yellow-700 focus:outline-none"
        >
          Send
        </button>
      </div>
    )}

    {/* Start New Chat */}
    {!isChatStarted && (
      <div className="p-4 flex justify-center">
        <button
          className="bg-yellow-800 text-white p-2 rounded-lg shadow-lg hover:bg-yellow-600 focus:outline-none"
          onClick={handleStartNewChat}
        >
          Start New Chat
        </button>
      </div>
    )}
  </div>
)}

    </>
  );
};

export default ChatWindow;
