import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function PrivacyPolicy() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="font-heading text-xl font-bold">ConstructMarket</span>
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container-fluid py-8 lg:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-slate max-w-none">
            <h1 className="font-heading text-4xl font-bold text-foreground mb-2">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mb-8">
              Last Updated: March 2026 | Effective Date: March 2026
            </p>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-8">
              <p className="text-sm m-0">
                ConstructMarket Pty Ltd ("we", "us", "our") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
              </p>
            </div>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              1. Information We Collect
            </h2>

            <h3 className="font-heading text-lg font-semibold mt-6">1.1 Personal Information</h3>
            <p>We collect the following categories of personal information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identity Information:</strong> Name, date of birth, ABN, ACN, licence numbers</li>
              <li><strong>Contact Information:</strong> Email address, phone number, business address</li>
              <li><strong>Account Information:</strong> Username, password (encrypted), account preferences</li>
              <li><strong>Financial Information:</strong> Bank account details, payment card information (processed by Stripe)</li>
              <li><strong>Business Information:</strong> Company name, business type, trade licences, insurance certificates</li>
              <li><strong>Transaction Information:</strong> Details of tasks, bids, contracts, payments</li>
              <li><strong>Communication Information:</strong> Messages sent through our platform, support inquiries</li>
            </ul>

            <h3 className="font-heading text-lg font-semibold mt-6">1.2 Automatically Collected Information</h3>
            <p>When you use our Platform, we automatically collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device information (type, operating system, browser)</li>
              <li>IP address and location data</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              2. How We Use Your Information
            </h2>

            <p>We use your information for the following purposes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Platform Operations:</strong> Creating and managing your account, facilitating transactions between Builders and Providers</li>
              <li><strong>Verification:</strong> Verifying your identity, business credentials, licences, and insurance</li>
              <li><strong>Communication:</strong> Sending notifications, updates, and responding to inquiries</li>
              <li><strong>Payment Processing:</strong> Processing payments through our payment service provider (Stripe)</li>
              <li><strong>Security:</strong> Detecting and preventing fraud, unauthorised access, and other illegal activities</li>
              <li><strong>Improvement:</strong> Analysing usage patterns to improve our Platform and services</li>
              <li><strong>Legal Compliance:</strong> Complying with legal obligations, including tax reporting and regulatory requirements</li>
              <li><strong>Marketing:</strong> Sending promotional communications (with your consent)</li>
            </ul>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              3. Legal Basis for Processing
            </h2>

            <p>Under the Australian Privacy Principles, we process your personal information based on:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Consent:</strong> Where you have given explicit consent</li>
              <li><strong>Contract:</strong> Where processing is necessary to perform our services</li>
              <li><strong>Legal Obligation:</strong> Where we are required by law to process your information</li>
              <li><strong>Legitimate Interests:</strong> Where processing is necessary for our legitimate business interests</li>
            </ul>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              4. Disclosure of Your Information
            </h2>

            <h3 className="font-heading text-lg font-semibold mt-6">4.1 Third Parties</h3>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Other Users:</strong> Your business contact information is shared with other Users as necessary to facilitate transactions</li>
              <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (payment processing, cloud hosting, analytics)</li>
              <li><strong>Professional Advisors:</strong> Lawyers, accountants, and auditors</li>
              <li><strong>Regulatory Authorities:</strong> Government bodies and regulators as required by law</li>
            </ul>

            <h3 className="font-heading text-lg font-semibold mt-6">4.2 Payment Processors</h3>
            <p>
              Payment information is processed by Stripe in accordance with their privacy policy. 
              We do not store complete payment card details on our servers.
            </p>

            <h3 className="font-heading text-lg font-semibold mt-6">4.3 Overseas Disclosure</h3>
            <p>
              Your information may be transferred to and processed in countries outside Australia 
              where our service providers are located. We take reasonable steps to ensure that 
              overseas recipients handle your information in accordance with the APPs.
            </p>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              5. Data Security
            </h2>

            <p>We implement appropriate security measures including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure password hashing using bcrypt</li>
              <li>Two-factor authentication (2FA) options</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Access controls and authentication procedures</li>
              <li>Employee training on data protection</li>
            </ul>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              6. Data Retention
            </h2>

            <p>We retain your personal information for as long as necessary to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide our services to you</li>
              <li>Comply with legal obligations (including tax and accounting requirements)</li>
              <li>Resolve disputes and enforce our agreements</li>
              <li>Meet regulatory requirements</li>
            </ul>
            <p>
              Generally, account information is retained for 7 years after account closure 
              to comply with Australian tax law requirements.
            </p>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              7. Your Rights
            </h2>

            <p>Under the Privacy Act 1988 (Cth), you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request access to personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or outdated information</li>
              <li><strong>Opt-out:</strong> Opt out of receiving marketing communications</li>
              <li><strong>Complaint:</strong> Lodge a complaint about our handling of your information</li>
            </ul>

            <p>
              To exercise these rights, please contact us using the details below. We will respond 
              to your request within 30 days as required by law.
            </p>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              8. Cookies and Tracking
            </h2>

            <h3 className="font-heading text-lg font-semibold mt-6">8.1 Types of Cookies We Use</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for Platform functionality</li>
              <li><strong>Performance Cookies:</strong> Help us understand how visitors use our Platform</li>
              <li><strong>Functional Cookies:</strong> Remember your preferences</li>
              <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with consent)</li>
            </ul>

            <h3 className="font-heading text-lg font-semibold mt-6">8.2 Managing Cookies</h3>
            <p>
              You can control cookies through your browser settings. Note that disabling certain 
              cookies may affect Platform functionality.
            </p>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              9. Notifiable Data Breaches
            </h2>

            <p>
              In the event of an eligible data breach that is likely to result in serious harm, 
              we will notify affected individuals and the Office of the Australian Information 
              Commissioner (OAIC) as required under Part IIIC of the Privacy Act 1988 (Cth).
            </p>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              10. Children's Privacy
            </h2>

            <p>
              Our Platform is not intended for use by individuals under 18 years of age. 
              We do not knowingly collect personal information from children.
            </p>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              11. Changes to This Policy
            </h2>

            <p>
              We may update this Privacy Policy from time to time. Material changes will be 
              notified via email or Platform notification. Continued use of the Platform after 
              changes take effect constitutes acceptance of the updated policy.
            </p>

            <h2 className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-10">
              12. Contact Us
            </h2>

            <div className="bg-muted/50 rounded-lg p-6 mt-4">
              <p className="mb-2"><strong>Privacy Officer</strong></p>
              <p className="mb-2">ConstructMarket Pty Ltd</p>
              <p className="mb-1">Email: privacy@constructmarket.com.au</p>
              <p className="mb-1">Phone: 1300 CONSTRUCT</p>
              <p className="mb-4">Website: www.constructmarket.com.au</p>
              <p className="text-sm text-muted-foreground">
                If you are not satisfied with our response to a privacy complaint, you may 
                lodge a complaint with the Office of the Australian Information Commissioner (OAIC) 
                at www.oaic.gov.au.
              </p>
            </div>

            <div className="text-center text-muted-foreground text-sm mt-12 pt-8 border-t">
              <p>© 2026 ConstructMarket Pty Ltd. All rights reserved.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all z-50"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30">
        <div className="container-fluid">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-heading font-bold">ConstructMarket</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms & Conditions</Link>
              <Link to="/privacy" className="text-primary font-medium">Privacy Policy</Link>
              <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
