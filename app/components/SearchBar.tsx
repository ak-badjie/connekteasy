"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface SearchBarProps {
    placeholder?: string;
    size?: "large" | "default";
    onSearch?: (query: string) => void;
    value?: string;
    onChange?: (value: string) => void;
}

export default function SearchBar({
    placeholder = "Search for projects, skills, or keywords...",
    size = "default",
    onSearch,
    value: controlledValue,
    onChange,
}: SearchBarProps) {
    const [internalValue, setInternalValue] = useState("");

    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const setValue = (val: string) => {
        if (onChange) onChange(val);
        else setInternalValue(val);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(value);
    };

    const isLarge = size === "large";

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <motion.div
                className={`relative flex items-center w-full bg-white rounded-xl border border-gray-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 ${isLarge ? "h-12 sm:h-14 md:h-16" : "h-11 sm:h-12"
                    }`}
                whileFocus={{ boxShadow: "0 4px 20px rgba(0, 128, 128, 0.1)" }}
                whileHover={{ boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)" }}
            >
                {/* Search Icon */}
                <div className={`flex items-center justify-center ${isLarge ? "pl-4 sm:pl-5 md:pl-6" : "pl-3 sm:pl-4"}`}>
                    <svg
                        width={isLarge ? "18" : "16"}
                        height={isLarge ? "18" : "16"}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={isLarge ? "w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] md:w-[22px] md:h-[22px]" : ""}
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                </div>

                {/* Input */}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    className={`flex-1 bg-transparent border-none outline-none focus:ring-0 focus:shadow-none text-gray-800 placeholder-gray-400 ${isLarge ? "px-3 sm:px-4 text-sm sm:text-base md:text-lg" : "px-2 sm:px-3 text-xs sm:text-sm"
                        }`}
                    style={{ boxShadow: "none" }}
                />

                {/* Search Button */}
                <div className={`${isLarge ? "pr-1.5 sm:pr-2 md:pr-2.5" : "pr-1 sm:pr-1.5"}`}>
                    <motion.button
                        type="submit"
                        className={`bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors ${isLarge
                                ? "px-4 sm:px-5 md:px-7 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base"
                                : "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm"
                            }`}
                        whileTap={{ scale: 0.95 }}
                    >
                        Search
                    </motion.button>
                </div>
            </motion.div>
        </form>
    );
}
