// TeamManagement.js
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [notification, setNotification] = useState('');
  const storeId = localStorage.getItem('store_id');

  // Function to fetch team members (only select required columns)
  const fetchTeamMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from('store_users')
      .select('id, full_name, email_address, phone_number')
      .eq('store_id', storeId);
    if (error) {
      console.error('Error fetching team members:', error.message);
      setNotification('Error retrieving team members.');
    } else {
      setTeamMembers(data);
    }
  }, [storeId]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded shadow max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-indigo-800 dark:text-white mb-4">
        Team Management
      </h2>
      
      {notification && (
        <div className="mb-4 p-2 text-green-600">
          {notification}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-indigo-200 text-left">
              <th className="p-2">Full Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => (
              <tr key={member.id} className="border-t">
                <td className="p-2">{member.full_name}</td>
                <td className="p-2">{member.email_address}</td>
                <td className="p-2">{member.phone_number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamManagement;
