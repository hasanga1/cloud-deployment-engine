"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronsUpDown, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Generic Interface for display
interface NavItem {
  id: number | string;
  name: string;
}

interface NavSelectorProps {
  labelTitle: string;    // Small title (e.g. "ORGANIZATION")
  currentValue?: string; // The selected name (e.g. "Acme Corp")
  items: NavItem[];      // List of options
  onSelect: (item: any) => void;
  
  // 'value' = The main selection box
  // 'trigger' = The small '>' button
  mode: "value" | "trigger"; 
  placeholder?: string;
}

export const NavSelector = ({ 
  labelTitle, 
  currentValue, 
  items, 
  onSelect, 
  mode, 
  placeholder = "Search..." 
}: NavSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter items based on search
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (item: NavItem) => {
    onSelect(item);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative flex items-center" ref={containerRef}>
      
      {/* --- TRIGGER BUTTON --- */}
      {mode === "value" ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            group flex flex-col items-start justify-center 
            px-3 py-1.5 rounded-lg border transition-all duration-200 min-w-[140px]
            ${isOpen 
              ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-100" 
              : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
            }
          `}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">
              {labelTitle}
            </span>
            <ChevronsUpDown size={12} className="text-slate-300 group-hover:text-blue-500" />
          </div>
          <span className="font-semibold text-slate-800 text-sm truncate max-w-[140px]">
            {currentValue}
          </span>
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            ml-2 p-2 rounded-lg border transition-all duration-200
            ${isOpen 
              ? "border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-100" 
              : "border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-slate-50"
            }
          `}
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* --- POPUP DROPDOWN --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 z-50 overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-8 text-xs text-slate-400 text-center flex flex-col items-center gap-2">
                  <span className="text-lg">🔍</span>
                  No results found
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                  >
                    <span className="truncate font-medium">{item.name}</span>
                    {currentValue === item.name && (
                      <Check size={14} className="text-blue-600" />
                    )}
                  </button>
                ))
              )}
            </div>
            
            {/* Footer Prompt */}
            <div className="bg-slate-50 px-3 py-2 border-t border-slate-100">
               <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Select {mode === 'trigger' ? 'New' : ''} {labelTitle}
               </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};