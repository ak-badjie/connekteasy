"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check } from "lucide-react";
import { SKILLS_LIST } from "@/app/lib/skills";

interface SkillPickerProps {
  selected: string[];
  onChange: (skills: string[]) => void;
  minSkills?: number;
  label?: string;
}

export default function SkillPicker({
  selected,
  onChange,
  minSkills = 5,
  label = "Skills",
}: SkillPickerProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter the master list based on query, excluding already-selected
  const suggestions = useMemo(() => {
    const available = SKILLS_LIST.filter((s) => !selected.includes(s));
    if (!query.trim()) return available; // Return all available skills if query is empty
    const q = query.toLowerCase();
    return available.filter((s) => s.toLowerCase().includes(q));
  }, [query, selected]);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || selected.includes(trimmed)) return;
    onChange([...selected, trimmed]);
    setQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const removeSkill = (skill: string) => {
    onChange(selected.filter((s) => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        addSkill(suggestions[0]);
      } else if (query.trim()) {
        addSkill(query);
      }
    }
    if (e.key === "Backspace" && !query && selected.length > 0) {
      removeSkill(selected[selected.length - 1]);
    }
  };

  const needsMore = selected.length < minSkills;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1.5">
        {label}
        {needsMore && (
          <span className="text-gray-400 font-normal ml-1.5">
            ({selected.length}/{minSkills} minimum)
          </span>
        )}
      </label>

      {/* Selected skills chips */}
      <div className="min-h-[44px] p-2 bg-white border border-gray-200 rounded-xl flex flex-wrap gap-1.5 mb-2">
        <AnimatePresence mode="popLayout">
          {selected.map((skill) => (
            <motion.span
              key={skill}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 rounded-full"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="hover:text-teal-900 transition-colors"
              >
                <X size={12} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {selected.length === 0 && (
          <span className="text-xs text-gray-300 py-1 px-1">
            Selected skills will appear here...
          </span>
        )}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => query && setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search or add a skill..."
          className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400"
        />
      </div>

      {/* Autocomplete dropdown (Always showing available skills) */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg shadow-gray-100/50 max-h-64 overflow-y-auto no-scrollbar"
          >
            {suggestions.length > 0 ? (
              <div className="p-2 flex flex-wrap gap-1.5">
                {suggestions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => addSkill(skill)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-gray-50 text-gray-600 rounded-full hover:bg-teal-50 hover:text-teal-700 transition-colors border border-gray-100 hover:border-teal-200"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            ) : (
              query.trim() && (
                <div className="p-3 text-center text-xs text-gray-500">
                  No predefined skills found for "{query}".
                </div>
              )
            )}
            
            {query.trim() && !SKILLS_LIST.some((s) => s.toLowerCase() === query.trim().toLowerCase()) && (
              <button
                type="button"
                onClick={() => addSkill(query)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm text-teal-600 hover:bg-teal-50 transition-colors text-left border-t border-gray-100"
              >
                <span className="font-medium">Add "{query.trim()}"</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-teal-100 text-teal-700 rounded-md">Create Custom</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
}
