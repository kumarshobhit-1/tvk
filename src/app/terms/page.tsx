import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | The Victory Key",
  description: "Read our terms of service and user agreement.",
};

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using The Victory Key, you accept and agree to be bound by the terms 
              and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p className="mb-4">
              Permission is granted to temporarily use The Victory Key for personal, 
              non-commercial transitory viewing only.
            </p>
            <p className="mb-4">This license shall automatically terminate if you violate any of these restrictions.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Account</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>You agree to provide accurate and complete information</li>
              <li>You must not share your account with others</li>
              <li>You are responsible for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Prohibited Uses</h2>
            <p className="mb-4">You may not use our service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>For any unlawful purpose or to solicit others to commit unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To transmit or procure the sending of any advertising or promotional material</li>
              <li>To impersonate or attempt to impersonate other users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Content</h2>
            <p className="mb-4">
              Our service allows you to post, link, store, share and otherwise make available certain information. 
              You retain ownership of any content you submit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Contact Information</h2>
            <p>
              Questions about the Terms of Service should be sent to us at:{" "}
              <a href="mailto:Consultantstvk@gmail.com" className="text-primary hover:underline">
                Consultantstvk@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}