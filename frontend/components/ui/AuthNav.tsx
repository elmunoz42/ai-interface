"use client";
import React, { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import LoginForm from '../LoginForm';

const AuthNav = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Session check logic
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/rag/status/', { credentials: 'include' });
        setIsAuthenticated(res.status === 200);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await fetch('http://127.0.0.1:8000/admin/logout/', { credentials: 'include' });
    setIsAuthenticated(false);
  };

  const buttonStyle = {
    padding: '6px 16px',
    fontWeight: 500,
    background: '#10a37f', // OpenAI green
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginLeft: 8,
  };

  // Modal state for login
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      {isAuthenticated ? (
        <button onClick={handleLogout} style={buttonStyle}>
          Logout
        </button>
      ) : (
        <button style={buttonStyle} onClick={() => setLoginOpen(true)}>
          Login
        </button>
      )}
      <Modal open={loginOpen} onClose={() => setLoginOpen(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', p: 4, borderRadius: 2, boxShadow: 24 }}>
          <LoginForm />
          <button style={{ marginTop: 16, width: '100%' }} onClick={() => setLoginOpen(false)}>Close</button>
        </Box>
      </Modal>
    </>
  );
};

export default AuthNav;
