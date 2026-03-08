import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Title, description, category' },
  { id: 2, title: 'Location', description: 'Project location details' },
  { id: 3, title: 'Budget', description: 'Set your budget range' },
  { id: 4, title: 'Timeline', description: 'Schedule and deadlines' },
  { id: 5, title: 'Requirements', description: 'Additional details' }
];

export default function BuilderTaskCreate() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    scope: '',
    budget_min: '',
    budget_max: '',
    budget_fixed: '',
    location_address: '',
    location_city: '',
    location_state: '',
    location_postcode: '',
    scheduled_start_date: null,
    scheduled_end_date: null,
    preferred_timeline: 'flexible',
    bid_deadline: null,
    required_qualifications: '',
    estimated_team_size: '',
    equipment_needed: ''
  });

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.title || !formData.description || !formData.category) {
        toast.error('Please fill in all required fields');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSaveDraft = async () => {
    await saveTask('draft');
  };

  const handlePublish = async () => {
    await saveTask('posted');
  };

  const saveTask = async (status) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        ...formData,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        budget_fixed: formData.budget_fixed ? parseFloat(formData.budget_fixed) : null,
        estimated_team_size: formData.estimated_team_size ? parseInt(formData.estimated_team_size) : null,
        scheduled_start_date: formData.scheduled_start_date ? format(formData.scheduled_start_date, 'yyyy-MM-dd') : null,
        scheduled_end_date: formData.scheduled_end_date ? format(formData.scheduled_end_date, 'yyyy-MM-dd') : null,
        bid_deadline: formData.bid_deadline ? format(formData.bid_deadline, 'yyyy-MM-dd') : null
      };

      const response = await axios.post(`${API}/tasks`, payload, { 
        withCredentials: true, 
        headers 
      });

      if (status === 'posted') {
        await axios.put(`${API}/tasks/${response.data.task_id}`, { status: 'posted' }, { 
          withCredentials: true, 
          headers 
        });
        toast.success('Task published successfully!');
      } else {
        toast.success('Task saved as draft');
      }

      navigate('/builder/tasks');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create Task">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep > step.id ? 'bg-primary text-white' : 
                    currentStep === step.id ? 'bg-primary text-white' : 
                    'bg-slate-200 text-slate-600'}
                `}>
                  {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className={`ml-2 text-sm hidden sm:inline ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? 'bg-primary' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <Card className="border">
          <CardHeader>
            <CardTitle className="font-heading text-xl">
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Concrete pour 150m² residential slab"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    data-testid="task-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(v) => handleInputChange('category', v)}>
                    <SelectTrigger data-testid="task-category-select">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concrete">Concrete</SelectItem>
                      <SelectItem value="framing">Framing</SelectItem>
                      <SelectItem value="roofing">Roofing</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="painting">Painting</SelectItem>
                      <SelectItem value="excavation">Excavation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the work required in detail..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    data-testid="task-description-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scope">Scope of Work</Label>
                  <Textarea
                    id="scope"
                    placeholder="Detailed scope and specifications..."
                    rows={3}
                    value={formData.scope}
                    onChange={(e) => handleInputChange('scope', e.target.value)}
                    data-testid="task-scope-input"
                  />
                </div>
              </>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="location_address">Street Address</Label>
                  <Input
                    id="location_address"
                    placeholder="123 Builder Street"
                    value={formData.location_address}
                    onChange={(e) => handleInputChange('location_address', e.target.value)}
                    data-testid="task-address-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_city">City</Label>
                    <Input
                      id="location_city"
                      placeholder="Melbourne"
                      value={formData.location_city}
                      onChange={(e) => handleInputChange('location_city', e.target.value)}
                      data-testid="task-city-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location_state">State</Label>
                    <Select value={formData.location_state} onValueChange={(v) => handleInputChange('location_state', v)}>
                      <SelectTrigger data-testid="task-state-select">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIC">Victoria</SelectItem>
                        <SelectItem value="NSW">New South Wales</SelectItem>
                        <SelectItem value="QLD">Queensland</SelectItem>
                        <SelectItem value="WA">Western Australia</SelectItem>
                        <SelectItem value="SA">South Australia</SelectItem>
                        <SelectItem value="TAS">Tasmania</SelectItem>
                        <SelectItem value="NT">Northern Territory</SelectItem>
                        <SelectItem value="ACT">ACT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location_postcode">Postcode</Label>
                  <Input
                    id="location_postcode"
                    placeholder="3000"
                    value={formData.location_postcode}
                    onChange={(e) => handleInputChange('location_postcode', e.target.value)}
                    className="w-32"
                    data-testid="task-postcode-input"
                  />
                </div>
              </>
            )}

            {/* Step 3: Budget */}
            {currentStep === 3 && (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Set either a fixed budget or a budget range for providers to bid within.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="budget_fixed">Fixed Budget (AUD)</Label>
                  <Input
                    id="budget_fixed"
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.budget_fixed}
                    onChange={(e) => handleInputChange('budget_fixed', e.target.value)}
                    data-testid="task-budget-fixed-input"
                  />
                </div>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or set a range</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget_min">Minimum (AUD)</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      placeholder="e.g., 3000"
                      value={formData.budget_min}
                      onChange={(e) => handleInputChange('budget_min', e.target.value)}
                      data-testid="task-budget-min-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget_max">Maximum (AUD)</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      placeholder="e.g., 8000"
                      value={formData.budget_max}
                      onChange={(e) => handleInputChange('budget_max', e.target.value)}
                      data-testid="task-budget-max-input"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Timeline */}
            {currentStep === 4 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preferred Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="task-start-date-btn">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.scheduled_start_date ? format(formData.scheduled_start_date, 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.scheduled_start_date}
                          onSelect={(date) => handleInputChange('scheduled_start_date', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Expected End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="task-end-date-btn">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.scheduled_end_date ? format(formData.scheduled_end_date, 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.scheduled_end_date}
                          onSelect={(date) => handleInputChange('scheduled_end_date', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Timeline Preference</Label>
                  <Select value={formData.preferred_timeline} onValueChange={(v) => handleInputChange('preferred_timeline', v)}>
                    <SelectTrigger data-testid="task-timeline-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent (ASAP)</SelectItem>
                      <SelectItem value="week_1">Within 1 week</SelectItem>
                      <SelectItem value="week_2">Within 2 weeks</SelectItem>
                      <SelectItem value="month_1">Within 1 month</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bid Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="task-bid-deadline-btn">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.bid_deadline ? format(formData.bid_deadline, 'PPP') : 'Select deadline'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.bid_deadline}
                        onSelect={(date) => handleInputChange('bid_deadline', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {/* Step 5: Requirements */}
            {currentStep === 5 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="required_qualifications">Required Qualifications</Label>
                  <Textarea
                    id="required_qualifications"
                    placeholder="e.g., Current electrical licence, White card, 5+ years experience..."
                    rows={3}
                    value={formData.required_qualifications}
                    onChange={(e) => handleInputChange('required_qualifications', e.target.value)}
                    data-testid="task-qualifications-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_team_size">Estimated Team Size</Label>
                  <Input
                    id="estimated_team_size"
                    type="number"
                    placeholder="e.g., 3"
                    value={formData.estimated_team_size}
                    onChange={(e) => handleInputChange('estimated_team_size', e.target.value)}
                    className="w-32"
                    data-testid="task-team-size-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment_needed">Equipment Needed</Label>
                  <Textarea
                    id="equipment_needed"
                    placeholder="List any specific equipment or tools required..."
                    rows={2}
                    value={formData.equipment_needed}
                    onChange={(e) => handleInputChange('equipment_needed', e.target.value)}
                    data-testid="task-equipment-input"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={currentStep === 1 ? () => navigate('/builder/tasks') : handleBack}
            className="gap-2"
            data-testid="task-back-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          <div className="flex gap-2">
            {currentStep === 5 && (
              <Button 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={loading}
                data-testid="task-save-draft-btn"
              >
                Save as Draft
              </Button>
            )}
            {currentStep < 5 ? (
              <Button onClick={handleNext} className="gap-2" data-testid="task-next-btn">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handlePublish} 
                disabled={loading}
                className="gap-2 bg-accent hover:bg-accent/90"
                data-testid="task-publish-btn"
              >
                {loading ? 'Publishing...' : 'Publish Task'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
