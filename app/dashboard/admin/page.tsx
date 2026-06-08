"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The admin area now lives at /admin with its own shell. Redirect any old links.
export default function LegacyAdminRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin");
  }, [router]);
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
