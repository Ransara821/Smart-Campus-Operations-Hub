import { useState, useCallback } from 'react';

/**
 * useToast — lightweight toast state manager.
 *
 * Usage:
 *   const { toasts, removeToast, showToast } = useToast();
 *
 *   showToast('Saved!', 'success');
 *   showToast('Something went wrong', 'error');
 *   showToast('Please fill in all fields', 'warning');
 *   showToast('Booking request sent', 'info');
 *
 * Then render:
 *   <ToastContainer toasts={toasts} removeToast={removeToast} />
 */
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, showToast, removeToast };
};
