"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronDown, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export interface NavItem {
  id: number | string;
  name: string;
}

interface NavSelectorProps<T extends NavItem> {
  labelTitle: string;
  currentValue?: string;
  items: T[];
  onSelect: (item: T) => void;
  mode: "value" | "trigger";
  placeholder?: string;
  href?: string;
}

export const NavSelector = <T extends NavItem>({
  labelTitle,
  currentValue,
  items,
  onSelect,
  mode,
  placeholder = "Search...",
  href = "#",
}: NavSelectorProps<T>) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
    setSearch("");
  };

  const handleValueClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const currentItem = items.find((item) => item.name === currentValue);
    if (currentItem) {
      onSelect(currentItem);
    }
    if (href !== "#") {
      router.push(href);
    }
  };

  return (
    <div className="relative flex items-center" ref={containerRef}>
      {mode === "value" ? (
        <div
          className={`
          group flex items-center rounded-lg border border-slate-200 bg-white transition-all duration-200
          ${
            isOpen
              ? "ring-2 ring-blue-100 border-blue-400"
              : "hover:border-blue-300"
          }
        `}
        >
          <button
            onClick={handleValueClick}
            className="flex flex-col items-start justify-center px-3 py-1.5 border-r border-slate-100 hover:bg-slate-50 rounded-l-lg transition-colors min-w-[100px] text-left cursor-pointer"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">
              {labelTitle}
            </span>
            <span className="font-semibold text-slate-800 text-sm truncate max-w-[140px]">
              {currentValue}
            </span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`px-1.5 py-3 hover:bg-slate-50 text-slate-400 hover:text-blue-600 rounded-r-lg transition-colors ${
              isOpen
                ? "bg-slate-50 text-blue-600 cursor-pointer"
                : "cursor-pointer"
            }`}
          >
            <ChevronDown size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            ml-2 p-2 rounded-lg border transition-all duration-200 cursor-pointer
            ${
              isOpen
                ? "border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-100"
                : "border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-slate-50"
            }
          `}
        >
          <ChevronRight size={16} />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 z-50 overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  autoFocus
                  placeholder={placeholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

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
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors group cursor-pointer"
                  >
                    <span className="truncate font-medium">{item.name}</span>
                    {currentValue === item.name && (
                      <Check size={14} className="text-blue-600" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="bg-slate-50 px-3 py-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Select {mode === "trigger" ? "New" : ""} {labelTitle}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
