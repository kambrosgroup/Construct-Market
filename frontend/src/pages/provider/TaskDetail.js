import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { MapPin, Calendar as CalendarIcon, DollarSign, Clock, Users, ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';

export default function ProviderTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [myBid, setMyBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bidForm, setBidForm] = useState({
    amount: '',
    description: '',
    timeline_days: '',
    start_date: null,
    team_size: '',
    materials_included: '',
    materials_excluded: '',
    notes: ''
  });

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [taskRes, bidsRes] = await Promise.all([
        axios.get(`${API}/tasks/${taskId}`, { withCredentials: true, headers }),
        axios.get(`${API}/bids`, { withCredentials: true, headers })
      ]);
      
      setTask(taskRes.data);
      
      // Check if provider already bid on this task
      const existingBid = bidsRes.data.find(b => b.task_id === taskId);
      if (existingBid) {
        setMyBid(existingBid);
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async () => {
    if (!bidForm.amount || !bidForm.description || !bidForm.timeline_days) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const bidData = {
        task_id: taskId,
        amount: parseFloat(bidForm.amount),
        description: bidForm.description,
        timeline_days: parseInt(bidForm.timeline_days),
        start_date: bidForm.start_date ? format(bidForm.start_date, 'yyyy-MM-dd') : null,
        team_size: bidForm.team_size ? parseInt(bidForm.team_size) : null,
        materials_included: bidForm.materials_included || null,
        materials_excluded: bidForm.materials_excluded || null,
        notes: bidForm.notes || null
      };

      await axios.post(`${API}/bids`, bidData, { withCredentials: true, headers });
      
      toast.success('Bid submitted successfully!');
      setBidDialogOpen(false);
      fetchTask();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  const formatBudget = (task) => {
    if (!task) return 'N/A';
    if (task.budget_fixed) return `$${task.budget_fixed.toLocaleString()}`;
    if (task.budget_min && task.budget_max) {
      return `$${task.budget_min.toLocaleString()} - $${task.budget_max.toLocaleString()}`;
    }
    return 'Budget not set';
  };

  const getBidStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-700',
      viewed: 'bg-slate-100 text-slate-700',
      selected: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      withdrawn: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <DashboardLayout title="Task Details">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout title="Task Details">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Task not found</p>
          <Link to="/provider/tasks">
            <Button variant="outline" className="mt-4">Back to Task Feed</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Task Details">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/provider/tasks')} className="mb-2 -ml-2 gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Task Feed
            </Button>
            <h2 className="font-heading text-2xl font-bold text-foreground">{task.title}</h2>
            <p className="text-muted-foreground mt-1 capitalize">
              {task.category?.replace('_', ' ')} • Posted by {task.company_name}
            </p>
          </div>
          {!myBid && ['posted', 'bidding_open'].includes(task.status) && (
            <Button onClick={() => setBidDialogOpen(true)} className="gap-2 bg-accent hover:bg-accent/90" data-testid="submit-bid-btn">
              <Send className="h-4 w-4" />
              Submit Bid
            </Button>
          )}
        </div>

        {/* My Bid Card */}
        {myBid && (
          <Card className="border-2 border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                Your Bid
                <Badge className={getBidStatusColor(myBid.status)}>{myBid.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-heading font-bold text-primary">${myBid.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Timeline</p>
                  <p className="font-semibold">{myBid.timeline_days} days</p>
                </div>
                {myBid.start_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Proposed Start</p>
                    <p className="font-semibold">{new Date(myBid.start_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              {myBid.status === 'selected' && (
                <p className="text-green-600 font-semibold mt-4">Congratulations! Your bid was selected.</p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{task.description}</p>
                {task.scope && (
                  <>
                    <h4 className="font-semibold mt-4 mb-2">Scope of Work</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{task.scope}</p>
                  </>
                )}
              </CardContent>
            </Card>

            {(task.required_qualifications || task.equipment_needed) && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {task.required_qualifications && (
                    <div>
                      <h4 className="font-semibold mb-2">Qualifications</h4>
                      <p className="text-muted-foreground">{task.required_qualifications}</p>
                    </div>
                  )}
                  {task.equipment_needed && (
                    <div>
                      <h4 className="font-semibold mb-2">Equipment Needed</h4>
                      <p className="text-muted-foreground">{task.equipment_needed}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-heading font-bold text-primary">{formatBudget(task)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    {task.location_address && <p>{task.location_address}</p>}
                    <p>{task.location_city}, {task.location_state} {task.location_postcode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.scheduled_start_date && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Start: {new Date(task.scheduled_start_date).toLocaleDateString()}</span>
                  </div>
                )}
                {task.bid_deadline && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Bid deadline: {new Date(task.bid_deadline).toLocaleDateString()}</span>
                  </div>
                )}
                {task.estimated_team_size && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Team size: {task.estimated_team_size} workers</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Bid Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Submit Your Bid</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="bid_amount">Bid Amount (AUD) *</Label>
              <Input
                id="bid_amount"
                type="number"
                placeholder="e.g., 5000"
                value={bidForm.amount}
                onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                data-testid="bid-amount-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bid_description">Description / Approach *</Label>
              <Textarea
                id="bid_description"
                placeholder="Describe how you plan to complete this work..."
                rows={3}
                value={bidForm.description}
                onChange={(e) => setBidForm({ ...bidForm, description: e.target.value })}
                data-testid="bid-description-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timeline_days">Timeline (Days) *</Label>
                <Input
                  id="timeline_days"
                  type="number"
                  placeholder="e.g., 14"
                  value={bidForm.timeline_days}
                  onChange={(e) => setBidForm({ ...bidForm, timeline_days: e.target.value })}
                  data-testid="bid-timeline-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_size">Team Size</Label>
                <Input
                  id="team_size"
                  type="number"
                  placeholder="e.g., 3"
                  value={bidForm.team_size}
                  onChange={(e) => setBidForm({ ...bidForm, team_size: e.target.value })}
                  data-testid="bid-team-size-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Proposed Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="bid-start-date-btn">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bidForm.start_date ? format(bidForm.start_date, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={bidForm.start_date}
                    onSelect={(date) => setBidForm({ ...bidForm, start_date: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="materials_included">Materials Included</Label>
              <Textarea
                id="materials_included"
                placeholder="List materials included in your quote..."
                rows={2}
                value={bidForm.materials_included}
                onChange={(e) => setBidForm({ ...bidForm, materials_included: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materials_excluded">Materials Excluded</Label>
              <Textarea
                id="materials_excluded"
                placeholder="List any materials NOT included..."
                rows={2}
                value={bidForm.materials_excluded}
                onChange={(e) => setBidForm({ ...bidForm, materials_excluded: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any other information..."
                rows={2}
                value={bidForm.notes}
                onChange={(e) => setBidForm({ ...bidForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBidDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitBid} disabled={submitting} className="bg-accent hover:bg-accent/90" data-testid="confirm-bid-btn">
              {submitting ? 'Submitting...' : 'Submit Bid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
