"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import SearchBar from "@/app/components/SearchBar";
import ProjectCard from "@/app/components/ProjectCard";
import DetailSidebar from "@/app/components/DetailSidebar";
import { categories } from "@/app/lib/data";
import { getProjects, getFreelancers } from "@/app/lib/firestore";
import { SearchX, MapPin, DollarSign, UserSearch } from "lucide-react";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import type { FirestoreProject, UserProfile } from "@/app/lib/types";

// ─── Adapt Firestore project to match ProjectCard shape ────
function adaptProject(p: FirestoreProject) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    budget: p.budget,
    budgetType: p.budgetType,
    category: p.category,
    tags: p.tags || [],
    postedBy: p.ownerName,
    postedByAvatar: p.ownerAvatar,
    postedAt: p.createdAt?.toDate ? timeAgo(p.createdAt.toDate()) : "Just now",
    duration: p.duration,
    location: p.location || "Remote",
    applicants: p.applicants || 0,
    status: p.status,
  };
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ─── Filters ───────────────────────────────────────────────
const budgetFilters = ["All Budgets", "Under $500", "$500-$1,000", "$1,000+", "Hourly"];
const durationFilters = ["All Durations", "Less than 1 month", "1-3 months", "3+ months", "6+ months"];
const rateFilters = ["All Rates", "Under $15/hr", "$15-$30/hr", "$30-$50/hr", "$50+/hr"];
const ITEMS_PER_PAGE = 300;

