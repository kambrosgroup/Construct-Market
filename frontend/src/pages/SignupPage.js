import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Building2, Mail, Lock, User, Phone, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: searchParams.get('role') || 'builder',
    company_name: '',
    company_type: searchParams.get('role') || 'builder',
    abn: ''
  });

  const handleGoogleSignup = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await signup(formData);
      toast.success('Account created successfully!');
      if (data.role === 'builder') navigate('/builder');
      else if (data.role === 'provider') navigate('/provider');
      else navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <Building2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
          <span className="font-heading text-2xl font-bold text-foreground">ConstructMarket</span>
        </Link>
      </div>

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="font-heading text-2xl">Create Account</CardTitle>
            <CardDescription>
              {step === 1 && 'Enter your details to get started'}
              {step === 2 && 'Choose your role'}
              {step === 3 && 'Company information'}
            </CardDescription>
            {/* Progress indicator */}
            <div className="flex gap-2 pt-2">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-slate-200'}`}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <Button 
                  variant="outline" 
                  className="w-full gap-2" 
                  onClick={handleGoogleSignup}
                  data-testid="google-signup-btn"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleNext} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="first_name"
                          placeholder="John"
                          className="pl-10"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          required
                          data-testid="first-name-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        placeholder="Smith"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        required
                        data-testid="last-name-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        data-testid="email-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0400 000 000"
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        data-testid="phone-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min. 6 characters"
                        className="pl-10"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        data-testid="password-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        data-testid="confirm-password-input"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2" data-testid="next-step-btn">
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}

            {step === 2 && (
              <form onSubmit={handleNext} className="space-y-6">
                <div className="space-y-4">
                  <Label>I am a...</Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value, company_type: value })}
                  >
                    <div className="flex items-start space-x-3 p-4 border rounded-sm hover:border-primary cursor-pointer">
                      <RadioGroupItem value="builder" id="builder" data-testid="role-builder" />
                      <Label htmlFor="builder" className="cursor-pointer flex-1">
                        <span className="font-semibold">Builder</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          I need to hire trade providers and subcontractors for my construction projects
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-sm hover:border-primary cursor-pointer">
                      <RadioGroupItem value="provider" id="provider" data-testid="role-provider" />
                      <Label htmlFor="provider" className="cursor-pointer flex-1">
                        <span className="font-semibold">Trade Provider</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          I offer trade services (plumbing, electrical, concrete, etc.) and want to find work
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 gap-2" data-testid="next-step-2-btn">
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company_name"
                      placeholder="Your Company Pty Ltd"
                      className="pl-10"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                      data-testid="company-name-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abn">ABN (Optional)</Label>
                  <Input
                    id="abn"
                    placeholder="12 345 678 901"
                    value={formData.abn}
                    onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                    data-testid="abn-input"
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 gap-2" disabled={loading} data-testid="signup-submit-btn">
                    {loading ? 'Creating...' : 'Create Account'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium" data-testid="login-link">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
