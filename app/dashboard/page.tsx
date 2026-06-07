"use client";

import { useAuth } from "@/app/lib/AuthContext";
import StudentDashboard from "./_components/StudentDashboard";
import JobSeekerDashboard from "./_components/JobSeekerDashboard";
import FreelancerDashboard from "./_components/FreelancerDashboard";
import EmployerDashboard from "./_components/EmployerDashboard";

export default function DashboardOverview() {
  const { userProfile, loading } = useAuth();

  if (loading || !userProfile) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  switch (userProfile.role) {
    case "student":
      return <StudentDashboard />;
    case "job_seeker":
      return <JobSeekerDashboard />;
    case "client":
      return <EmployerDashboard />;
    case "va":
    default:
      return <FreelancerDashboard />;
  }
}