// ─── Main Content ──────────────────────────────────────────
function ExploreContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "talent" ? "talent" : searchParams.get("mode") === "projects" ? "projects" : "projects";
  const initialQuery = searchParams.get("q") || "";

  const [mode, setMode] = useState<"projects" | "talent">(initialMode);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Project state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBudget, setSelectedBudget] = useState("All Budgets");
  const [selectedDuration, setSelectedDuration] = useState("All Durations");
  const [selectedProject, setSelectedProject] = useState<ReturnType<typeof adaptProject> | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<ReturnType<typeof adaptProject>[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Talent state
  const [selectedRate, setSelectedRate] = useState("All Rates");
  const [freelancers, setFreelancers] = useState<UserProfile[]>([]);
  const [loadingTalent, setLoadingTalent] = useState(true);

  // ─── Fetch data ─────────────────────────────────────────
  useEffect(() => {
    async function fetchProjects() {
      try {
        const firestoreProjects = await getProjects();
        setProjects(firestoreProjects.map(adaptProject));
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoadingProjects(false);
      }
    }
    fetchProjects();
  }, []);

  useEffect(() => {
    async function fetchTalent() {
      try {
        const data = await getFreelancers();
        setFreelancers(data);
      } catch (err) {
        console.error("Failed to load freelancers:", err);
      } finally {
        setLoadingTalent(false);
      }
    }
    fetchTalent();
  }, []);

  // ─── Project filtering ─────────────────────────────────
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;

      let matchesBudget = true;
      if (selectedBudget === "Hourly") {
        matchesBudget = p.budgetType === "hourly";
      } else if (selectedBudget !== "All Budgets") {
        const nums = p.budget.match(/[\d,]+/g);
        const maxVal = nums ? parseInt(nums[nums.length - 1].replace(",", "")) : 0;
        if (selectedBudget === "Under $500") matchesBudget = maxVal < 500;
        else if (selectedBudget === "$500-$1,000") matchesBudget = maxVal >= 500 && maxVal <= 1000;
        else if (selectedBudget === "$1,000+") matchesBudget = maxVal > 1000;
      }

      let matchesDuration = true;
      if (selectedDuration !== "All Durations") {
        matchesDuration = p.duration.includes(selectedDuration.replace("months", "").trim()) || p.duration === selectedDuration;
      }

      return matchesSearch && matchesCategory && matchesBudget && matchesDuration;
    }).slice(0, ITEMS_PER_PAGE);
  }, [searchQuery, selectedCategory, selectedBudget, selectedDuration, projects]);

  // ─── Talent filtering ──────────────────────────────────
  const filteredTalent = useMemo(() => {
    return freelancers.filter((f) => {
      const matchesSearch =
        !searchQuery ||
        f.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesRate = true;
      if (selectedRate === "Under $15/hr") matchesRate = f.hourlyRate > 0 && f.hourlyRate < 15;
      else if (selectedRate === "$15-$30/hr") matchesRate = f.hourlyRate >= 15 && f.hourlyRate <= 30;
      else if (selectedRate === "$30-$50/hr") matchesRate = f.hourlyRate >= 30 && f.hourlyRate <= 50;
      else if (selectedRate === "$50+/hr") matchesRate = f.hourlyRate > 50;

      return matchesSearch && matchesRate;
    }).slice(0, ITEMS_PER_PAGE);
  }, [searchQuery, selectedRate, freelancers]);

  const handleProjectClick = (project: typeof projects[0]) => {
    setSelectedProject(project);
    setSelectedProjectId(project.id);
    setSidebarOpen(true);
  };

  const isLoading = mode === "projects" ? loadingProjects : loadingTalent;
  const resultCount = mode === "projects" ? filteredProjects.length : filteredTalent.length;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <motion.div className="bg-white border-b border-gray-200" initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Explore</h1>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
            {mode === "projects"
              ? "Discover open projects from businesses worldwide"
              : "Browse skilled virtual assistants ready to help"}
          </p>

          {/* Mode Toggle Pill */}
          <div className="flex justify-start mb-4 sm:mb-5">
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1 border border-gray-200">
              <button
                onClick={() => setMode("projects")}
                className={`px-5 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 ${
                  mode === "projects"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => setMode("talent")}
                className={`px-5 sm:px-7 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 ${
                  mode === "talent"
                    ? "bg-white text-teal-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Talent
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-2xl mb-4 sm:mb-5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={setSearchQuery}
              placeholder={
                mode === "projects"
                  ? "Search projects, skills, or keywords..."
                  : "Search by name, title, or skills..."
              }
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            {mode === "projects" && (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap no-scrollbar">
                  {["All", ...categories.slice(0, 6).map((c) => c.name)].map((cat) => (
                    <motion.button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium rounded-full border transition-colors whitespace-nowrap shrink-0 ${selectedCategory === cat ? "bg-teal-500 text-white border-teal-500" : "bg-white text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600"}`}
                      whileTap={{ scale: 0.95 }}
                    >{cat}</motion.button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select value={selectedBudget} onChange={(e) => setSelectedBudget(e.target.value)} className="px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-full border border-gray-200 bg-white text-gray-600 cursor-pointer hover:border-teal-300 transition-colors">
                    {budgetFilters.map((b) => (<option key={b} value={b}>{b}</option>))}
                  </select>
                  <select value={selectedDuration} onChange={(e) => setSelectedDuration(e.target.value)} className="px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-full border border-gray-200 bg-white text-gray-600 cursor-pointer hover:border-teal-300 transition-colors">
                    {durationFilters.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
              </>
            )}
            {mode === "talent" && (
              <div className="flex gap-2">
                <select value={selectedRate} onChange={(e) => setSelectedRate(e.target.value)} className="px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-full border border-gray-200 bg-white text-gray-600 cursor-pointer hover:border-teal-300 transition-colors">
                  {rateFilters.map((r) => (<option key={r} value={r}>{r}</option>))}
                </select>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{resultCount}</span> {mode === "projects" ? "projects" : "virtual assistants"}
          </p>
          {mode === "projects" && (
            <select className="text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 cursor-pointer">
              <option>Newest First</option>
              <option>Most Applicants</option>
              <option>Budget: High to Low</option>
              <option>Budget: Low to High</option>
            </select>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading {mode === "projects" ? "projects" : "talent"}...</p>
          </div>
        ) : resultCount > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5"
            initial="hidden" animate="visible" variants={staggerContainer}
            key={mode}
          >
            {mode === "projects"
              ? filteredProjects.map((project) => (
                  <motion.div key={project.id} variants={staggerItem}>
                    <ProjectCard project={project} onClick={handleProjectClick} />
                  </motion.div>
                ))
              : filteredTalent.map((person) => (
                  <motion.div key={person.uid} variants={staggerItem}>
                    <Link href={`/profile/${person.uid}`}>
                      <motion.div
                        className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 group cursor-pointer"
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {person.profilePhotoUrl ? (
                            <img src={person.profilePhotoUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">
                              {(person.firstName || "")[0]}{(person.lastName || "")[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-teal-600 transition-colors truncate">
                              {person.displayName}
                            </h3>
                            <p className="text-xs text-teal-600 truncate">{person.title || "Virtual Assistant"}</p>
                          </div>
                        </div>
                        {person.bio && (
                          <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{person.bio}</p>
                        )}
                        {person.skills && person.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {person.skills.slice(0, 4).map((skill) => (
                              <span key={skill} className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">{skill}</span>
                            ))}
                            {person.skills.length > 4 && (
                              <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-400 rounded-full">+{person.skills.length - 4}</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                          {person.location && (
                            <span className="flex items-center gap-1"><MapPin size={11} />{person.location}</span>
                          )}
                          {person.hourlyRate > 0 && (
                            <span className="flex items-center gap-1"><DollarSign size={11} />${person.hourlyRate}/hr</span>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
          </motion.div>
        ) : (
          <motion.div className="text-center py-16 sm:py-20" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 sm:mb-4 text-gray-400">
              {mode === "projects" ? <SearchX size={24} /> : <UserSearch size={24} />}
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              No {mode === "projects" ? "projects" : "talent"} found
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">Try adjusting your search or filters.</p>
          </motion.div>
        )}
      </div>

      <DetailSidebar project={selectedProject} projectId={selectedProjectId} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
