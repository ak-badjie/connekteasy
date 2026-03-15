"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { updateUserProfile } from "@/app/lib/firestore";
import SkillPicker from "@/app/components/SkillPicker";
import {
  uploadProfilePhoto,
  uploadCoverPhoto,
  uploadCertificate,
  uploadPortfolioImage,
  uploadIntroVideo,
} from "@/app/lib/storage";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { CheckCircle, Upload, X, Film, Image, FileText, Plus, GraduationCap, Briefcase, ExternalLink } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import type { Education, PortfolioProject, UploadedFile } from "@/app/lib/types";

export default function ProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  
  // Basic Info State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    bio: "",
    hourlyRate: "",
    location: "",
    website: "",
    linkedin: "",
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // Complex Arrays State
  const [education, setEducation] = useState<Education[]>([]);
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>([]);
  const [certificates, setCertificates] = useState<UploadedFile[]>([]);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);
  const certificateRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const portfolioImageRef = useRef<HTMLInputElement>(null);

  // Load profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        title: userProfile.title || "",
        bio: userProfile.bio || "",
        hourlyRate: userProfile.hourlyRate?.toString() || "",
        location: userProfile.location || "",
        website: userProfile.website || "",
        linkedin: userProfile.linkedin || "",
      });
      setSelectedSkills(userProfile.skills || []);
      setEducation(userProfile.education || []);
      setPortfolioProjects(userProfile.portfolioProjects || []);
      setCertificates(userProfile.certificates || []);
    }
  }, [userProfile]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`,
        title: formData.title,
        bio: formData.bio,
        hourlyRate: parseFloat(formData.hourlyRate) || 0,
        skills: selectedSkills,
        location: formData.location,
        website: formData.website,
        linkedin: formData.linkedin,
        education,
        portfolioProjects,
        certificates,
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  // ─── File Uploads ─────────────────────────────────────────

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading("profilePhoto");
    try {
      const url = await uploadProfilePhoto(user.uid, file);
      await updateUserProfile(user.uid, { profilePhotoUrl: url });
      await refreshProfile();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(null);
    }
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading("coverPhoto");
    try {
      const url = await uploadCoverPhoto(user.uid, file);
      await updateUserProfile(user.uid, { coverPhotoUrl: url });
      await refreshProfile();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(null);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading("video");
    try {
      const url = await uploadIntroVideo(user.uid, file);
      await updateUserProfile(user.uid, { introVideoUrl: url });
      await refreshProfile();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(null);
    }
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setUploading("certificate");
    try {
      const newCerts = [...certificates];
      for (const file of files) {
        const url = await uploadCertificate(user.uid, file);
        newCerts.push({
          name: file.name,
          url,
          uploadedAt: Timestamp.now(),
          description: "",
          skills: [],
        });
      }
      setCertificates(newCerts);
      await updateUserProfile(user.uid, { certificates: newCerts });
      await refreshProfile();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(null);
    }
  };

  // ─── Array Managers ───────────────────────────────────────

  const addEducation = () => {
    setEducation([...education, { school: "", degree: "", field: "", startYear: "", endYear: "" }]);
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const removeEducation = (index: number) => {
    const updated = [...education];
    updated.splice(index, 1);
    setEducation(updated);
  };

  const addPortfolioProject = () => {
    setPortfolioProjects([...portfolioProjects, { name: "", title: "", description: "", links: [""], mediaUrls: [] }]);
  };

  const updatePortfolioProject = (index: number, field: keyof PortfolioProject, value: any) => {
    const updated = [...portfolioProjects];
    updated[index][field] = value as never;
    setPortfolioProjects(updated);
  };

  const handlePortfolioImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(`portfolio-${index}`);
    try {
      const url = await uploadPortfolioImage(user.uid, file);
      const updated = [...portfolioProjects];
      updated[index].mediaUrls.push(url);
      setPortfolioProjects(updated);
      await updateUserProfile(user.uid, { portfolioProjects: updated });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(null);
    }
  };

  const removePortfolioProject = (index: number) => {
    const updated = [...portfolioProjects];
    updated.splice(index, 1);
    setPortfolioProjects(updated);
  };

  const updateCertificate = (index: number, field: keyof UploadedFile, value: any) => {
    const updated = [...certificates];
    updated[index][field] = value as never;
    setCertificates(updated);
  };

  const removeCertificate = (index: number) => {
    const updated = [...certificates];
    updated.splice(index, 1);
    setCertificates(updated);
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <motion.div className="mb-6 flex justify-between items-end" variants={fadeInUp}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile Overview</h1>
          <p className="text-sm text-gray-500">Manage your public profile and portfolio to attract the right clients.</p>
        </div>
        <motion.button onClick={handleSave} disabled={saving} className="px-6 py-2 text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50" whileTap={{ scale: 0.97 }}>
          {saving ? "Saving..." : "Save Changes"}
        </motion.button>
      </motion.div>

      {/* Success Banner */}
      <AnimatePresence>
        {saved && (
          <motion.div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm text-emerald-800 font-medium" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
            <CheckCircle size={18} className="text-emerald-500" />
            Profile updated successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Sticky Header & Video) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Cover & Avatar Header */}
          <motion.div className="bg-white rounded-xl border border-gray-200 overflow-hidden" variants={staggerItem}>
            <div className="relative h-32 bg-gray-200">
              {userProfile?.coverPhotoUrl && <img src={userProfile.coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />}
              <button onClick={() => coverPhotoRef.current?.click()} className="absolute top-2 right-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm" disabled={uploading === "coverPhoto"}>
                {uploading === "coverPhoto" ? "..." : "Edit Cover"}
              </button>
              <input ref={coverPhotoRef} type="file" accept="image/*" onChange={handleCoverPhotoUpload} className="hidden" />
            </div>

            <div className="px-5 pb-5 -mt-10 relative text-center">
              <div className="relative inline-block">
                {userProfile?.profilePhotoUrl ? (
                  <img src={userProfile.profilePhotoUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg mx-auto bg-white" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold border-4 border-white shadow-lg mx-auto">
                    {formData.firstName[0]}{formData.lastName[0]}
                  </div>
                )}
                <button onClick={() => profilePhotoRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-teal-500 text-white rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors shadow-md border-2 border-white" disabled={uploading === "profilePhoto"}>
                  <Upload size={12} />
                </button>
                <input ref={profilePhotoRef} type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mt-2">{formData.firstName} {formData.lastName}</h2>
              <p className="text-xs text-gray-500 font-medium">{formData.title || "Your professional title"}</p>
            </div>
          </motion.div>

          {/* Intro Video */}
          <motion.div className="bg-white rounded-xl border border-gray-200 p-5" variants={staggerItem}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Intro Video</h3>
              <button onClick={() => videoRef.current?.click()} className="text-xs font-semibold text-teal-600 hover:text-teal-700 disabled:opacity-50" disabled={uploading === "video"}>
                {uploading === "video" ? "Uploading..." : userProfile?.introVideoUrl ? "Change" : "Add"}
              </button>
              <input ref={videoRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            </div>
            {userProfile?.introVideoUrl ? (
              <div className="rounded-lg overflow-hidden bg-black aspect-[4/5] sm:aspect-video lg:aspect-[4/5]">
                <video src={userProfile.introVideoUrl} controls className="w-full h-full object-cover" />
              </div>
            ) : (
              <button onClick={() => videoRef.current?.click()} className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-all">
                <Film size={24} className="mb-2" />
                <span className="text-xs font-medium">Record an Intro</span>
              </button>
            )}
            <p className="text-[10px] text-gray-500 mt-3 text-center leading-relaxed">
              Stand out to clients! Briefly introduce yourself, your skills, and what makes you great to work with.
            </p>
          </motion.div>

        </div>

        {/* Right Column (Form Sections) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Info Form */}
          <motion.div className="bg-white rounded-xl border border-gray-200 p-6" variants={staggerItem}>
            <h3 className="text-sm font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">About You</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">First Name</label>
                <input type="text" value={formData.firstName} onChange={(e) => handleChange("firstName", e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Last Name</label>
                <input type="text" value={formData.lastName} onChange={(e) => handleChange("lastName", e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Professional Title</label>
              <input type="text" value={formData.title} onChange={(e) => handleChange("title", e.target.value)} placeholder="e.g. Senior Frontend Developer" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Bio</label>
              <textarea value={formData.bio} onChange={(e) => handleChange("bio", e.target.value)} rows={4} placeholder="Describe your experience and what you do best..." className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              {userProfile?.role === "va" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Hourly Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                    <input type="number" value={formData.hourlyRate} onChange={(e) => handleChange("hourlyRate", e.target.value)} className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
                  </div>
                </div>
              )}
              <div className={userProfile?.role === "va" ? "" : "col-span-2"}>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Location</label>
                <input type="text" value={formData.location} onChange={(e) => handleChange("location", e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
              </div>
            </div>

            {userProfile?.role === "va" && (
              <div className="mb-6">
                <SkillPicker selected={selectedSkills} onChange={setSelectedSkills} minSkills={5} label="Expertise & Skills" />
              </div>
            )}

            <h3 className="text-sm font-bold text-gray-900 mb-4 pt-4 border-t border-gray-100">Social Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Website</label>
                <input type="url" value={formData.website} onChange={(e) => handleChange("website", e.target.value)} placeholder="https://" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">LinkedIn</label>
                <input type="url" value={formData.linkedin} onChange={(e) => handleChange("linkedin", e.target.value)} placeholder="https://" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
              </div>
            </div>
          </motion.div>

          {/* Render below sections ONLY for VAs */}
          {userProfile?.role !== "client" && (
            <>
              {/* Education Section */}
              <motion.div className="bg-white rounded-xl border border-gray-200 p-6" variants={staggerItem}>
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><GraduationCap size={16} className="text-teal-600"/> Education</h3>
              <button onClick={addEducation} className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                <Plus size={14} /> Add Education
              </button>
            </div>
            
            <div className="space-y-6">
              {education.map((edu, idx) => (
                <div key={idx} className="relative p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                  <button onClick={() => removeEducation(idx)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 border border-gray-200 shadow-sm"><X size={14} /></button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-6">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">School / University</label>
                      <input type="text" value={edu.school} onChange={(e) => updateEducation(idx, "school", e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white" placeholder="Stanford University" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Degree</label>
                      <input type="text" value={edu.degree} onChange={(e) => updateEducation(idx, "degree", e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white" placeholder="B.S. Computer Science" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Start Year</label>
                      <input type="text" value={edu.startYear} onChange={(e) => updateEducation(idx, "startYear", e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white" placeholder="2018" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">End Year</label>
                      <input type="text" value={edu.endYear} onChange={(e) => updateEducation(idx, "endYear", e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white" placeholder="2022" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Field of Study</label>
                      <input type="text" value={edu.field} onChange={(e) => updateEducation(idx, "field", e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white" placeholder="Computer Science" />
                    </div>
                  </div>
                </div>
              ))}
              {education.length === 0 && (
                <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-xs">Add your educational background to build trust.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Portfolio Projects Section */}
          <motion.div className="bg-white rounded-xl border border-gray-200 p-6" variants={staggerItem}>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Briefcase size={16} className="text-teal-600"/> Portfolio Projects</h3>
              <button onClick={addPortfolioProject} className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                <Plus size={14} /> Add Project
              </button>
            </div>

            <div className="space-y-6">
              {portfolioProjects.map((proj, idx) => (
                <div key={idx} className="relative p-5 rounded-xl border border-gray-200 bg-gray-50/50">
                  <button onClick={() => removePortfolioProject(idx)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1.5 border border-gray-200 shadow-sm"><X size={14} /></button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Project Name</label>
                      <input type="text" value={proj.name} onChange={(e) => updatePortfolioProject(idx, "name", e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white" placeholder="e.g. E-commerce Redesign" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Your Role / Title</label>
                      <input type="text" value={proj.title} onChange={(e) => updatePortfolioProject(idx, "title", e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white" placeholder="e.g. Lead UI Designer" />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={proj.description} onChange={(e) => updatePortfolioProject(idx, "description", e.target.value)} rows={3} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white resize-none" placeholder="Describe the problem, your solution, and results..." />
                  </div>

                  <div className="mb-4">
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">Live URL (optional)</label>
                    <input type="url" value={proj.links[0] || ""} onChange={(e) => updatePortfolioProject(idx, "links", [e.target.value])} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white" placeholder="https://" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mt-5 mb-2">
                      <label className="block text-[11px] font-medium text-gray-700">Project Images</label>
                      <button onClick={() => { document.getElementById(`port-upload-${idx}`)?.click() }} className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded">Upload Image</button>
                      <input id={`port-upload-${idx}`} type="file" accept="image/*" onChange={(e) => handlePortfolioImageUpload(idx, e)} className="hidden" />
                    </div>
                    <div className="flex gap-3 overflow-x-auto py-1 no-scrollbar">
                      {proj.mediaUrls.map((url, imgIdx) => (
                        <div key={imgIdx} className="relative shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => {
                            const updated = [...portfolioProjects];
                            updated[idx].mediaUrls.splice(imgIdx, 1);
                            setPortfolioProjects(updated);
                          }} className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                        </div>
                      ))}
                      {proj.mediaUrls.length === 0 && <div className="w-full py-4 text-center text-[10px] text-gray-400 border border-dashed rounded-lg border-gray-200 bg-white">No images added</div>}
                    </div>
                  </div>

                </div>
              ))}
              {portfolioProjects.length === 0 && (
                <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-xs">Showcase your best work to win clients.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Enhanced Certificates */}
          <motion.div className="bg-white rounded-xl border border-gray-200 p-6" variants={staggerItem}>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><FileText size={16} className="text-teal-600"/> Certificates & Awards</h3>
              <button disabled={uploading === "certificate"} onClick={() => certificateRef.current?.click()} className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 disabled:opacity-50">
                <Plus size={14} /> Upload New
              </button>
              <input ref={certificateRef} type="file" accept="image/*,.pdf" multiple onChange={handleCertificateUpload} className="hidden" />
            </div>

            <div className="space-y-4">
              {certificates.map((cert, idx) => (
                <div key={idx} className="relative p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
                  <div className="sm:w-32 shrink-0">
                    {cert.url.includes(".pdf") ? (
                      <div className="w-full pt-[75%] relative bg-red-50 rounded-lg border border-red-100 flex items-center justify-center text-red-400">
                        <div className="absolute inset-0 flex flex-col items-center justify-center"><FileText size={24} className="mb-1"/><span className="text-[10px] font-bold">PDF</span></div>
                      </div>
                    ) : (
                      <div className="w-full pt-[75%] relative rounded-lg border border-gray-200 overflow-hidden">
                        <img src={cert.url} alt="Certificate" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    )}
                    <a href={cert.url} target="_blank" rel="noopener noreferrer" className="block text-center text-[10px] font-medium text-teal-600 hover:underline mt-2 flex items-center justify-center gap-1"><ExternalLink size={10}/> View Original</a>
                  </div>
                  
                  <div className="flex-1">
                    <button onClick={() => removeCertificate(idx)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1 border border-gray-200 shadow-sm"><X size={14} /></button>
                    
                    <div className="mb-3 pr-8">
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Certificate Name / Title</label>
                      <input type="text" value={cert.name} onChange={(e) => updateCertificate(idx, "name", e.target.value)} className="w-full px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-white" />
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-[11px] font-medium text-gray-700 mb-1">Description & Issuing Organization</label>
                      <textarea value={cert.description || ""} onChange={(e) => updateCertificate(idx, "description", e.target.value)} rows={2} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white resize-none" placeholder="e.g. Google Data Analytics Professional Certificate..." />
                    </div>

                    <div>
                      <SkillPicker
                        selected={cert.skills || []}
                        onChange={(newSkills) => updateCertificate(idx, "skills", newSkills)}
                        minSkills={1}
                        label="Skills Gained"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {certificates.length === 0 && (
                <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  <p className="text-xs">Upload certificates or awards to validate your expertise.</p>
                </div>
              )}
            </div>
          </motion.div>
          </>
        )}

        </div>
      </div>
    </motion.div>
  );
}
