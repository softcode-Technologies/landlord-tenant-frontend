import type { Metadata } from "next"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your use of the NaijaRental rental management platform.",
}

const LAST_UPDATED = "20 May 2026"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0f1e]">
      <Navbar />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-[#0a1e33] via-[#0f2d48] to-[#1a3c5e] text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <p className="text-xs font-semibold text-[#f97316] uppercase tracking-[0.18em] mb-3">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-slate-300/90 mt-3 text-sm">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-slate-700 dark:text-slate-300 leading-relaxed">
          <p className="text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 rounded-xl p-4 mb-10">
            These terms are a working draft provided for transparency. Please have them
            reviewed by qualified legal counsel before relying on them.
          </p>

          <Section title="1. Acceptance of terms">
            By creating an account or using NaijaRental, you agree to these Terms of Service and
            our Privacy Policy. If you do not agree, please do not use the platform.
          </Section>

          <Section title="2. Who can use NaijaRental">
            You must be at least 18 years old and able to enter a binding contract. Landlords and
            agents must complete identity verification (KYC) before listing properties or
            managing tenancies.
          </Section>

          <Section title="3. Your account">
            You are responsible for the activity on your account and for keeping your login
            secure. Provide accurate information and keep it up to date. We may suspend or close
            accounts that violate these terms or that we reasonably believe are fraudulent.
          </Section>

          <Section title="4. Listings and tenancy records">
            Landlords and agents are responsible for the accuracy of the listings, rent figures,
            and tenancy details they publish. NaijaRental provides the tools to record and manage
            these but is not a party to the tenancy agreement between landlord and tenant.
          </Section>

          <Section title="5. Payments and fees">
            Rent and platform payments are processed by our licensed payment partner. Any platform
            or service fees will be disclosed before you incur them. You agree to pay all amounts
            due for services you use.
          </Section>

          <Section title="6. Our role">
            NaijaRental is a technology platform. We facilitate listings, payments, communication,
            and record-keeping, but we do not own the properties, guarantee any tenancy outcome, or
            act as a real-estate broker. Disputes between landlords, agents, and tenants are
            ultimately between those parties, though our records may help resolve them.
          </Section>

          <Section title="7. Acceptable use">
            Do not use the platform to post false or misleading listings, harass others, commit
            fraud, infringe others&rsquo; rights, or break any applicable law. We may remove content
            and restrict accounts that breach these rules.
          </Section>

          <Section title="8. Intellectual property">
            The platform, its software, and its branding are owned by NaijaRental Technologies Ltd.
            You retain ownership of the content you upload but grant us a licence to host and
            display it as needed to operate the service.
          </Section>

          <Section title="9. Disclaimers and liability">
            The platform is provided &ldquo;as is.&rdquo; To the fullest extent permitted by law, we are not
            liable for indirect or consequential losses, or for the conduct of any landlord, agent,
            or tenant. Nothing in these terms limits liability that cannot be limited under
            Nigerian law.
          </Section>

          <Section title="10. Termination">
            You may stop using the platform at any time. We may suspend or terminate access where
            these terms are breached or where required by law. Certain obligations (such as payment
            and record-keeping) survive termination.
          </Section>

          <Section title="11. Governing law">
            These terms are governed by the laws of the Federal Republic of Nigeria, and disputes
            are subject to the jurisdiction of the Nigerian courts.
          </Section>

          <Section title="12. Contact us">
            Questions about these terms? Email{" "}
            <a href="mailto:legal@naijarental.com" className="text-[#f97316] font-medium hover:underline">
              legal@naijarental.com
            </a>.
          </Section>
        </article>
      </main>

      <Footer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2.5">{title}</h2>
      <div className="text-[15px]">{children}</div>
    </section>
  )
}
