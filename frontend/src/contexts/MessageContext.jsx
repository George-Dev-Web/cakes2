// frontend/src/contexts/MessageContext.jsx
import { createContext, useContext, useState, useCallback } from "react";

const MessageContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useMessage = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
  const [message, setMessage] = useState(null); // { text, type }
  const [visible, setVisible] = useState(false);

  const showMessage = useCallback((text, type = "info", duration = 3000) => {
    setMessage({ text, type });
    setVisible(true);

    // Auto-hide after duration
    setTimeout(() => {
      setVisible(false);
    }, duration);
  }, []);

  const clearMessage = () => {
    setVisible(false);
    setMessage(null);
  };

  return (
    <MessageContext.Provider
      value={{ message, visible, showMessage, clearMessage }}
    >
      {children}
    </MessageContext.Provider>
  );
};
