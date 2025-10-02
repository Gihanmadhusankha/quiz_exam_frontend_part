import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logOut } from '../api/auth';

function Header() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await logOut(token);
      }
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="bg-gray-400 text-white px-4 py-2 rounded-b-sm shadow flex items-center ">
      <span className='w-3 h-3 bg-gray-500 rounded-full inline-block mr-2'></span>
      <span className='w-3 h-3 bg-gray-500 rounded-full inline-block mr-2'></span>
      <span className='w-3 h-3 bg-gray-500 rounded-full inline-block mr-2'></span>

      {isLoggedIn && (
        <button
          onClick={handleLogout}
          className="ml-auto bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white font-bold"
        >
          Logout
        </button>
      )}
    </div>
  );
}

export default Header;
