import { useCallback, useState } from "react";

let _id = 0;

// Minimal in-memory toast hook used by Toaster component
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, action, ...props }) => {
    const id = ++_id;
    setToasts((t) => [...t, { id, title, description, action, ...props }]);
    return id;
  }, []);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  return { toasts, toast, remove };
}
