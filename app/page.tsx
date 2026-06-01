"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "./components/SearchBar";
import CategoryIcon from "./components/CategoryIcon";
import { categories } from "./lib/data";
import { FileEdit, Handshake, Rocket, ArrowRight, DollarSign, ShieldCheck, Lock, MessageSquare, Calendar } from "lucide-react";

// CUSTOM MOTION VARIANTS
const magneticSlideLeft = {
  hidden: { x: -50, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1, 
    transition: { type: "spring", bounce: 0.15, duration: 0.8 }
  }
};

const magneticSlideRight = {
  hidden: { x: 50, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1, 
    transition: { type: "spring", bounce: 0.15, duration: 0.8 }
  }
};

const magneticSlideUp = {
  hidden: { y: 40, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring", bounce: 0.15, duration: 0.8 }
  }
};

const appleDrop = {
  hidden: { scale: 0.9, y: -20, opacity: 0 },
  visible: { 
    scale: 1, 
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 20, mass: 1 }
  }
};

const spin3D = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { type: "spring", bounce: 0.2, duration: 0.7 }
  }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

export default function Home() {
  const router = useRouter();
  const [searchMode, setSearchMode] = useState<"talent" | "projects">("talent");

  const handleSearch = (q: string) => {
    if (q.trim()) {
      router.push(`/explore?mode=${searchMode}&q=${encodeURIComponent(q.trim())}`);
    } else {
      router.push(`/explore?mode=${searchMode}`);
    }
  };

  return (
    <>
      {/* DESKTOP Hero Section (Preserved 100% exactly as it was) */}
      <section className="hidden lg:block relative overflow-hidden bg-soft-surface pt-12 pb-24 lg:pt-20 lg:pb-32" style={{ perspective: "1500px" }}>
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center pb-8 lg:pb-12">
            {/* Left Content */}
            <motion.div
              className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0 flex flex-col justify-center"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Headline & Subtitle */}
              <div className="h-[200px] sm:h-[180px] md:h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={searchMode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h1
                      className="text-4xl sm:text-5xl md:text-6xl font-display text-gray-900 mb-6"
                    >
                      {searchMode === "talent" ? (
                        <span className="text-teal-700">
                      Hire Top <br />
                          <span className="text-teal-600">Virtual </span><span className="text-mustard-500">Assistants</span>
                        </span>
                      ) : (
                        <span className="text-teal-700">
                          Turn Your Skills <br />
                          <span className="text-teal-600">Into </span><span className="text-mustard-500">Income</span>
                        </span>
                      )}
                    </h1>

                    <p
                      className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                    >
                      {searchMode === "talent"
                        ? "Scale your business with vetted professionals in The Gambia ready to handle your administrative, technical, and creative tasks."
                        : "Become a Virtual Assistant and work professionally with growing businesses in The Gambia."}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Search Toggle Area */}
              <motion.div 
                className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 max-w-xl mx-auto lg:mx-0 mb-8 origin-center relative z-10" 
                variants={appleDrop}
                whileHover={{ scale: 1.01, transition: { type: "spring", stiffness: 300 } }}
              >
                {/* Toggle Pill */}
                <div className="flex mb-5">
                  <div className="relative inline-flex w-full items-center bg-gray-50 rounded-lg p-1 border border-gray-200">  
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSearchMode("talent")}
                      className={`flex-1 relative px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 z-10 ${
                        searchMode === "talent"
                          ? "text-white"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {searchMode === "talent" && (
                        <motion.div
                          layoutId="heroToggleIndicator"
                          className="absolute inset-0 bg-mustard-500 rounded-lg shadow-sm z-[-1]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      Find Talent
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSearchMode("projects")}
                      className={`flex-1 relative px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 z-10 ${
                        searchMode === "projects"
                          ? "text-white"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {searchMode === "projects" && (
                        <motion.div
                          layoutId="heroToggleIndicator"
                          className="absolute inset-0 bg-mustard-500 rounded-lg shadow-sm z-[-1]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      Find Work
                    </motion.button>
                  </div>
                </div>

                {/* Search Bar */}
                <SearchBar
                  size="large"
                  placeholder={
                    searchMode === "talent"
                      ? 'Try "data analyst" or "social media manager"...'
                      : 'Try "web development" or "content writing"...'
                  }
                  onSearch={handleSearch}
                />
              </motion.div>
            </motion.div>

            {/* Right Content: Image */}
            <motion.div
              className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-auto lg:h-[600px] flex items-center justify-center"
              initial="hidden"
              animate="visible"
              variants={magneticSlideRight}
            >
               <motion.div 
                 className="absolute inset-0 bg-teal-500/5 rounded-lg transform-gpu"
                 animate={{ rotate: 2 }}
                 whileHover={{ rotate: -1, scale: 1.02 }}
                 transition={{ type: "spring", stiffness: 150 }}
               ></motion.div>
               <motion.img
                 src="/Black_virtual_assistant_202603240436.jpeg"
                 alt="Virtual Assistant"
                 className="relative w-full h-full object-cover rounded-lg shadow-2xl z-10 border-4 border-white" 
                 whileHover={{ scale: 1.01, transition: { type: "spring" } }}
               />

               {/* Floating Card 1: User Profile Summary */}
               <motion.div
                 className="absolute top-10 -right-4 lg:-right-12 bg-white p-4 rounded-lg shadow-lg border border-gray-100 z-20 flex items-center gap-4 min-w-[220px]"
                 variants={spin3D}
                 whileHover={{ scale: 1.04, y: -3, transition: { duration: 0.3, type: "spring" } }}
               >
                 <div className="w-12 h-12 rounded-full bg-mustard-100 flex items-center justify-center text-teal-600 font-bold overflow-hidden border border-gray-200">
                   <img src="/Male_black_virtual_202603240440.jpeg" alt="User Avatar" className="w-full h-full object-cover" />
                 </div>
                 <div className="text-sm">
                   <p className="text-gray-900 font-bold">More Opportunities</p>
                   <p className="text-gray-500 text-xs">For your skills</p>
                 </div>
               </motion.div>

               {/* Floating Card 2: Top Category */}
               <motion.div
                 className="absolute bottom-16 -left-4 lg:-left-12 bg-white px-5 py-4 rounded-lg shadow-lg border border-gray-100 z-20 w-64"
                 variants={appleDrop}
                 whileHover={{ scale: 1.05, y: -5, transition: { duration: 0.3 } }}
               >
                 <p className="text-sm font-semibold text-gray-900 mb-3">Top Categories</p>
                 <ul className="space-y-2.5 text-xs text-gray-600 font-medium">
                   {["Admin Support", "Bookkeeping", "Social Media Mgmt", "Research", "Customer Support"].map(cat => (
                     <motion.li 
                       key={cat}
                       className="flex items-center gap-2 cursor-pointer group"
                       onClick={() => router.push(`/explore?mode=talent&q=${encodeURIComponent(cat)}`)}
                       whileHover={{ x: 3 }}
                     >
                       <motion.span 
                         className="text-mustard-500 text-base"
                         whileHover={{ scale: 1.15 }}
                         transition={{ type: "spring", stiffness: 300 }}
                       >✓</motion.span> 
                       <span className="group-hover:text-teal-600 transition-colors">{cat}</span>
                     </motion.li>
                   ))}
                 </ul>
               </motion.div>
            </motion.div>
          </div>
          
          {/* 4 Info Cards overlapping the bottom */}
          <div className="absolute left-0 right-0 -bottom-12 lg:-bottom-16 px-4 sm:px-6 lg:px-8 z-30">
             <motion.div 
               className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
               initial="hidden"
               animate="visible"
               variants={staggerContainer}
             >
                <motion.div 
                  className="bg-white p-5 rounded-lg shadow-lg border border-gray-100 flex flex-col items-center text-center origin-bottom" 
                  variants={spin3D}
                  whileHover={{ scale: 1.1, y: -15, rotateZ: [0, -4, 4, -4, 4, 0], transition: { duration: 0.6 } }}
                >
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                    <Rocket size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Hire Talent</h3>
                </motion.div>
                <motion.div 
                  className="bg-white p-5 rounded-lg shadow-lg border border-gray-100 flex flex-col items-center text-center origin-bottom" 
                  variants={spin3D}
                  whileHover={{ scale: 1.1, y: -15, rotateZ: [0, -4, 4, -4, 4, 0], transition: { duration: 0.6 } }}
                >
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                    <FileEdit size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Delegate Tasks</h3>
                </motion.div>
                <motion.div 
                  className="bg-white p-5 rounded-lg shadow-lg border border-gray-100 flex flex-col items-center text-center origin-bottom" 
                  variants={spin3D}
                  whileHover={{ scale: 1.1, y: -15, rotateZ: [0, -4, 4, -4, 4, 0], transition: { duration: 0.6 } }}
                >
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                    <Handshake size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Scale Fast</h3>
                </motion.div>
                <motion.div 
                  className="bg-white p-5 rounded-lg shadow-lg border border-gray-100 flex flex-col items-center text-center origin-bottom" 
                  variants={spin3D}
                  whileHover={{ scale: 1.1, y: -15, rotateZ: [0, -4, 4, -4, 4, 0], transition: { duration: 0.6 } }}
                >
                  <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                    <DollarSign size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Earn Income</h3>
                </motion.div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* MOBILE Hero Section */}
      <section className="block lg:hidden relative overflow-hidden bg-soft-surface pt-8 pb-12" style={{ perspective: "1500px" }}>
        <div className="w-full max-w-md mx-auto px-4 sm:px-6 flex flex-col items-center">
          
          {/* Headline & Subtitle */}
          <motion.div
            className="text-center flex flex-col justify-center w-full"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={searchMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[140px] flex flex-col justify-center"
              >
                <h1 className="text-4xl font-display text-gray-900 mb-3 leading-tight">
                  {searchMode === "talent" ? (
                    <span className="text-teal-700">
                      Hire Top <br />
                      <span className="text-teal-600">Virtual </span><span className="text-mustard-500">Assistants</span>
                    </span>
                  ) : (
                    <span className="text-teal-700">
                      Turn Your Skills <br />
                      <span className="text-teal-600">Into </span><span className="text-mustard-500">Income</span>
                    </span>
                  )}
                </h1>
                <p className="text-[15px] text-gray-600 leading-relaxed max-w-sm mx-auto">
                  {searchMode === "talent"
                    ? "Scale your business with vetted professionals in The Gambia."
                    : "Become a Virtual Assistant and work professionally."}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Search Toggle Area */}
            <motion.div 
              className="bg-white p-4 rounded-xl shadow-md border border-gray-100 w-full mt-2 relative z-10" 
              variants={appleDrop}
            >
              <div className="flex mb-4">
                <div className="relative inline-flex w-full items-center bg-gray-50 rounded-lg p-1 border border-gray-200">  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchMode("talent")}
                    className={`flex-1 relative px-2 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 z-10 ${
                      searchMode === "talent" ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {searchMode === "talent" && (
                      <motion.div
                        layoutId="mobileHeroToggleIndicator"
                        className="absolute inset-0 bg-mustard-500 rounded-lg shadow-sm z-[-1]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    Find Talent
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchMode("projects")}
                    className={`flex-1 relative px-2 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 z-10 ${
                      searchMode === "projects" ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {searchMode === "projects" && (
                      <motion.div
                        layoutId="mobileHeroToggleIndicator"
                        className="absolute inset-0 bg-mustard-500 rounded-lg shadow-sm z-[-1]"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    Find Work
                  </motion.button>
                </div>
              </div>
              <SearchBar
                size="large"
                placeholder={searchMode === "talent" ? 'Try "data analyst"...' : 'Try "web dev"...'}
                onSearch={handleSearch}
              />
            </motion.div>
          </motion.div>

          {/* Right Content: Image (Scaled for mobile) */}
          <motion.div
            className="relative w-full aspect-square mt-10 flex items-center justify-center max-w-[280px]"
            initial="hidden"
            animate="visible"
            variants={magneticSlideRight}
          >
             <motion.div 
               className="absolute inset-0 bg-teal-500/5 rounded-2xl transform-gpu"
               animate={{ rotate: 3 }}
             />
             <img
               src="/Black_virtual_assistant_202603240436.jpeg"
               alt="Virtual Assistant"
               className="relative w-full h-full object-cover rounded-2xl shadow-xl z-10 border-4 border-white" 
             />

             {/* Floating Card 1: Smaller, top right */}
             <motion.div
               className="absolute -top-4 -right-4 bg-white p-2.5 rounded-xl shadow-lg border border-gray-100 z-20 flex items-center gap-2"
               variants={spin3D}
             >
               <div className="w-8 h-8 rounded-full bg-mustard-100 flex items-center justify-center overflow-hidden border border-gray-200">
                 <img src="/Male_black_virtual_202603240440.jpeg" alt="Avatar" className="w-full h-full object-cover" />
               </div>
               <div className="text-left">
                 <p className="text-gray-900 font-bold text-[10px] leading-tight">Top Quality</p>
                 <p className="text-gray-500 text-[9px]">Professionals</p>
               </div>
             </motion.div>

             {/* Floating Card 2: Smaller, bottom left */}
             <motion.div
               className="absolute -bottom-4 -left-4 bg-white px-3 py-2.5 rounded-xl shadow-lg border border-gray-100 z-20"
               variants={appleDrop}
             >
               <p className="text-[11px] font-bold text-gray-900 mb-1.5">Top Categories</p>
               <ul className="space-y-1 text-[10px] text-gray-600 font-medium">
                 <li className="flex items-center gap-1.5"><span className="text-mustard-500">✓</span> Admin Support</li>
                 <li className="flex items-center gap-1.5"><span className="text-mustard-500">✓</span> Social Media</li>
                 <li className="flex items-center gap-1.5"><span className="text-mustard-500">✓</span> Bookkeeping</li>
               </ul>
             </motion.div>
          </motion.div>
          
          {/* 4 Info Cards natively in flow, a simple 2x2 grid */}
          <motion.div 
            className="w-full grid grid-cols-2 gap-3 mt-12 z-30"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center" variants={spin3D}>
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-2">
                <Rocket size={18} />
              </div>
              <h3 className="font-bold text-gray-900 text-xs">Hire Talent</h3>
            </motion.div>
            <motion.div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center" variants={spin3D}>
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-2">
                <FileEdit size={18} />
              </div>
              <h3 className="font-bold text-gray-900 text-xs">Delegate Tasks</h3>
            </motion.div>
            <motion.div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center" variants={spin3D}>
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-2">
                <Handshake size={18} />
              </div>
              <h3 className="font-bold text-gray-900 text-xs">Scale Fast</h3>
            </motion.div>
            <motion.div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col items-center text-center" variants={spin3D}>
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-2">
                <DollarSign size={18} />
              </div>
              <h3 className="font-bold text-gray-900 text-xs">Earn Income</h3>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Trusted By (Social Proof) */}
      <motion.section
        className="border-y border-gray-100 bg-white pt-24 lg:pt-32 pb-6 sm:pb-8 overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={magneticSlideUp}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p 
            className="text-center text-xs sm:text-sm text-gray-400 font-medium mb-8 sm:mb-10"
            variants={appleDrop}
          >
            TRUSTED BY & IN PARTNERSHIP WITH
          </motion.p>
          
          <div className="relative flex overflow-x-hidden group">
            <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
            
            <motion.div 
              className="flex items-center gap-12 sm:gap-16 md:gap-24 text-gray-300 w-max whitespace-nowrap"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 80 }}
            >
              {[
                "G-Tech Hub",
                "ALX Africa",
                "Alliance Française de Banjul",
                "French Embassy",
                "National Youth Council",
                "UNDP Accelerator Labs",
                "DaveLabs",
                "CS Painting",
                "Tech4SDGs",
                "Aspire Institute",
                "Teranga Tech Network",
                "GoMindz",
                "Smart Professional College",
                "IIHT",
                "University of The Gambia",
                "Polaris Asso",
                "YouthConnekt Gambia",
                // Duplicated for seamless infinite scroll
                "G-Tech Hub",
                "ALX Africa",
                "Alliance Française de Banjul",
                "French Embassy",
                "National Youth Council",
                "UNDP Accelerator Labs",
                "DaveLabs",
                "CS Painting",
                "Tech4SDGs",
                "Aspire Institute",
                "Teranga Tech Network",
                "GoMindz",
                "Smart Professional College",
                "IIHT",
                "University of The Gambia",
                "Polaris Asso",
                "YouthConnekt Gambia"
              ].map((brand, i) => (
                <span key={`${brand}-${i}`} className="text-base sm:text-lg md:text-xl font-bold tracking-tight hover:text-teal-400 transition-colors cursor-default">
                  {brand}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* What's in it for you? */}
      <section className="py-16 sm:py-24 bg-white relative overflow-hidden" style={{ perspective: "1500px" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={magneticSlideLeft}
          >
            <h2 className="text-3xl sm:text-4xl font-display text-gray-900 mb-4">What&apos;s in it for you?</h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content: Benefits Grid */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={staggerContainer}
            >
              {[
                {
                  icon: <Rocket size={24} className="text-mustard-600" />,
                  title: "Top-tier Talent",
                  desc: "Access vetted and trained professionals ready to handle your business needs.",
                },
                {
                  icon: <Handshake size={24} className="text-mustard-600" />,
                  title: "Cost Effective",
                  desc: "Scale your operations without the overhead of traditional full-time hires.",
                },
                {
                  icon: <FileEdit size={24} className="text-mustard-600" />,
                  title: "Seamless Operations",
                  desc: "Manage contracts, file sharing, and communication in one secure platform.",
                },
                {
                  icon: <DollarSign size={24} className="text-mustard-600" />,
                  title: "Flexible Earnings",
                  desc: "For VAs: Set your own rates and get paid securely for the work you deliver.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  className="bg-soft-surface rounded-lg p-6 origin-center"
                  variants={spin3D}
                  whileHover={{ scale: 1.03, boxShadow: "0px 8px 20px rgba(0,0,0,0.08)" }}
                >
                  <motion.div 
                    className="w-12 h-12 rounded-lg bg-white border border-teal-100 flex items-center justify-center mb-4 shadow-sm"
                    whileHover={{ rotate: 8, transition: { type: "spring", stiffness: 200 } }}
                  >
                    {item.icon}
                  </motion.div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Right Content: Image & Overlaps */}
            <motion.div
              className="relative w-full aspect-square lg:aspect-auto lg:h-[500px]"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={magneticSlideRight}
            >
              <motion.div 
                className="absolute inset-0 bg-mustard-500/10 rounded-lg transform-gpu"
                animate={{ rotate: -3 }}
                whileHover={{ rotate: 0, scale: 1.02 }}
              ></motion.div>       
              <motion.img
                src="/Male_black_virtual_202603240440.jpeg"
                alt="Professional Virtual Assistant"
                className="relative w-full h-full object-cover rounded-lg shadow-xl z-10"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring" }}
              />

              {/* Overlapping Info Card */}
              <motion.div
                className="absolute -bottom-8 lg:-bottom-12 -left-4 lg:-left-12 bg-white p-6 rounded-lg shadow-xl border border-gray-100 z-20 max-w-sm"
                variants={appleDrop}
                whileHover={{ scale: 1.03, y: -4, transition: { duration: 0.3 } }}
              >
                <h4 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                  Scale Your Business Today
                </h4>
                <ul className="space-y-3 mb-5">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-mustard-500 mt-0.5">✓</span>
                    Connect with vetted professionals
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-mustard-500 mt-0.5">✓</span>
                    Reduce operational overhead
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-mustard-500 mt-0.5">✓</span>
                    Secure escrow payments
                  </li>
                </ul>
                <div className="flex gap-3">
                  <Link href="/onboarding" className="flex-1 text-center bg-mustard-500 text-gray-900 text-sm font-semibold py-2.5 rounded-lg hover:bg-mustard-600 transition-colors">
                    <motion.span whileTap={{ scale: 0.9 }}>Hire a VA</motion.span>
                  </Link>
                  <Link href="/explore" className="flex-1 text-center bg-gray-50 text-gray-700 text-sm font-semibold py-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <motion.span whileTap={{ scale: 0.9 }}>Learn More</motion.span>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-16 sm:py-24 bg-soft-surface relative border-t border-gray-100 overflow-hidden" style={{ perspective: "1500px" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content: Image with overlaps */}
            <motion.div
              className="relative w-full aspect-square lg:aspect-auto lg:h-[600px] order-2 lg:order-1"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={magneticSlideLeft}
            >
              <motion.div 
                className="absolute inset-0 bg-teal-500/10 rounded-lg transform-gpu"
                animate={{ rotate: 3 }}
                whileHover={{ rotate: 0, scale: 1.02 }}
              ></motion.div>       
              <motion.img
                src="/Black_virtual_assistant_202603240439.jpeg"
                alt="Platform Features"
                className="relative w-full h-full object-cover rounded-lg shadow-xl z-10"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring" }}
              />
              
              {/* Overlapping Badge */}
              <motion.div
                className="absolute top-8 -left-4 lg:-left-8 bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100 z-20 flex items-center gap-3 origin-center"
                variants={spin3D}
                whileHover={{ scale: 1.05, y: -3, transition: { duration: 0.3, type: "spring" } }}
              >
                <div className="w-10 h-10 rounded-full bg-mustard-100 flex items-center justify-center text-mustard-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-sm">100% Secure</p>
                  <p className="text-gray-500 text-xs">Escrow Protected</p>
                </div>
              </motion.div>

              {/* Overlapping Image/Card */}
              <motion.div
                 className="absolute bottom-8 -right-4 lg:-right-8 bg-white p-2 rounded-lg shadow-xl border border-gray-100 z-20 w-48 h-32 hidden sm:block origin-bottom-right"
                 variants={appleDrop}
                 whileHover={{ scale: 1.04, transition: { type: "spring" } }}
              >
                 <img src="/Black_virtual_assistant_202603240435.jpeg" alt="Professional" className="w-full h-full object-cover rounded-lg" />
              </motion.div>
            </motion.div>

            {/* Right Content: Features List */}
            <motion.div
              className="order-1 lg:order-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-3xl sm:text-4xl font-display text-gray-900 mb-6"
                variants={magneticSlideRight}
              >
                Why Choose <span className="text-mustard-500 inline-block">CONNEKT?</span>
              </motion.h2>

              <div className="space-y-6 lg:space-y-8 mt-8">
                {[
                  {
                    icon: <ShieldCheck size={24} className="text-mustard-600" />,
                    title: "Verified Professionals",
                    desc: "Every virtual assistant undergoes a rigorous vetting process to ensure top-tier quality.",
                  },
                  {
                    icon: <Lock size={24} className="text-mustard-600" />,
                    title: "Secure Payments",
                    desc: "Our integrated escrow system ensures funds are protected until milestones are approved.",
                  },
                  {
                    icon: <MessageSquare size={24} className="text-mustard-600" />,
                    title: "Seamless Communication",
                    desc: "Integrated messaging, file sharing, and feedback loops right within the platform.",
                  },
                  {
                    icon: <Calendar size={24} className="text-mustard-600" />,
                    title: "Automated Scheduling",
                    desc: "Easy coordination across time zones with built-in calendar and scheduling tools.",
                  },
                ].map((feature, idx) => (
                  <motion.div 
                    key={idx} 
                    className="flex gap-4 sm:gap-6" 
                    variants={magneticSlideRight}
                    whileHover={{ x: -4, scale: 1.01, transition: { type: "spring" } }}
                  >
                    <motion.div 
                      className="flex-shrink-0 w-12 h-12 rounded-lg bg-mustard-50 flex items-center justify-center border border-mustard-100 shadow-sm"
                      whileHover={{ rotate: 8, transition: { type: "spring", duration: 0.4 } }}
                    >
                      {feature.icon}
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 sm:py-20 md:py-24 bg-gray-50 overflow-hidden" style={{ perspective: "1500px" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-10 gap-3 sm:gap-4"        
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={magneticSlideUp}
          >
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Popular categories</h2>
              <p className="text-sm sm:text-base text-gray-500">Browse projects by specialization</p>
            </div>
            <Link
              href="/explore"
              className="text-sm font-semibold text-teal-600 hover:text-mustard-700 transition-colors flex items-center gap-1 group"
            >
              View all categories
              <motion.div whileHover={{ x: 5 }}>
                <ArrowRight size={16} />
              </motion.div>
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            {categories.map((cat) => (
              <motion.div 
                key={cat.id} 
                variants={appleDrop}
                whileHover={{ 
                  scale: 1.03, 
                  y: -3,
                  boxShadow: "0px 8px 20px rgba(0,0,0,0.08)",
                  transition: { type: "spring", stiffness: 300 }
                }}
              >
                <Link
                  href={`/explore?mode=talent&q=${encodeURIComponent(cat.name)}`}
                  className="block bg-white rounded-lg p-4 sm:p-5 border border-gray-200 group h-full"
                >
                  <motion.div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-2.5 sm:mb-3 text-teal-600 group-hover:bg-mustard-100 transition-colors"
                    whileHover={{ scale: 1.1, transition: { duration: 0.3, type: "spring" } }}
                  >
                    <CategoryIcon name={cat.iconName} size={18} className="sm:w-5 sm:h-5" />
                  </motion.div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-teal-600 transition-colors mb-0.5 sm:mb-1">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-400">{cat.count} projects</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 md:py-24 bg-white overflow-hidden" style={{ perspective: "1500px" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg p-8 sm:p-10 md:p-16 text-center overflow-hidden origin-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={spin3D}
            whileHover={{ scale: 1.01, transition: { type: "spring" } }}
          >
            {/* Decorative elements */}
            <motion.div 
              className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" 
              animate={{ scale: [1, 1.08, 1], rotate: [0, 30, 0] }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" 
              animate={{ scale: [1, 1.15, 1], rotate: [0, -30, 0] }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            />

            <div className="relative z-10">
              <motion.h2 
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4"
                variants={appleDrop}
              >
                Ready to get started?
              </motion.h2>
              <motion.p 
                className="text-teal-100 text-sm sm:text-base md:text-lg max-w-md mx-auto mb-6 sm:mb-8 px-4 sm:px-0"
                variants={appleDrop}
              >
                Whether you&apos;re hiring or looking for work, CONNEKT has you covered. Join thousands of professionals
                today.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center px-4 sm:px-0"
                variants={staggerContainer}
              >
                <motion.div variants={appleDrop} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/explore"
                    className="block px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-semibold bg-white text-mustard-700 rounded-lg hover:bg-teal-50 transition-colors shadow-lg"
                  >
                    Explore Projects
                  </Link>
                </motion.div>
                <motion.div variants={appleDrop} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/dashboard/post"
                    className="block px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-semibold bg-mustard-500 text-gray-900 border border-mustard-400 rounded-lg hover:bg-mustard-600 transition-colors"
                  >
                    Post a Project
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}