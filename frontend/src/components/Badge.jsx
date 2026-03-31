// Badge.jsx
import React from 'react';

function Badge({ status, text }) {
  const getStyles = (status) => {
    switch(status) {
      case 'active':
      case 'Active':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm';
      case 'inactive':
      case 'Inactive':
        return 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm';
      case 'pending':
      case 'Pending':
        return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm';
      case 'ADMIN':
        return 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm';
      case 'TECHNICIAN':
        return 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm';
      case 'USER':
        return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm';
    }
  };

  return (
    <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide ${getStyles(status)}`}>
      {text || status}
    </span>
  );
}

export default Badge;