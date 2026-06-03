import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — CONNEKT",
  description: "The terms that govern your use of CONNEKT.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: June 2026</p>

          <div className="space-y-6 text-sm sm:text-[15px] leading-relaxed text-gray-700">
            <p>
              These Terms govern your use of CONNEKT. By creating an account you agree to these Terms and to our{" "}
              <Link href="/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link>.
            </p>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">1. Accounts</h2>
              <p>
                You must provide accurate information and keep your credentials secure. You are responsible for all
                activity under your account. You must complete onboarding before accessing your dashboard.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">2. Roles</h2>
              <p>
                CONNEKT supports Students, Job Seekers, Freelancers, and Employers. The features available to you
                depend on the role you select during onboarding.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">3. Payments, escrow &amp; subscriptions</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Employers fund projects through the CONNEKT wallet; project budgets are held in escrow until released.</li>
                <li>On release, a platform fee of 30% applies and the remainder is paid to the freelancer.</li>
                <li>Applying to jobs and internships requires an active membership subscription, billed per cycle.</li>
                <li>Payments are processed by Modem Pay. Subscriptions do not auto-renew unless stated; you renew each cycle.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">4. Acceptable use</h2>
              <p>
                You agree not to post fraudulent listings, misrepresent yourself, harass others, or use CONNEKT for
                unlawful purposes. We may suspend accounts that violate these Terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">5. Liability</h2>
              <p>
                CONNEKT is a platform that connects parties; we are not a party to agreements between employers and
                talent. The service is provided &quot;as is&quot; without warranties to the fullest extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">6. Contact</h2>
              <p>
                Questions? Email{" "}
                <a href="mailto:hello@connekt.africa" className="text-teal-600 font-medium hover:underline">hello@connekt.africa</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
