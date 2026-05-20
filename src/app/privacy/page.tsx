import type { Metadata } from "next"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { BRAND_NAME, BRAND_LEGAL_NAME, brandEmail } from "@/lib/config/brand"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BRAND_NAME} collects, uses, and protects your personal data, in line with the Nigeria Data Protection Act.`,
}

const LAST_UPDATED = "20 May 2026"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0f1e]">
      <Navbar />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-[#0a1e33] via-[#0f2d48] to-[#1a3c5e] text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <p className="text-xs font-semibold text-[#f97316] uppercase tracking-[0.18em] mb-3">Legal</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-slate-300/90 mt-3 text-sm">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-slate-700 dark:text-slate-300 leading-relaxed">
          <p className="text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 rounded-xl p-4 mb-10">
            This policy is a working draft provided for transparency. Please have it
            reviewed by qualified legal counsel before relying on it for compliance.
          </p>

          <Section title="1. Who we are">
            {BRAND_LEGAL_NAME} (&ldquo;{BRAND_NAME}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a rental
            management platform connecting landlords, agents, and tenants in Nigeria. This
            policy explains how we handle your personal data and your rights under the Nigeria
            Data Protection Act (NDPA) 2023.
          </Section>

          <Section title="2. Information we collect">
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong>Account data:</strong> name, phone number, email, and role (landlord, agent, or tenant).</li>
              <li><strong>Identity verification (KYC):</strong> NIN, BVN, and identity documents, processed through our verification partner to confirm you are who you say you are.</li>
              <li><strong>Property &amp; tenancy data:</strong> listings, units, lease terms, rent amounts, and renewal dates you record on the platform.</li>
              <li><strong>Payment data:</strong> transaction records processed by our payment partner. We do not store full card details.</li>
              <li><strong>Usage data:</strong> device information, log data, and how you interact with the platform.</li>
            </ul>
          </Section>

          <Section title="3. How we use your information">
            We use your data to operate the platform: verifying identities, publishing and
            managing listings, processing rent payments and generating receipts, sending rent
            reminders and notifications, enabling communication between parties, and improving
            and securing the service.
          </Section>

          <Section title="4. Identity verification">
            To keep listings trustworthy, landlords and agents undergo KYC verification through
            a licensed third-party provider. We share only the data necessary to complete that
            check and receive a verification result in return.
          </Section>

          <Section title="5. Payments">
            Rent and platform payments are processed by a licensed payment provider. Card and
            bank details are handled by that provider under their own security standards; we
            retain a transaction record (amount, date, status) for receipts and dispute
            resolution.
          </Section>

          <Section title="6. Sharing your information">
            We share data only as needed to run the service — for example, a tenant&rsquo;s contact
            details with their landlord for an active tenancy — and with service providers
            (verification, payments, messaging, hosting) bound to protect it. We do not sell
            your personal data.
          </Section>

          <Section title="7. Data retention">
            We keep payment and tenancy records for as long as needed to provide the service and
            to meet legal, tax, and dispute-resolution obligations. You may request deletion of
            data we are not legally required to retain.
          </Section>

          <Section title="8. Your rights">
            Under the NDPA you may access, correct, or request deletion of your personal data,
            object to certain processing, and withdraw consent. To exercise these rights, contact
            us using the details below.
          </Section>

          <Section title="9. Security">
            We use industry-standard safeguards to protect your data, including encryption in
            transit. No system is perfectly secure, but we work to keep your information safe and
            to notify you of any breach that materially affects you, as required by law.
          </Section>

          <Section title="10. Changes to this policy">
            We may update this policy as the platform evolves. Material changes will be
            communicated through the platform, and the &ldquo;last updated&rdquo; date above will change.
          </Section>

          <Section title="11. Contact us">
            Questions about this policy or your data? Email{" "}
            <a href={`mailto:${brandEmail("privacy")}`} className="text-[#f97316] font-medium hover:underline">
              {brandEmail("privacy")}
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
