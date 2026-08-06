"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import SearchBar from "@/app/components/SearchBar";
import ProjectCard from "@/app/components/ProjectCard";
import DetailSidebar from "@/app/components/DetailSidebar";
import JobListCard from "@/app/components/JobListCard";
import Pagination from "@/app/components/Pagination";
import { categories } from "@/app/lib/data";
import { getProjects, getFreelancers, getJobs } from "@/app/lib/firestore";
import {
  HOME_COUNTRY,
  PAGE_SIZE,
  matchesLocationFilter,
  toPlainJob,
  type LocationFilter,
  type PlainJob,
} from "@/app/lib/jobUtils";
import { SearchX, MapPin, DollarSign, UserSearch } from "lucide-react";
import { staggerContainer, staggerItem, fadeInUp, cardHover, cardTap } from "@/app/lib/animations";
import type { FirestoreProject, UserProfile } from "@/app/lib/types";

type Mode = "jobs" | "projects" | "talent";

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
const budgetFilters = ["All Budgets", "Under D25,000", "D25,000-D50,000", "D50,000+", "Hourly"];
const durationFilters = ["All Durations", "Less than 1 month", "1-3 months", "3+ months", "6+ months"];
const rateFilters = ["All Rates", "Under D1,000/hr", "D1,000-D2,000/hr", "D2,000-D3,000/hr", "D3,000+/hr"];
const LOCATION_FILTERS: { value: LocationFilter; label: string }[] = [
  { value: "all", label: "Everywhere" },
  { value: "local", label: `Local — ${HOME_COUNTRY}` },
  { value: "remote", label: "Remote" },
];

const MODES: { value: Mode; label: string }[] = [
  { value: "jobs", label: "Jobs" },
  { value: "projects", label: "Projects" },
  { value: "talent", label: "Talent" },
];

