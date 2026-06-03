import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — CONNEKT",
  description: "How CONNEKT collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: June 2026</p>

          <div className="space-y-6 text-sm sm:text-[15px] leading-relaxed text-gray-700">
            <p>
              CONNEKT (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) connects employers, freelancers, students, and job
              seekers across Africa. This policy explains what we collect, how we use it, and the choices you have.
              By using CONNEKT you agree to this policy.
            </p>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">1. Information we collect</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Account details</strong> — name, email, and the role you choose (Student, Job Seeker, Freelancer, or Employer).</li>
                <li><strong>Profile information</strong> — title, bio, skills, location, links, education, and portfolio you add.</li>
                <li><strong>Activity</strong> — projects, jobs, internships, proposals, applications, and messages you create.</li>
                <li><strong>Payment data</strong> — wallet balances and transactions. Card and mobile-money details are handled by our payment processor, Modem Pay, and are never stored on our servers.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">2. How we use your information</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To operate the marketplace — matching talent with work and processing applications.</li>
                <li>To process wallet deposits, withdrawals, escrow, and subscriptions.</li>
                <li>To secure your account and prevent fraud or abuse.</li>
                <li>To communicate important updates about your account and activity.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">3. Payments</h2>
              <p>
                Payments are processed securely by Modem Pay. When you deposit, withdraw, or subscribe, your
                payment information is transmitted directly to Modem Pay. We retain only a record of the
                transaction (amount, status, and reference) needed to maintain your wallet and access.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">4. Data storage &amp; security</h2>
              <p>
                Your data is stored using Google Firebase (Authentication, Firestore, and Realtime Database) with
                industry-standard security. We restrict access to your information and use encryption in transit.
                No method of transmission is completely secure, so we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">5. Sharing</h2>
              <p>
                We do not sell your personal data. Profile and application information you submit is shared with the
                relevant employer or candidate so they can evaluate a match. We share data with service providers
                (such as Modem Pay and Firebase) only as needed to run CONNEKT.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">6. Your rights</h2>
              <p>
                You can access and update your profile at any time from your dashboard. To request deletion of your
                account or data, contact us at the email below.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">7. Contact</h2>
              <p>
                Questions about this policy? Email us at{" "}
                <a href="mailto:hello@connekt.africa" className="text-teal-600 font-medium hover:underline">hello@connekt.africa</a>.
              </p>
            </section>
          </div>

          <p className="text-xs text-gray-400 mt-10 pt-6 border-t border-gray-100">
            See also our <Link href="/terms" className="text-teal-600 hover:underline">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
