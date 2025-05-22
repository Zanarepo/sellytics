import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppChatPopup() {
  const [open, setOpen] = useState(false);
  const [showAutoMessage, setShowAutoMessage] = useState(false);
  const phone = '2349167690043';
  const message = encodeURIComponent('Welcome to Sellytics');
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  // Auto-display welcome message with a 3-second delay on page load
  useEffect(() => {
    const messageTimer = setTimeout(() => {
      setShowAutoMessage(true);
    }, 10000); // 3-second delay

    // Clear the auto-message after 10 seconds
    const clearTimer = setTimeout(() => {
      setShowAutoMessage(false);
    }, 16000); // 3-second delay + 10-second display

    // Cleanup timers on component unmount
    return () => {
      clearTimeout(messageTimer);
      clearTimeout(clearTimer);
    };
  }, []);

  return (
    <>
      {/* CTA text above the chat icon */}
      <div className="fixed bottom-20 right-4 text-sm text-indigo-800 z-50">
        Talk to us
      </div>

      {/* Chat head bubble */}
      <div
        className="fixed bottom-4 right-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-4 shadow-lg cursor-pointer z-50"
        onClick={() => setOpen(!open)}
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle size={24} />
      </div>

      {/* Auto-display welcome message */}
      {showAutoMessage && (
        <div className="fixed bottom-20 right-4 bg-white border rounded-lg shadow-lg w-64 z-50">
          <div className="p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Welcome to Sellytics!</h3>
            <p className="text-sm mb-4">How can we help you today?</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded"
            >
              Start Chat
            </a>
            <button
              onClick={() => setShowAutoMessage(false)}
              className="mt-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Manual popup window */}
      {open && !showAutoMessage && (
        <div className="fixed bottom-20 right-4 bg-white border rounded-lg shadow-lg w-64 z-50">
          <div className="p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Chat with us!</h3>
            <p className="text-sm mb-4">Welcome to Sellytics</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded"
            >
              Start Chat
            </a>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}