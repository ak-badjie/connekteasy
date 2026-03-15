"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getUserProfile, getOrCreateConversation } from "@/app/lib/firestore";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { MapPin, Globe, Linkedin, DollarSign, Film, FileText, Image as ImageIcon, MessageSquare, Briefcase, GraduationCap, ExternalLink } from "lucide-react";
import type { UserProfile } from "@/app/lib/types";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile: currentUserProfile } = useAuth();
  const uid = params.uid as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [startingChat, setStartingChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const p = await getUserProfile(uid);
        setProfile(p);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (uid) load();
  }, [uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Profile not found</h1>
          <p className="text-sm text-gray-500">This user doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <motion.div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10" initial="hidden" animate="visible" variants={staggerContainer}>
        
        {/* Header / Intro Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          <div className="lg:col-span-2">
            <motion.div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col" variants={fadeInUp}>
              <div className="h-32 sm:h-40 bg-gradient-to-r from-teal-400 to-teal-600 relative">
                {profile.coverPhotoUrl && (
                  <img src={profile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="px-5 sm:px-8 pb-5 sm:pb-8 -mt-12 sm:-mt-16 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-4">
                  {profile.profilePhotoUrl ? (
                    <img src={profile.profilePhotoUrl} alt="" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white" />
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </div>
                  )}
                  <div className="text-center sm:text-left pb-1 sm:pb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.displayName}</h1>
                    <p className="text-sm sm:text-base text-teal-600 font-medium">{profile.title}</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-xs sm:text-sm text-gray-500">
                  {profile.location && (
                    <span className="flex items-center gap-1 font-medium"><MapPin size={14} className="text-gray-400" />{profile.location}</span>
                  )}
                  {profile.role === "va" && profile.hourlyRate > 0 && (
                    <span className="flex items-center gap-1 font-medium"><DollarSign size={14} className="text-gray-400" />${profile.hourlyRate}/hr</span>
                  )}
                </div>
                  </div>
                </div>

                <div className="flex-1 mt-2">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                </div>

                {/* Action Buttons */}
                {user && user.uid !== uid && (
                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
                    <motion.button
                      onClick={async () => {
                        if (!user || !currentUserProfile || !profile) return;
                        setStartingChat(true);
                        try {
                          const name = currentUserProfile.displayName || `${currentUserProfile.firstName} ${currentUserProfile.lastName}`;
                          const avatar = currentUserProfile.profilePhotoUrl || `${(currentUserProfile.firstName || "")[0]}${(currentUserProfile.lastName || "")[0]}`.toUpperCase();
                          const otherName = profile.displayName || `${profile.firstName} ${profile.lastName}`;
                          const otherAvatar = profile.profilePhotoUrl || `${(profile.firstName || "")[0]}${(profile.lastName || "")[0]}`.toUpperCase();
                          await getOrCreateConversation(user.uid, name, avatar, uid, otherName, otherAvatar);
                          router.push("/dashboard/messages");
                        } catch (err) {
                          console.error("Failed to start conversation:", err);
                        } finally {
                          setStartingChat(false);
                        }
                      }}
                      disabled={startingChat}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors shadow-sm disabled:opacity-50"
                      whileTap={{ scale: 0.97 }}
                    >
                      <MessageSquare size={16} />
                      {startingChat ? "Opening..." : "Message"}
                    </motion.button>
                    <motion.button
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-teal-700 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors border border-transparent hover:border-teal-200"
                      whileTap={{ scale: 0.97 }}
                    >
                      <Briefcase size={16} />
                      Hire
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col" variants={staggerItem}>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Film size={18} className="text-teal-600" />
                <h3 className="text-sm font-bold text-gray-900">Introduction</h3>
              </div>
              <div className="flex-1 p-5 flex flex-col justify-center bg-gray-50/50">
                {profile.introVideoUrl ? (
                  <div className="rounded-xl overflow-hidden bg-black w-full aspect-[4/3] shadow-inner">
                    <video src={profile.introVideoUrl} controls className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Film size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No introduction video</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar (Skills & Links) */}
          <motion.div className="lg:col-span-1 space-y-6" variants={staggerItem}>
            {/* Skills */}
            {profile.role === "va" && profile.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 text-[11px] font-semibold bg-gray-100 text-gray-700 rounded-lg">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {(profile.website || profile.linkedin) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Links</h3>
                <div className="space-y-3">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 hover:text-teal-600 transition-colors bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-teal-100">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-teal-600 shadow-sm shrink-0"><Globe size={14} /></div>
                      <span className="font-medium truncate">{profile.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-600 hover:text-teal-600 transition-colors bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-teal-100">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0"><Linkedin size={14} /></div>
                      <span className="font-medium">LinkedIn Profile</span>
                    </a>
                  )}
                </div>
              </div>
            )}

             {/* Legacy Portfolio Images Fallback */}
             {profile.role === "va" && profile.portfolioImages && profile.portfolioImages.length > 0 && (!profile.portfolioProjects || profile.portfolioProjects.length === 0) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">Gallery</h3>
                <div className="grid grid-cols-2 gap-2">
                  {profile.portfolioImages.map((img, i) => (
                    <div key={i} className="rounded-lg overflow-hidden aspect-square border border-gray-100">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Main Content (Education, Portfolio, Certificates) */}
          <motion.div className={`lg:col-span-2 space-y-6 ${profile.role === 'client' ? 'hidden' : ''}`} variants={staggerItem}>
            
            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2"><GraduationCap size={18} className="text-teal-600" /> Education</h3>
                <div className="space-y-6">
                  {profile.education.map((edu, i) => (
                    <div key={i} className="relative pl-6 sm:pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-px before:bg-gray-200 last:before:hidden">
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-teal-50 border-2 border-white flex items-center justify-center z-10 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">{edu.school}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 font-medium">{edu.degree} in {edu.field}</p>
                      <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">{edu.startYear} — {edu.endYear}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Projects */}
            {profile.portfolioProjects && profile.portfolioProjects.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2"><Briefcase size={18} className="text-teal-600" /> Portfolio</h3>
                <div className="space-y-8">
                  {profile.portfolioProjects.map((proj, i) => (
                    <div key={i} className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 sm:p-6 transition-colors hover:border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div>
                          <h4 className="text-base font-bold text-gray-900">{proj.name}</h4>
                          <p className="text-sm font-medium text-teal-600 mt-1">{proj.title}</p>
                        </div>
                        {proj.links && proj.links[0] && (
                          <a href={proj.links[0]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:text-teal-600 hover:border-teal-200 shadow-sm transition-all self-start">
                            View Project <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                      
                      {proj.description && (
                        <p className="text-sm text-gray-600 leading-relaxed mb-5">{proj.description}</p>
                      )}

                      {proj.mediaUrls && proj.mediaUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {proj.mediaUrls.map((url, imgIdx) => (
                            <div key={imgIdx} className="rounded-lg overflow-hidden aspect-[4/3] border border-gray-100 shadow-sm">
                              <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Certificates */}
            {profile.certificates && profile.certificates.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
                <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2"><FileText size={18} className="text-teal-600" /> Certificates & Awards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {profile.certificates.map((cert, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="h-32 sm:h-40 bg-gray-100 relative overflow-hidden">
                        {cert.url.includes(".pdf") ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                            <FileText size={40} className="mb-2 opacity-50"/>
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-300">PDF Document</span>
                          </div>
                        ) : (
                          <img src={cert.url} alt="Certificate" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        )}
                        <a href={cert.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="px-3 py-1.5 bg-white text-gray-900 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1"><ExternalLink size={12}/> View</span>
                        </a>
                      </div>
                      <div className="p-4 sm:p-5">
                        <h4 className="text-sm font-bold text-gray-900 mb-1 leading-tight line-clamp-2" title={cert.name}>{cert.name.replace(/\.[^/.]+$/, "")}</h4>
                        {cert.description && <p className="text-xs text-gray-500 line-clamp-2 mt-2">{cert.description}</p>}
                        
                        {cert.skills && cert.skills.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                            {cert.skills.map(skill => (
                              <span key={skill} className="px-2 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-700 rounded-md whitespace-nowrap">{skill}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
