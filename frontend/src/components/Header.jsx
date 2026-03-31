// Header.jsx
import React from 'react';
import { FiBell, FiSun, FiMoon } from 'react-icons/fi';

function Header({ title, subtitle }) {
  // Dummy state for theme toggle
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  return (
    <div className="bg-white/60 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-10">
      <div className="lg:ml-72 px-6 lg:px-8 py-5 lg:py-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-oxford to-ylnmn-blue bg-clip-text text-transparent">
            {title}
          </h2>
          {subtitle && (
            <p className="text-slate-600 mt-1 text-sm lg:text-base">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-xl text-slate-500 hover:text-ylnmn-blue transition-colors"
          >
            {isDarkMode ? <FiSun /> : <FiMoon />}
          </button>
          <button className="relative text-xl text-slate-500 hover:text-ylnmn-blue transition-colors">
            <FiBell />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-jordy-blue ring-2 ring-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Header;