"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import SearchBar from "@/app/components/SearchBar";
import ProjectCard from "@/app/components/ProjectCard";
import DetailSidebar from "@/app/components/DetailSidebar";
import { projects, categories, Project } from "@/app/lib/data";
import { SearchX } from "lucide-react";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";

const budgetFilters = ["All Budgets", "Under $500", "$500-$1,000", "$1,000+", "Hourly"];
const durationFilters = ["All Durations", "Less than 1 month", "1-3 months", "3+ months", "6+ months"];

export default function ExplorePage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedBudget, setSelectedBudget] = useState("All Budgets");
    const [selectedDuration, setSelectedDuration] = useState("All Durations");
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const filteredProjects = useMemo(() => {
        return projects.filter((p) => {
            const matchesSearch =
                !searchQuery ||
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory]);

    const handleProjectClick = (project: Project) => {
        setSelectedProject(project);
        setSidebarOpen(true);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <motion.div
                className="bg-white border-b border-gray-200"
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Explore Projects</h1>
                    <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                        Discover {projects.length} open projects from businesses worldwide
                    </p>

                    {/* Search */}
                    <div className="max-w-2xl mb-4 sm:mb-5">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onSearch={setSearchQuery}
                            placeholder="Search projects, skills, or keywords..."
                        />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                        {/* Category filter — horizontal scroll on mobile */}
                        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap no-scrollbar">
                            {["All", ...categories.slice(0, 6).map((c) => c.name)].map((cat) => (
                                <motion.button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium rounded-full border transition-colors whitespace-nowrap shrink-0 ${selectedCategory === cat
                                            ? "bg-teal-500 text-white border-teal-500"
                                            : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600"
                                        }`}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {cat}
                                </motion.button>
                            ))}
                        </div>

                        {/* Dropdowns */}
                        <div className="flex gap-2">
                            <select
                                value={selectedBudget}
                                onChange={(e) => setSelectedBudget(e.target.value)}
                                className="px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-full border border-gray-200 bg-white text-gray-600 cursor-pointer hover:border-teal-300 transition-colors"
                            >
                                {budgetFilters.map((b) => (
                                    <option key={b} value={b}>
                                        {b}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedDuration}
                                onChange={(e) => setSelectedDuration(e.target.value)}
                                className="px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-full border border-gray-200 bg-white text-gray-600 cursor-pointer hover:border-teal-300 transition-colors"
                            >
                                {durationFilters.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <p className="text-xs sm:text-sm text-gray-500">
                        Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span> projects
                    </p>
                    <select className="text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 cursor-pointer">
                        <option>Newest First</option>
                        <option>Most Applicants</option>
                        <option>Budget: High to Low</option>
                        <option>Budget: Low to High</option>
                    </select>
                </div>

                {filteredProjects.length > 0 ? (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5"
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                    >
                        {filteredProjects.map((project) => (
                            <motion.div key={project.id} variants={staggerItem}>
                                <ProjectCard project={project} onClick={handleProjectClick} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        className="text-center py-16 sm:py-20"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 sm:mb-4 text-gray-400">
                            <SearchX size={24} className="sm:w-7 sm:h-7" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                            Try adjusting your search or filters to find what you&apos;re looking for.
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Detail Sidebar */}
            <DetailSidebar project={selectedProject} isOpen={sidebarOpen} onClose={closeSidebar} />
        </div>
    );
}
