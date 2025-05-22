import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const Chatbox = ({ closeChat }) => {  // Add closeChat prop to handle closing
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [faqs, setFAQs] = useState([]);
// Track if bot or admin is answering

  // Fetch FAQs and initial data
  useEffect(() => {
    const fetchFAQs = async () => {
      const { data: faqsData, error } = await supabase.from('faqs').select('*');
      if (error) console.error('Error fetching FAQs:', error);
      else setFAQs(faqsData);
    };
    fetchFAQs();
  }, []);

  // Handle message sending
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user's message to chat
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);

    // Process message with Smart Assistant
    const botReply = await processMessage(input);
    
    // Add bot's reply to chat
    setMessages((prev) => [
      ...prev,
      { sender: 'bot', text: botReply },
    ]);

    setInput('');
  };

  // Process message with Smart Assistant
  const processMessage = async (message) => {
    // Check if the message matches any FAQ question
    const matchedFAQ = faqs.find((faq) =>
      faq.question.toLowerCase().includes(message.toLowerCase())
    );

    if (matchedFAQ) {
      return matchedFAQ.answer; // Respond with FAQ answer
    }

    // Check if message contains booking-related keywords
    if (message.toLowerCase().includes('book')) {
      // Query cleaning packages if needed
      const { data: packages, error } = await supabase
        .from('cleaning_packages')
        .select('*');
      if (error) console.error('Error fetching packages:', error);

      const packageList = packages
        .map((pkg) => `${pkg.name}: ₦${pkg.price}`)
        .join('\n');

      return `Here are our cleaning packages:\n${packageList}`;
    }

    // If the bot cannot answer, hand over to an online agent
    return 'I am unable to answer that question. Please wait while I connect you to an online agent.';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg w-80">
      <div className="p-4 bg-green-700 text-white flex justify-between items-center">
        <span className="font-bold">Smart Assistant</span>
        <button
          onClick={closeChat}  // Trigger close function
          className="text-white"
        >
          ✕
        </button>
      </div>
      <div className="p-4 h-64 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 ${
              msg.sender === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <p
              className={`p-2 rounded-lg inline-block ${
                msg.sender === 'user'
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              {msg.text}
            </p>
          </div>
        ))}
      </div>
      <div className="p-2 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border p-2 rounded-l-md"
        />
        <button
          onClick={handleSendMessage}
          className="bg-green-700 text-white p-2 rounded-r-md"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbox;
