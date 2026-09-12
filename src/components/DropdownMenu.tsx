import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownSubItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  onClick: () => void;
}

export interface DropdownGroupItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  isGroup: true;
  defaultExpanded?: boolean;
  subItems: DropdownSubItem[];
}

export interface DropdownSingleItem extends DropdownSubItem {
  isGroup?: false;
}

export type DropdownMenuItem = DropdownSingleItem | DropdownGroupItem;

interface DropdownMenuProps {
  label: string;
  items: DropdownMenuItem[];
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.isGroup) {
        initial[item.id] = item.defaultExpanded ?? true;
      }
    });
    return initial;
  });

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

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        id={`dropdown-btn-${label.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[44px] cursor-pointer"
      >
        {icon && <span className="text-indigo-600">{icon}</span>}
        <span>{label}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-72 origin-top-right rounded-xl bg-white border border-slate-200 shadow-xl focus:outline-none z-50 p-2 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="py-1 space-y-1">
            {items.map((entry) => {
              if (entry.isGroup) {
                const isExpanded = expandedGroups[entry.id] ?? true;
                return (
                  <div key={entry.id} className="pt-0.5">
                    <button
                      type="button"
                      id={`dropdown-group-toggle-${entry.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroup(entry.id);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors group text-sm min-h-[40px] cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        {entry.icon && (
                          <span className="p-1 rounded-md bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                            {entry.icon}
                          </span>
                        )}
                        <span className="text-xs uppercase tracking-wider font-bold text-slate-700">
                          {entry.label}
                        </span>
                        {entry.badge && (
                          <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {entry.badge}
                          </span>
                        )}
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-indigo-600' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="pl-3 ml-2 border-l border-slate-200 space-y-0.5 mt-0.5 mb-1 animate-in fade-in duration-150">
                        {entry.subItems.map((sub) => (
                          <button
                            key={sub.id}
                            id={`dropdown-item-${sub.id}`}
                            onClick={() => {
                              sub.onClick();
                              setIsOpen(false);
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-lg flex items-start gap-2.5 hover:bg-slate-50 transition-colors group text-sm min-h-[40px] cursor-pointer"
                          >
                            {sub.icon && (
                              <span className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mt-0.5">
                                {sub.icon}
                              </span>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-800 group-hover:text-slate-900 truncate text-xs sm:text-sm">
                                  {sub.label}
                                </span>
                                {sub.badge && (
                                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {sub.badge}
                                  </span>
                                )}
                              </div>
                              {sub.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                  {sub.description}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Single regular item
              return (
                <div key={entry.id} className="pt-1 border-t border-slate-100 first:border-t-0 first:pt-0">
                  <button
                    id={`dropdown-item-${entry.id}`}
                    onClick={() => {
                      entry.onClick();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg flex items-start gap-3 hover:bg-slate-50 transition-colors group text-sm min-h-[44px] cursor-pointer"
                  >
                    {entry.icon && (
                      <span className="p-1.5 rounded-md bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition-colors mt-0.5">
                        {entry.icon}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 group-hover:text-slate-900 truncate">
                          {entry.label}
                        </span>
                        {entry.badge && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {entry.badge}
                          </span>
                        )}
                      </div>
                      {entry.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
