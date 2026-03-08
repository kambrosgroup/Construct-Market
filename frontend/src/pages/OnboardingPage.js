import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Building2, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: 'builder',
    company_name: '',
    company_type: 'builder',
    abn: '',
    company_phone: '',
    address_line_1: '',
    city: '',
    state: '',
    postcode: '',
    phone: '',
    position_title: ''
  });

  const handleNext = (e) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/auth/complete-onboarding`, formData, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      await checkAuth();
      toast.success('Onboarding completed!');
      
      if (formData.role === 'builder') navigate('/builder');
      else if (formData.role === 'provider') navigate('/provider');
      else navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" strokeWidth={1.5} />
          <span className="font-heading text-2xl font-bold text-foreground">ConstructMarket</span>
        </div>
      </div>

      {/* Onboarding Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="font-heading text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>
              {step === 1 && 'Choose your role on ConstructMarket'}
              {step === 2 && 'Tell us about your company'}
            </CardDescription>
            <div className="flex gap-2 pt-2">
              {[1, 2].map((s) => (
                <div 
                  key={s} 
                  className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-slate-200'}`}
                />
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <form onSubmit={handleNext} className="space-y-6">
                <div className="space-y-4">
                  <Label>I am a...</Label>
                  <RadioGroup
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value, company_type: value })}
                  >
                    <div className="flex items-start space-x-3 p-4 border rounded-sm hover:border-primary cursor-pointer">
                      <RadioGroupItem value="builder" id="builder" data-testid="onboard-role-builder" />
                      <Label htmlFor="builder" className="cursor-pointer flex-1">
                        <span className="font-semibold">Builder</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          I need to hire trade providers and subcontractors for my construction projects
                        </p>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-sm hover:border-primary cursor-pointer">
                      <RadioGroupItem value="provider" id="provider" data-testid="onboard-role-provider" />
                      <Label htmlFor="provider" className="cursor-pointer flex-1">
                        <span className="font-semibold">Trade Provider</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          I offer trade services (plumbing, electrical, concrete, etc.) and want to find work
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full gap-2" data-testid="onboard-next-btn">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company_name"
                      placeholder="Your Company Pty Ltd"
                      className="pl-10"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                      data-testid="onboard-company-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="abn">ABN</Label>
                  <Input
                    id="abn"
                    placeholder="12 345 678 901"
                    value={formData.abn}
                    onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                    data-testid="onboard-abn"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Melbourne"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      data-testid="onboard-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="VIC"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      data-testid="onboard-state"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position_title">Your Position</Label>
                  <Input
                    id="position_title"
                    placeholder="Project Manager"
                    value={formData.position_title}
                    onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                    data-testid="onboard-position"
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 gap-2" disabled={loading} data-testid="onboard-submit-btn">
                    {loading ? 'Setting up...' : 'Complete Setup'}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
