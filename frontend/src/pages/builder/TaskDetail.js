import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { MapPin, Calendar as CalendarIcon, DollarSign, Clock, Users, Star, Check, X, FileText, ArrowLeft, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';

export default function BuilderTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contractDialog, setContractDialog] = useState({ open: false, bid: null });
  const [contractDates, setContractDates] = useState({ start: null, end: null });
  const [creatingContract, setCreatingContract] = useState(false);

  useEffect(() => {
    fetchTaskAndBids();
  }, [taskId]);

  const fetchTaskAndBids = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [taskRes, bidsRes] = await Promise.all([
        axios.get(`${API}/tasks/${taskId}`, { withCredentials: true, headers }),
        axios.get(`${API}/bids?task_id=${taskId}`, { withCredentials: true, headers })
      ]);
      
      setTask(taskRes.data);
      setBids(bidsRes.data);
    } catch (error) {
      console.error('Failed to fetch task:', error);
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.put(`${API}/tasks/${taskId}`, { status: 'posted' }, { withCredentials: true, headers });
      toast.success('Task published!');
      fetchTaskAndBids();
    } catch (error) {
      toast.error('Failed to publish task');
    }
  };

  const handleSelectBid = (bid) => {
    setContractDialog({ open: true, bid });
    setContractDates({
      start: bid.start_date ? new Date(bid.start_date) : null,
      end: null
    });
  };

  const handleCreateContract = async () => {
    if (!contractDates.start || !contractDates.end) {
      toast.error('Please select start and end dates');
      return;
    }

    setCreatingContract(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // First select the bid
      await axios.put(`${API}/bids/${contractDialog.bid.bid_id}`, 
        { status: 'selected' }, 
        { withCredentials: true, headers }
      );

      // Create contract
      const contractData = {
        task_id: taskId,
        bid_id: contractDialog.bid.bid_id,
        start_date: format(contractDates.start, 'yyyy-MM-dd'),
        end_date: format(contractDates.end, 'yyyy-MM-dd'),
        payment_terms: 'Payment upon completion'
      };

      const response = await axios.post(`${API}/contracts`, contractData, { withCredentials: true, headers });
      
      toast.success('Contract created! Bid selected.');
      setContractDialog({ open: false, bid: null });
      navigate(`/builder/contracts/${response.data.contract_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create contract');
    } finally {
      setCreatingContract(false);
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.put(`${API}/bids/${bidId}`, 
        { status: 'rejected', rejection_reason: 'Not selected' }, 
        { withCredentials: true, headers }
      );
      toast.success('Bid rejected');
      fetchTaskAndBids();
    } catch (error) {
      toast.error('Failed to reject bid');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      posted: 'bg-blue-100 text-blue-700',
      bidding_open: 'bg-blue-100 text-blue-700',
      awarded: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-amber-100 text-amber-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
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

  const formatBudget = (task) => {
    if (!task) return 'N/A';
    if (task.budget_fixed) return `$${task.budget_fixed.toLocaleString()}`;
    if (task.budget_min && task.budget_max) {
      return `$${task.budget_min.toLocaleString()} - $${task.budget_max.toLocaleString()}`;
    }
    return 'Budget not set';
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
          <Link to="/builder/tasks">
            <Button variant="outline" className="mt-4">Back to Tasks</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Task Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/builder/tasks')} className="mb-2 -ml-2 gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Tasks
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-2xl font-bold text-foreground">{task.title}</h2>
              <Badge className={getStatusColor(task.status)}>{task.status?.replace('_', ' ')}</Badge>
            </div>
            <p className="text-muted-foreground mt-1 capitalize">
              {task.category?.replace('_', ' ')} • Posted by {task.creator_name || task.company_name}
            </p>
          </div>
          <div className="flex gap-2">
            {task.status === 'draft' && (
              <Button onClick={handlePublishTask} className="bg-accent hover:bg-accent/90" data-testid="publish-task-btn">
                Publish Task
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
            <TabsTrigger value="bids" data-testid="tab-bids">Bids ({bids.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
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
                    {task.scheduled_end_date && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>End: {new Date(task.scheduled_end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {task.bid_deadline && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Bid deadline: {new Date(task.bid_deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    {task.preferred_timeline && (
                      <Badge variant="secondary" className="capitalize">
                        {task.preferred_timeline.replace('_', ' ')}
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Bids received</span>
                      <span className="font-semibold">{task.bid_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-semibold">{task.view_count || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bids" className="space-y-4">
            {bids.length === 0 ? (
              <Card className="border">
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No bids received yet</p>
                  {task.status === 'draft' && (
                    <p className="text-sm text-muted-foreground mt-2">Publish your task to start receiving bids</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <Card key={bid.bid_id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-heading text-lg font-semibold">{bid.provider_company_name}</h3>
                            <Badge className={getBidStatusColor(bid.status)}>{bid.status}</Badge>
                            {bid.provider_rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span>{bid.provider_rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-3">{bid.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {bid.timeline_days} days
                            </span>
                            {bid.team_size && (
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {bid.team_size} workers
                              </span>
                            )}
                            {bid.start_date && (
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                Can start {new Date(bid.start_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {bid.materials_included && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <strong>Materials included:</strong> {bid.materials_included}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-heading font-bold text-primary">${bid.amount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{bid.currency}</p>
                          {bid.status === 'submitted' && task.status !== 'awarded' && (
                            <div className="flex gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleRejectBid(bid.bid_id)}
                                className="gap-1"
                                data-testid={`reject-bid-${bid.bid_id}`}
                              >
                                <X className="h-4 w-4" /> Reject
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleSelectBid(bid)}
                                className="gap-1 bg-accent hover:bg-accent/90"
                                data-testid={`select-bid-${bid.bid_id}`}
                              >
                                <Check className="h-4 w-4" /> Select
                              </Button>
                            </div>
                          )}
                          {bid.status === 'selected' && (
                            <Link to={`/builder/contracts`}>
                              <Button size="sm" className="mt-4 gap-1">
                                <FileText className="h-4 w-4" /> View Contract
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Contract Creation Dialog */}
      <Dialog open={contractDialog.open} onOpenChange={(open) => setContractDialog({ ...contractDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Create Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              You are about to select <strong>{contractDialog.bid?.provider_company_name}</strong>'s bid of <strong>${contractDialog.bid?.amount?.toLocaleString()}</strong>.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {contractDates.start ? format(contractDates.start, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={contractDates.start}
                      onSelect={(date) => setContractDates({ ...contractDates, start: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Contract End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {contractDates.end ? format(contractDates.end, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={contractDates.end}
                      onSelect={(date) => setContractDates({ ...contractDates, end: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractDialog({ open: false, bid: null })}>
              Cancel
            </Button>
            <Button onClick={handleCreateContract} disabled={creatingContract} className="bg-accent hover:bg-accent/90">
              {creatingContract ? 'Creating...' : 'Create Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
