import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  onClick: () => void;
}

interface DropdownMenuProps {
  label: string;
  items: DropdownItem[];
  icon?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  label,
  items,
  icon,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        id={`dropdown-btn-${label.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 min-h-[44px]"
      >
        {icon && <span className="text-indigo-400">{icon}</span>}
        <span>{label}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-72 origin-top-right rounded-xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800 shadow-2xl shadow-indigo-950/40 focus:outline-none z-50 p-2 divide-y divide-slate-800/60 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="py-1">
            {items.map((item) => (
              <button
                key={item.id}
                id={`dropdown-item-${item.id}`}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 hover:bg-slate-800/80 transition-colors group text-sm min-h-[44px]"
              >
                {item.icon && (
                  <span className="p-1.5 rounded-md bg-slate-800 text-indigo-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-300 transition-colors mt-0.5">
                    {item.icon}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200 group-hover:text-white truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
