import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import aiParamsReducer from './aiParamsSlice';
import uiReducer from './uiSlice';

// Custom logging middleware for development
const loggerMiddleware = (storeAPI: any) => (next: any) => (action: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚀 Action: ${action.type}`);
    console.log('Previous State:', storeAPI.getState());
    console.log('Action:', action);
    const result = next(action);
    console.log('Next State:', storeAPI.getState());
    console.groupEnd();
    return result;
  }
  return next(action);
};

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    aiParams: aiParamsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(loggerMiddleware),
  devTools: process.env.NODE_ENV !== 'production' && {
    name: 'AI Chat Redux Store',
    trace: true,
    traceLimit: 25,
  },
});

// Debug Redux DevTools availability
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Redux store created:', store.getState());
  
  if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    console.log('✅ Redux DevTools detected and enabled');
  } else {
    console.log('❌ Redux DevTools not found - install Redux DevTools browser extension');
  }
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
