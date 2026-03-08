import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, Printer, Download, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function TermsAndConditions() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      
      // Update active section based on scroll position
      const sections = document.querySelectorAll('h3[id]');
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= sectionTop - 100) {
          current = section.getAttribute('id');
        }
      });
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tableOfContents = [
    { id: 'part-a', title: 'Part A: General Terms', items: [
      { id: 'definitions', title: '1. Definitions and Interpretation' },
      { id: 'eligibility', title: '2. Eligibility and Registration' },
      { id: 'platform-services', title: '3. Platform Services' },
      { id: 'builder-obligations', title: '4. Builder Obligations' },
      { id: 'provider-obligations', title: '5. Provider Obligations' },
      { id: 'contract-formation', title: '6. Contract Formation' },
      { id: 'payment-terms', title: '7. Payment Terms' },
      { id: 'fees', title: '8. Fees and Charges' },
      { id: 'intellectual-property', title: '9. Intellectual Property' },
      { id: 'privacy', title: '10. Privacy and Data Protection' },
      { id: 'liability', title: '11. Limitation of Liability' },
      { id: 'indemnification', title: '12. Indemnification' },
      { id: 'dispute-resolution', title: '13. Dispute Resolution' },
      { id: 'termination', title: '14. Termination' },
      { id: 'general', title: '15. General Provisions' },
    ]},
    { id: 'part-b', title: 'Part B: Residential Building Work', items: [
      { id: 'home-building', title: '16. Home Building Act Compliance' },
      { id: 'state-requirements', title: '17. State and Territory Requirements' },
    ]},
    { id: 'part-c', title: 'Part C: Work Health and Safety', items: [
      { id: 'whs', title: '18. WHS Obligations' },
    ]},
    { id: 'part-d', title: 'Part D: AML/CTF', items: [
      { id: 'aml', title: '19. AML/CTF Compliance' },
    ]},
  ];

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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => window.print()} className="hidden sm:flex gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Link to="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container-fluid py-8 lg:py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <h4 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                Table of Contents
              </h4>
              <nav className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-4">
                {tableOfContents.map(part => (
                  <div key={part.id}>
                    <a 
                      href={`#${part.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {part.title}
                    </a>
                    <ul className="mt-2 ml-3 space-y-1 border-l pl-3">
                      {part.items.map(item => (
                        <li key={item.id}>
                          <a 
                            href={`#${item.id}`}
                            className={`text-xs transition-colors block py-0.5 ${
                              activeSection === item.id 
                                ? 'text-primary font-medium' 
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {item.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="prose prose-slate max-w-none">
              <h1 className="font-heading text-4xl font-bold text-foreground mb-2">
                Terms and Conditions
              </h1>
              <p className="text-muted-foreground mb-8">
                Last Updated: March 2026 | Effective Date: March 2026
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-yellow-800 m-0">
                  <strong>Important Notice:</strong> These Terms and Conditions constitute a legally binding agreement. 
                  By accessing or using the ConstructMarket platform, you acknowledge that you have read, understood, 
                  and agree to be bound by these Terms.
                </p>
              </div>

              {/* Part A */}
              <h2 id="part-a" className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-12">
                PART A: GENERAL TERMS
              </h2>

              <h3 id="definitions" className="font-heading text-xl font-semibold text-foreground mt-8">
                1. Definitions and Interpretation
              </h3>
              
              <h4 className="font-semibold mt-4">1.1 Definitions</h4>
              <p>In these Terms, unless the context otherwise requires:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"Australian Consumer Law"</strong> means Schedule 2 of the Competition and Consumer Act 2010 (Cth).</li>
                <li><strong>"Bid"</strong> means an offer submitted by a Provider through the Platform in response to a Task.</li>
                <li><strong>"Builder"</strong> means a User who registers on the Platform as a principal contractor, builder, or project manager seeking to engage Providers for construction-related Tasks.</li>
                <li><strong>"Contract"</strong> means the legally binding agreement formed between a Builder and a Provider through the Platform for the performance of a Task.</li>
                <li><strong>"GST"</strong> has the meaning given in the A New Tax System (Goods and Services Tax) Act 1999 (Cth).</li>
                <li><strong>"Platform"</strong> means the ConstructMarket website, mobile applications, and any related services, software, and technology.</li>
                <li><strong>"Platform Fee"</strong> means the fee charged by ConstructMarket for facilitating transactions through the Platform.</li>
                <li><strong>"Provider"</strong> means a User who registers on the Platform as a trade contractor, subcontractor, supplier, or service provider.</li>
                <li><strong>"Task"</strong> means a request for construction-related work or services posted by a Builder on the Platform.</li>
                <li><strong>"User"</strong> means any person or entity that accesses or uses the Platform, including Builders and Providers.</li>
              </ul>

              <h3 id="eligibility" className="font-heading text-xl font-semibold text-foreground mt-8">
                2. Eligibility and Registration
              </h3>
              
              <h4 className="font-semibold mt-4">2.1 Eligibility Requirements</h4>
              <p>To use the Platform, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be at least 18 years of age</li>
                <li>Have the legal capacity to enter into a binding contract</li>
                <li>Not be prohibited from using the Platform under applicable laws</li>
                <li>If registering as an entity, be duly incorporated or registered under Australian law</li>
                <li>Hold all necessary licences, permits, and insurance required to conduct your business activities in Australia</li>
              </ul>

              <h4 className="font-semibold mt-4">2.2 Australian Business Number (ABN)</h4>
              <p>
                Providers must hold a valid Australian Business Number (ABN) and provide this to ConstructMarket upon registration. 
                Builders engaging Providers through the Platform are responsible for verifying the ABN of Providers before entering into Contracts.
              </p>

              <h3 id="platform-services" className="font-heading text-xl font-semibold text-foreground mt-8">
                3. Platform Services
              </h3>
              
              <h4 className="font-semibold mt-4">3.1 Nature of Services</h4>
              <p>
                ConstructMarket provides an online marketplace platform that facilitates connections between Builders and Providers. 
                ConstructMarket is <strong>not</strong> a party to any Contract formed between Builders and Providers and does not provide 
                construction services, trade work, or labour hire services.
              </p>

              <h4 className="font-semibold mt-4">3.2 No Guarantee</h4>
              <p>
                ConstructMarket does not guarantee that any Task will receive Bids, any Bid will be accepted, or any Contract will be 
                formed or completed. ConstructMarket does not endorse any User and makes no representations regarding the quality or 
                legality of services offered by Users.
              </p>

              <h3 id="builder-obligations" className="font-heading text-xl font-semibold text-foreground mt-8">
                4. Builder Obligations
              </h3>
              
              <p>When posting a Task, Builders must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information about the work required</li>
                <li>Specify a reasonable and genuine budget range</li>
                <li>Not post misleading, false, or deceptive content</li>
                <li>Comply with all applicable laws, including workplace health and safety legislation</li>
                <li>Maintain adequate insurance coverage for their projects</li>
                <li>Pay Providers in accordance with the agreed Contract terms and applicable legislation</li>
              </ul>

              <h3 id="provider-obligations" className="font-heading text-xl font-semibold text-foreground mt-8">
                5. Provider Obligations
              </h3>
              
              <p>Providers are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Holding and maintaining all licences required under applicable State or Territory building and trade licensing legislation</li>
                <li>Maintaining adequate and current insurance, including:
                  <ul className="list-disc pl-6 mt-2">
                    <li>Public liability insurance (minimum $10,000,000 recommended)</li>
                    <li>Professional indemnity insurance where applicable</li>
                    <li>Workers compensation insurance as required by law</li>
                  </ul>
                </li>
                <li>Complying with all applicable laws, codes, standards, and regulations</li>
                <li>Performing work in a proper and workmanlike manner</li>
                <li>Issuing proper tax invoices that comply with GST legislation</li>
              </ul>

              <h3 id="contract-formation" className="font-heading text-xl font-semibold text-foreground mt-8">
                6. Contract Formation
              </h3>
              
              <p>
                A Contract is formed between a Builder and Provider when a Builder accepts a Provider's Bid through the Platform and both 
                parties execute the Contract using the Platform's e-signature functionality. By using the e-signature functionality, Users 
                acknowledge that electronic signatures have the same legal effect as handwritten signatures under the Electronic Transactions 
                Act 1999 (Cth).
              </p>

              <h3 id="payment-terms" className="font-heading text-xl font-semibold text-foreground mt-8">
                7. Payment Terms
              </h3>
              
              <h4 className="font-semibold mt-4">7.1 Payment Processing</h4>
              <p>
                Payments between Builders and Providers are processed through the Platform's integrated payment system, powered by Stripe. 
                By using the payment system, Users agree to Stripe's terms of service.
              </p>

              <h4 className="font-semibold mt-4">7.2 Security of Payment</h4>
              <p>
                Providers' rights under the Building and Construction Industry Security of Payment Act 1999 (NSW) (or equivalent legislation 
                in other States and Territories) are not affected by these Terms.
              </p>

              <h4 className="font-semibold mt-4">7.3 GST</h4>
              <p>
                Unless otherwise stated, all amounts are exclusive of GST. Providers must be registered for GST if required under the 
                A New Tax System (Goods and Services Tax) Act 1999 (Cth) and must issue compliant tax invoices.
              </p>

              <h3 id="fees" className="font-heading text-xl font-semibold text-foreground mt-8">
                8. Fees and Charges
              </h3>
              
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left border-b">Fee Type</th>
                      <th className="px-4 py-2 text-left border-b">Amount</th>
                      <th className="px-4 py-2 text-left border-b">Payable By</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="px-4 py-2 border-b">Registration</td><td className="px-4 py-2 border-b">Free</td><td className="px-4 py-2 border-b">All Users</td></tr>
                    <tr><td className="px-4 py-2 border-b">Task Posting</td><td className="px-4 py-2 border-b">Free</td><td className="px-4 py-2 border-b">Builders</td></tr>
                    <tr><td className="px-4 py-2 border-b">Bid Submission</td><td className="px-4 py-2 border-b">Free</td><td className="px-4 py-2 border-b">Providers</td></tr>
                    <tr><td className="px-4 py-2 border-b">Transaction Fee</td><td className="px-4 py-2 border-b">5% of Contract value</td><td className="px-4 py-2 border-b">Provider</td></tr>
                    <tr><td className="px-4 py-2">Payment Processing</td><td className="px-4 py-2">Standard Stripe fees</td><td className="px-4 py-2">As per Stripe</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 id="intellectual-property" className="font-heading text-xl font-semibold text-foreground mt-8">
                9. Intellectual Property
              </h3>
              
              <p>
                All Intellectual Property Rights in the Platform are owned by or licensed to ConstructMarket. Users retain ownership of 
                their User Content but grant ConstructMarket a non-exclusive, worldwide, royalty-free licence to use such content for 
                operating and promoting the Platform.
              </p>

              <h3 id="privacy" className="font-heading text-xl font-semibold text-foreground mt-8">
                10. Privacy and Data Protection
              </h3>
              
              <p>
                ConstructMarket collects, uses, and discloses Personal Information in accordance with the Privacy Act 1988 (Cth) and the 
                Australian Privacy Principles. See our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details.
              </p>

              <h3 id="liability" className="font-heading text-xl font-semibold text-foreground mt-8">
                11. Limitation of Liability
              </h3>
              
              <h4 className="font-semibold mt-4">11.1 Consumer Guarantees</h4>
              <p>
                Certain legislation, including the Australian Consumer Law, implies warranties and guarantees that cannot be excluded. 
                These Terms do not exclude, restrict, or modify the application of any such provisions where to do so would contravene that law.
              </p>

              <h4 className="font-semibold mt-4">11.2 Limitation</h4>
              <p>
                To the maximum extent permitted by law, ConstructMarket's total aggregate liability is limited to the total Platform Fees 
                paid by that User in the 12 months preceding the claim. ConstructMarket excludes all liability for indirect, consequential, 
                or punitive damages.
              </p>

              <h3 id="indemnification" className="font-heading text-xl font-semibold text-foreground mt-8">
                12. Indemnification
              </h3>
              
              <p>
                Users agree to indemnify and hold harmless ConstructMarket from any claims arising from breach of these Terms, violation 
                of applicable law, User Content, disputes with other Users, or negligent conduct.
              </p>

              <h3 id="dispute-resolution" className="font-heading text-xl font-semibold text-foreground mt-8">
                13. Dispute Resolution
              </h3>
              
              <p>
                Disputes between Builders and Providers are to be resolved directly between those parties. Users acknowledge that statutory 
                dispute resolution mechanisms may be available. These Terms are governed by the laws of New South Wales, Australia.
              </p>

              <h3 id="termination" className="font-heading text-xl font-semibold text-foreground mt-8">
                14. Termination
              </h3>
              
              <p>
                Users may terminate their account at any time. ConstructMarket may suspend or terminate accounts for breach of Terms, 
                fraudulent conduct, licence issues, or as required by law.
              </p>

              <h3 id="general" className="font-heading text-xl font-semibold text-foreground mt-8">
                15. General Provisions
              </h3>
              
              <p>
                These Terms constitute the entire agreement between Users and ConstructMarket. ConstructMarket may amend these Terms 
                with 30 days' notice for material changes. If any provision is found invalid, the remaining provisions continue in effect.
              </p>

              {/* Part B */}
              <h2 id="part-b" className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-12">
                PART B: RESIDENTIAL BUILDING WORK
              </h2>

              <h3 id="home-building" className="font-heading text-xl font-semibold text-foreground mt-8">
                16. Home Building Act Compliance (NSW)
              </h3>
              
              <p>
                Contracts for residential building work in NSW are subject to the statutory warranties implied by section 18B of the 
                Home Building Act 1989 (NSW). For work exceeding $20,000, Providers must obtain Home Building Compensation Fund insurance. 
                Contracts exceeding $5,000 must be in writing and include the particulars required by section 7.
              </p>

              <h3 id="state-requirements" className="font-heading text-xl font-semibold text-foreground mt-8">
                17. State and Territory Requirements
              </h3>
              
              <p>Providers must comply with equivalent legislation in their State or Territory, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Victoria: Domestic Building Contracts Act 1995 (Vic)</li>
                <li>Queensland: Queensland Building and Construction Commission Act 1991 (Qld)</li>
                <li>Western Australia: Building Services (Registration) Act 2011 (WA)</li>
                <li>South Australia: Building Work Contractors Act 1995 (SA)</li>
                <li>Tasmania: Building Act 2016 (Tas)</li>
                <li>ACT: Building Act 2004 (ACT)</li>
                <li>Northern Territory: Building Act 1993 (NT)</li>
              </ul>

              {/* Part C */}
              <h2 id="part-c" className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-12">
                PART C: WORK HEALTH AND SAFETY
              </h2>

              <h3 id="whs" className="font-heading text-xl font-semibold text-foreground mt-8">
                18. WHS Obligations
              </h3>
              
              <p>
                All Users must comply with the Work Health and Safety Act 2011 (Cth) and equivalent State and Territory legislation. 
                Principal contractors have specific duties including preparing WHS management plans. Providers performing high-risk 
                construction work must prepare Safe Work Method Statements (SWMS) before commencing work.
              </p>

              {/* Part D */}
              <h2 id="part-d" className="font-heading text-2xl font-bold text-foreground border-b pb-2 mt-12">
                PART D: AML/CTF
              </h2>

              <h3 id="aml" className="font-heading text-xl font-semibold text-foreground mt-8">
                19. AML/CTF Compliance
              </h3>
              
              <p>
                Users must not use the Platform for money laundering, terrorism financing, or other financial crimes. ConstructMarket 
                may require identification documents to comply with the Anti-Money Laundering and Counter-Terrorism Financing Act 2006 (Cth) 
                and may report suspicious activities to AUSTRAC.
              </p>

              {/* Contact */}
              <div className="bg-muted/50 rounded-lg p-6 mt-12">
                <h3 className="font-heading text-xl font-semibold text-foreground mb-4">Contact Information</h3>
                <p className="mb-2"><strong>ConstructMarket Pty Ltd</strong></p>
                <p className="mb-1">Email: support@constructmarket.com.au</p>
                <p className="mb-1">Legal: legal@constructmarket.com.au</p>
                <p>Website: www.constructmarket.com.au</p>
              </div>

              <div className="text-center text-muted-foreground text-sm mt-12 pt-8 border-t">
                <p>© 2026 ConstructMarket Pty Ltd. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all z-50"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30 no-print">
        <div className="container-fluid">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-heading font-bold">ConstructMarket</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/terms" className="text-primary font-medium">Terms & Conditions</Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link>
              <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
