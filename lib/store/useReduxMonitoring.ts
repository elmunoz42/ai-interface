'use client';

import { useEffect } from 'react';
import { useAppSelector } from './hooks';

export const useReduxMonitoring = () => {
  const { messages, loading, error, inputText } = useAppSelector(state => state.chat);
  const { temperature, maxTokens } = useAppSelector(state => state.aiParams);
  const { selectedPromptRecipe } = useAppSelector(state => state.ui);

  // Redux state monitoring for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Redux State Update:', {
        chat: {
          messagesCount: messages.length,
          loading,
          error,
          inputTextLength: inputText.length,
          inputPreview: inputText.substring(0, 30) + (inputText.length > 30 ? '...' : '')
        },
        aiParams: { temperature, maxTokens },
        ui: { selectedPromptRecipe }
      });
    }
  }, [messages, loading, error, inputText, temperature, maxTokens, selectedPromptRecipe]);

  // State validation
  useEffect(() => {
    const validations = [
      { check: temperature >= 0 && temperature <= 1, message: 'Temperature out of range' },
      { check: maxTokens >= 50 && maxTokens <= 4000, message: 'MaxTokens out of range' },
      { check: Array.isArray(messages), message: 'Messages should be array' },
      { check: typeof inputText === 'string', message: 'InputText should be string' },
    ];

    validations.forEach(({ check, message }) => {
      if (!check) {
        console.error('❌ State Validation Failed:', message);
      }
    });
  }, [temperature, maxTokens, messages, inputText]);
};