// ─── Main Content ──────────────────────────────────────────
function ExploreContent() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const initialMode: Mode =
    modeParam === "talent" ? "talent" : modeParam === "projects" ? "projects" : "jobs";
  const initialQuery = searchParams.get("q") || "";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);

  // Job board state
  const [jobs, setJobs] = useState<PlainJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [jobCategory, setJobCategory] = useState("All");

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
    getJobs()
      .then((data) => setJobs(data.map(toPlainJob)))
      .catch((err) => console.error("Failed to load jobs:", err))
      .finally(() => setLoadingJobs(false));
  }, []);

  useEffect(() => {
    getProjects()
      .then((data) => setProjects(data.map(adaptProject)))
      .catch((err) => console.error("Failed to load projects:", err))
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => {
    getFreelancers()
      .then(setFreelancers)
      .catch((err) => console.error("Failed to load freelancers:", err))
      .finally(() => setLoadingTalent(false));
  }, []);

  // Switching tab or filter always starts from the first page.
  useEffect(() => {
    setPage(1);
  }, [mode, searchQuery, locationFilter, jobCategory, selectedCategory, selectedBudget, selectedDuration, selectedRate]);

  // ─── Job filtering ─────────────────────────────────────
  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesLocation = matchesLocationFilter(j, locationFilter);
      const matchesCategory = jobCategory === "All" || j.category === jobCategory;
      const matchesSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.skills.some((s) => s.toLowerCase().includes(q));
      return matchesLocation && matchesCategory && matchesSearch;
    });
  }, [jobs, searchQuery, locationFilter, jobCategory]);

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
        if (selectedBudget === "Under D25,000") matchesBudget = maxVal < 25000;
        else if (selectedBudget === "D25,000-D50,000") matchesBudget = maxVal >= 25000 && maxVal <= 50000;
        else if (selectedBudget === "D50,000+") matchesBudget = maxVal > 50000;
      }

      let matchesDuration = true;
      if (selectedDuration !== "All Durations") {
        matchesDuration =
          p.duration.includes(selectedDuration.replace("months", "").trim()) ||
          p.duration === selectedDuration;
      }

      return matchesSearch && matchesCategory && matchesBudget && matchesDuration;
    });
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
      if (selectedRate === "Under D1,000/hr") matchesRate = f.hourlyRate > 0 && f.hourlyRate < 1000;
      else if (selectedRate === "D1,000-D2,000/hr") matchesRate = f.hourlyRate >= 1000 && f.hourlyRate <= 2000;
      else if (selectedRate === "D2,000-D3,000/hr") matchesRate = f.hourlyRate >= 2000 && f.hourlyRate <= 3000;
      else if (selectedRate === "D3,000+/hr") matchesRate = f.hourlyRate > 3000;

      return matchesSearch && matchesRate;
    });
  }, [searchQuery, selectedRate, freelancers]);

  const handleProjectClick = (project: (typeof projects)[0]) => {
    setSelectedProject(project);
    setSelectedProjectId(project.id);
    setSidebarOpen(true);
  };

  const isLoading =
    mode === "jobs" ? loadingJobs : mode === "projects" ? loadingProjects : loadingTalent;
  const resultCount =
    mode === "jobs"
      ? filteredJobs.length
      : mode === "projects"
      ? filteredProjects.length
      : filteredTalent.length;

  const pageCount = Math.max(1, Math.ceil(resultCount / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const sliceStart = (currentPage - 1) * PAGE_SIZE;
  const visibleJobs = filteredJobs.slice(sliceStart, sliceStart + PAGE_SIZE);
  const visibleProjects = filteredProjects.slice(sliceStart, sliceStart + PAGE_SIZE);
  const visibleTalent = filteredTalent.slice(sliceStart, sliceStart + PAGE_SIZE);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), pageCount));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const noun = mode === "jobs" ? "jobs" : mode === "projects" ? "projects" : "virtual assistants";

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <motion.div className="bg-white border-b border-gray-200" initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-gray-900 mb-1">Explore</h1>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
            {mode === "jobs"
              ? `Open vacancies in ${HOME_COUNTRY} and remote roles open to Gambians`
              : mode === "projects"
              ? "Freelance projects posted by businesses looking for help"
              : "Browse skilled virtual assistants ready to help"}
          </p>

          {/* Mode Toggle Pill */}
          <div className="flex justify-start mb-4 sm:mb-5">
            <div className="inline-flex items-center bg-soft-surface rounded-full p-1 border border-gray-200">
              {MODES.map((m) => (
                <motion.button
                  key={m.value}
                  whileTap={cardTap}
                  onClick={() => setMode(m.value)}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 ${
                    mode === m.value
                      ? "bg-white text-mustard-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {m.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="max-w-2xl mb-4 sm:mb-5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={setSearchQuery}
              placeholder={
                mode === "jobs"
                  ? "Search jobs by title, employer, town or skill..."
                  : mode === "projects"
                  ? "Search projects, skills, or keywords..."
                  : "Search by name, title, or skills..."
              }
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            {mode === "jobs" && (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
                  {LOCATION_FILTERS.map((f) => (
                    <motion.button
                      key={f.value}
                      onClick={() => setLocationFilter(f.value)}
                      className={`px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-full border transition-colors whitespace-nowrap shrink-0 ${
                        locationFilter === f.value
                          ? "bg-mustard-500 text-gray-900 border-mustard-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-mustard-300 hover:text-mustard-600"
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {f.label}
                    </motion.button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    value={jobCategory}
                    onChange={(e) => setJobCategory(e.target.value)}
                    aria-label="Filter jobs by category"
                    className="px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-full border border-gray-200 bg-white text-gray-600 cursor-pointer hover:border-teal-300 transition-colors"
                  >
                    <option value="All">All categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {mode === "projects" && (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap no-scrollbar">
                  {["All", ...categories.slice(0, 6).map((c) => c.name)].map((cat) => (
                    <motion.button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium rounded-full border transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === cat
                          ? "bg-mustard-500 text-gray-900 border-mustard-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-mustard-300 hover:text-mustard-600"
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {cat}
                    </motion.button>
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
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
          <p className="text-xs sm:text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-900">
              {resultCount ? sliceStart + 1 : 0}–
              {sliceStart +
                (mode === "jobs"
                  ? visibleJobs.length
                  : mode === "projects"
                  ? visibleProjects.length
                  : visibleTalent.length)}
            </span>{" "}
            of <span className="font-semibold text-gray-900">{resultCount}</span> {noun}
          </p>
          {mode === "jobs" && (
            <Link href="/jobs" className="text-xs sm:text-sm font-semibold text-teal-600 hover:underline shrink-0">
              Open the job board →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading {noun}...</p>
          </div>
        ) : resultCount > 0 ? (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              key={`${mode}-${currentPage}`}
            >
              {mode === "jobs" &&
                visibleJobs.map((job) => (
                  <motion.div key={job.id} variants={staggerItem}>
                    <JobListCard job={job} />
                  </motion.div>
                ))}

              {mode === "projects" &&
                visibleProjects.map((project) => (
                  <motion.div key={project.id} variants={staggerItem}>
                    <ProjectCard project={project} onClick={handleProjectClick} />
                  </motion.div>
                ))}

              {mode === "talent" &&
                visibleTalent.map((person) => (
                  <motion.div key={person.uid} variants={staggerItem}>
                    <Link href={`/profile/${person.uid}`}>
                      <motion.div
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 group cursor-pointer"
                        whileHover={cardHover}
                        whileTap={cardTap}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {person.profilePhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={person.profilePhotoUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-mustard-50 text-mustard-700 flex items-center justify-center text-sm font-display font-bold shadow-sm">
                              {(person.firstName || "")[0]}{(person.lastName || "")[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-display font-bold text-gray-900 group-hover:text-mustard-600 transition-colors truncate">
                              {person.displayName}
                            </h3>
                            <p className="text-xs text-mustard-600 font-medium truncate">{person.title || "Virtual Assistant"}</p>
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
                            <span className="flex items-center gap-1"><DollarSign size={11} />D{person.hourlyRate}/hr</span>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
            </motion.div>

            <Pagination page={currentPage} pageCount={pageCount} onChange={goToPage} className="mt-8" />
          </>
        ) : (
          <motion.div className="text-center py-16 sm:py-20" variants={fadeInUp} initial="hidden" animate="visible">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-soft-surface flex items-center justify-center mx-auto mb-3 sm:mb-4 text-gray-400">
              {mode === "talent" ? <UserSearch size={24} /> : <SearchX size={24} />}
            </div>
            <h3 className="text-base sm:text-lg font-display font-semibold text-gray-900 mb-2">
              No {noun} found
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
          <div className="w-8 h-8 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
