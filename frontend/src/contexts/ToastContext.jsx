import { createContext, useContext, useCallback, useState } from 'react';

const ToastContext = createContext();

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, action, ...props }) => {
    const id = ++_id;
    setToasts((t) => [...t, { id, title, description, action, ...props }]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 5000);
    
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, remove }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
