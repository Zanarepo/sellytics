import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppChatPopup() {
  const [open, setOpen] = useState(false);
  const phone = '2349167690043';
  const message = encodeURIComponent('Welcome to Sellytics');
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  return (
    <>
      {/* CTA text above the chat icon */}
      <div className="fixed bottom-20 right-4 text-sm text-gray-800 z-50">
        Talk to us
      </div>

      {/* Chat head bubble */}
      <div
        className="fixed bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg cursor-pointer z-50"
        onClick={() => setOpen(!open)}
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle size={24} />
      </div>

      {/* Popup window */}
      {open && (
        <div className="fixed bottom-20 right-4 bg-white border rounded-lg shadow-lg w-64 z-50">
          <div className="p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Chat with us!</h3>
            <p className="text-sm mb-4">Welcome to Sellytics</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center bg-green-500 hover:bg-green-600 text-white py-2 rounded"
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
