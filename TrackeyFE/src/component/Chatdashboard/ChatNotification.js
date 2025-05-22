import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Import Supabase client
import { FaBell } from 'react-icons/fa'; // Import the bell icon from react-icons

const ChatNotification = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications and unread count
  useEffect(() => {
    const fetchNotifications = async () => {
      // Fetch all unread notifications initially
      const { data, error } = await supabase
        .from('chat_notifications')
        .select('*')
        .eq('is_read', false); // Assuming 'is_read' tracks read/unread status
      
      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setUnreadCount(data.length); // Set unread count based on the fetched data
      }
    };

    fetchNotifications();

    // Subscribe to real-time updates for the 'chat_notifications' table
    const channel = supabase
      .channel('chat_notifications') // Use the channel method
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_notifications' }, (payload) => {
        if (payload.new.is_read === false) {
          setUnreadCount((prevCount) => prevCount + 1); // Increase unread count on new notification
        }
      })
      .subscribe();

    // Clean up subscription on component unmount
    return () => {
      supabase.removeChannel(channel); // Remove the channel when the component is unmounted
    };
  }, []);

  // Mark notifications as read when the bell icon is clicked
  const handleBellClick = async () => {
    // Mark all notifications as read
    const { error } = await supabase
      .from('chat_notifications')
      .update({ is_read: true })
      .eq('is_read', false); // Update unread notifications

    if (error) {
      console.error('Error marking notifications as read:', error);
    } else {
      setUnreadCount(0); // Reset unread count after reading notifications
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon with unread notification count */}
      <button
        onClick={handleBellClick}
        className="relative rounded-full hover:bg-gray-200 p-0.5"
      >
        <FaBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 text-xs text-white bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatNotification;
