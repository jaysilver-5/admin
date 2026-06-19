'use client';
import React from 'react';

type Item = { name: string; icon: React.ReactNode };
type Props = {
  items: Item[];
  active: string;
  onSelect: (name: string) => void;
};

export default function MobileTabs({ items, active, onSelect }: Props) {
  return (
    <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-gray-200">
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4 py-3 min-w-max">
          {items.map((m) => {
            const isActive = active === m.name;
            return (
              <button
                key={m.name}
                onClick={() => onSelect(m.name)}
                className={`inline-flex items-center gap-2 px-3.5 h-9 rounded-full text-sm border
                  ${isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                <span className={`${isActive ? 'text-blue-700' : 'text-gray-400'}`}>{m.icon}</span>
                <span className="whitespace-nowrap">{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
