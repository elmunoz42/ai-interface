'use client';

import React from 'react';
import { Snackbar } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { clearError } from '../../lib/store/chatSlice';

const ErrorSnackbar = () => {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector(state => state.chat);

  const handleErrorClose = () => {
    dispatch(clearError());
  };

  return (
    <>
      {error && (
        <Snackbar 
          open={!!error} 
          autoHideDuration={3000} 
          message={error} 
          onClose={handleErrorClose}
        />
      )}
    </>
  );
};

export default ErrorSnackbar;
