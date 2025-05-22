import React, { useState } from 'react';
import { supabase } from '../../supabaseClient'; // Adjust the import to your project structure

// Password hashing function using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convert bytes to a hex string.
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function RegisterForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin'); // Default to "admin"
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Basic validation
    if (!fullName || !email || !password || !role) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    try {
      const hashedPassword = await hashPassword(password);

      // Insert the new admin record into the printers_admin table.
      // (Adjust this part if you use a different backend.)
      const { error } = await supabase.from('sprintify_admin').insert({
        full_name: fullName,
        email: email,
        password: hashedPassword,
        role: role,
        status: 'active', // Default status
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Registration successful!');
        // Clear form fields
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('admin');
      }
    } catch (error) {
      setErrorMessage('Error during registration: ' + error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-2/3 p-6 bg-yellow-600 border rounded shadow mt-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        
        {/* Inline message displays */}
        {errorMessage && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-4">
            <label htmlFor="fullName" className="block mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          {/* Email */}
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          {/* Password with toggle */}
          <div className="mb-4 relative">
            <label htmlFor="password" className="block mb-1">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter a secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-gray-600"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
            <small className="block mt-1 text-white">
              Password must be at least 6 characters long and include a mix of letters and numbers.
            </small>
          </div>
          
          {/* Role Dropdown */}
          <div className="mb-4">
            <label htmlFor="role" className="block mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;
