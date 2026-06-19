'use client';
import React from 'react';

type Item = { name: string; icon: React.ReactNode };
type Props = {
  items: Item[];
  active: string;
  onSelect: (name: string) => void;
  className?: string;
};

export default function Sidebar({ items, active, onSelect, className = '' }: Props) {
  return (
    <aside
      className={`hidden lg:flex w-[220px] shrink-0 bg-white border-r border-gray-200 ${className}`}
      aria-label="Sidebar"
    >
      <div className="w-full">
        <div className="px-4 py-5">{/* add logo if you like */}</div>
        <nav className="px-3 space-y-1">
          {items.map((m) => {
            const isActive = active === m.name;
            return (
              <button
                key={m.name}
                onClick={() => onSelect(m.name)}
                className={`w-full flex items-center gap-3 h-11 px-3 rounded-xl text-[13px] transition
                  ${isActive ? 'bg-[#E8F0FF] text-[#1E63F1]' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span className={`${isActive ? 'text-[#1E63F1]' : 'text-gray-400'}`}>{m.icon}</span>
                <span className="truncate">{m.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
