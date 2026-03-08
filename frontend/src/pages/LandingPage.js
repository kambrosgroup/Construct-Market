import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Building2, Users, Shield, ArrowRight, CheckCircle, Star, Clock, DollarSign } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
              <span className="font-heading text-2xl font-bold text-foreground">ConstructMarket</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/marketplace">
                <Button variant="ghost" data-testid="nav-marketplace-btn">Marketplace</Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" data-testid="nav-login-btn">Log In</Button>
              </Link>
              <Link to="/signup">
                <Button data-testid="nav-signup-btn">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <p className="text-overline text-primary text-sm mb-4">CONSTRUCTION PROCUREMENT PLATFORM</p>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Connect. Build. <span className="text-primary">Deliver.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl">
                Australia's trusted marketplace connecting builders with verified trade providers. 
                Post tasks, receive competitive bids, manage contracts, and pay securely—all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button size="lg" className="w-full sm:w-auto gap-2" data-testid="hero-get-started-btn">
                    Start Building <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/signup?role=provider">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="hero-join-provider-btn">
                    Join as Provider
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-in">
              <img 
                src="https://images.unsplash.com/photo-1644657711115-ee46e8dd7c7d?w=800&q=80" 
                alt="Construction site manager" 
                className="rounded-sm shadow-xl border border-border"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-sm shadow-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-sm flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">2,500+</p>
                    <p className="text-sm text-muted-foreground">Projects Completed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-overline text-primary text-sm mb-4">HOW IT WORKS</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
              Simple. Transparent. Efficient.
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Post Your Task', desc: 'Describe your project, set budget and timeline' },
              { step: '02', title: 'Receive Bids', desc: 'Get competitive quotes from verified providers' },
              { step: '03', title: 'Select & Contract', desc: 'Choose the best bid and sign digitally' },
              { step: '04', title: 'Track & Pay', desc: 'Monitor progress and release payments securely' }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-6xl font-heading font-bold text-slate-100 absolute -top-4 -left-2">{item.step}</div>
                <div className="relative pt-8">
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-overline text-primary text-sm mb-4">FOR BUILDERS</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Find the Right Trade for Every Job
              </h2>
              <div className="space-y-4">
                {[
                  { icon: Users, text: 'Access verified and licensed providers' },
                  { icon: Star, text: 'Compare ratings, reviews, and past work' },
                  { icon: Clock, text: 'Fast turnaround with competitive bidding' },
                  { icon: Shield, text: 'Secure payments held in escrow' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-sm flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-overline text-primary text-sm mb-4">FOR PROVIDERS</p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Grow Your Business with Quality Leads
              </h2>
              <div className="space-y-4">
                {[
                  { icon: Building2, text: 'Connect with builders looking for your trade' },
                  { icon: DollarSign, text: 'Get paid on time with secure payments' },
                  { icon: Star, text: 'Build your reputation with verified reviews' },
                  { icon: CheckCircle, text: 'Manage work orders and site diaries' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-accent/10 rounded-sm flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: '$50M+', label: 'Transaction Volume' },
              { value: '5,000+', label: 'Registered Providers' },
              { value: '2,500+', label: 'Completed Projects' },
              { value: '4.8/5', label: 'Average Rating' }
            ].map((stat, idx) => (
              <div key={idx}>
                <p className="font-heading text-4xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-primary-foreground/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trade Categories */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-overline text-primary text-sm mb-4">TRADE CATEGORIES</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
              All Trades Covered
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Concrete', 'Framing', 'Roofing', 'Plumbing',
              'Electrical', 'Painting', 'Excavation', 'And More...'
            ].map((trade, idx) => (
              <Card key={idx} className="border hover:border-primary hover:shadow-md transition-all duration-200">
                <CardContent className="p-6 text-center">
                  <p className="font-heading text-lg font-semibold text-foreground">{trade}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Construction Procurement?
          </h2>
          <p className="text-slate-300 mb-8 text-lg">
            Join thousands of builders and providers already using ConstructMarket to streamline their projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white w-full sm:w-auto" data-testid="cta-signup-btn">
                Create Free Account
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-slate-900 w-full sm:w-auto" data-testid="cta-login-btn">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" strokeWidth={1.5} />
                <span className="font-heading text-xl font-bold text-white">ConstructMarket</span>
              </div>
              <p className="text-slate-400 text-sm">
                Australia's leading B2B construction procurement marketplace.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
                <li><Link to="/signup?role=builder" className="hover:text-white transition-colors">For Builders</Link></li>
                <li><Link to="/signup?role=provider" className="hover:text-white transition-colors">For Providers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><a href="mailto:legal@constructmarket.com.au" className="hover:text-white transition-colors">Legal Inquiries</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              © 2026 ConstructMarket Pty Ltd. All rights reserved. ABN: [To Be Inserted]
            </p>
            <p className="text-slate-500 text-xs">
              Proudly Australian owned and operated
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
