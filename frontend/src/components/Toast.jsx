import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICONS = {
    success: <CheckCircle className="w-5 h-5 text-white" />,
    error:   <XCircle    className="w-5 h-5 text-white" />,
    warning: <AlertTriangle className="w-5 h-5 text-white" />,
    info:    <Info       className="w-5 h-5 text-white" />,
};

const BG = {
    success: 'linear-gradient(135deg, #16a34a, #15803d)',
    error:   'linear-gradient(135deg, #dc2626, #b91c1c)',
    warning: 'linear-gradient(135deg, #d97706, #b45309)',
    info:    'linear-gradient(135deg, #1a56db, #1e40af)',
};

/**
 * Single toast item — auto-dismisses after `duration` ms.
 */
export const ToastItem = ({ id, type = 'info', message, onRemove }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Slide in
        const t1 = setTimeout(() => setVisible(true), 20);
        // Slide out then remove
        const t2 = setTimeout(() => setVisible(false), 3500);
        const t3 = setTimeout(() => onRemove(id), 3800);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, [id, onRemove]);

    return (
        <div
            style={{
                background: BG[type] || BG.info,
                transform: visible ? 'translateX(0)' : 'translateX(110%)',
                opacity: visible ? 1 : 0,
                transition: 'transform 0.35s cubic-bezier(.22,1,.36,1), opacity 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                minWidth: '280px',
                maxWidth: '380px',
                pointerEvents: 'all',
            }}
        >
            {/* Icon bubble */}
            <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '6px',
                flexShrink: 0,
            }}>
                {ICONS[type] || ICONS.info}
            </div>

            {/* Message */}
            <p style={{
                flex: 1,
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: 1.4,
                margin: 0,
            }}>
                {message}
            </p>

            {/* Close button */}
            <button
                onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300); }}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                }}
            >
                <X className="w-4 h-4 text-white" />
            </button>
        </div>
    );
};

/**
 * Toast container — render this once near the top of your page/layout.
 * Pass the `toasts` array and `removeToast` function from `useToast()`.
 */
export const ToastContainer = ({ toasts, removeToast }) => (
    <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
    }}>
        {toasts.map(t => (
            <ToastItem key={t.id} {...t} onRemove={removeToast} />
        ))}
    </div>
);
