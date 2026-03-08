import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { ArrowLeft, Calendar, Clock, User, Plus, Hammer, CloudSun, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function ProviderWorkOrderDetail() {
  const { workOrderId } = useParams();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState(null);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [diaryDialogOpen, setDiaryDialogOpen] = useState(false);
  const [submittingDiary, setSubmittingDiary] = useState(false);
  const [diaryForm, setDiaryForm] = useState({
    description: '',
    hours_worked: '',
    team_members: '',
    equipment_used: '',
    weather_conditions: '',
    safety_incidents: false,
    safety_notes: ''
  });

  useEffect(() => {
    fetchWorkOrder();
  }, [workOrderId]);

  const fetchWorkOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [woRes, diaryRes] = await Promise.all([
        axios.get(`${API}/work-orders/${workOrderId}`, { withCredentials: true, headers }),
        axios.get(`${API}/work-orders/${workOrderId}/diary`, { withCredentials: true, headers })
      ]);
      
      setWorkOrder(woRes.data);
      setDiaryEntries(diaryRes.data);
    } catch (error) {
      console.error('Failed to fetch work order:', error);
      toast.error('Failed to load work order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.put(`${API}/work-orders/${workOrderId}`, { status: newStatus }, { withCredentials: true, headers });
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
      fetchWorkOrder();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitDiaryEntry = async () => {
    if (!diaryForm.description || !diaryForm.hours_worked || !diaryForm.team_members) {
      toast.error('Please fill in required fields');
      return;
    }

    setSubmittingDiary(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const entryData = {
        work_order_id: workOrderId,
        description: diaryForm.description,
        hours_worked: parseFloat(diaryForm.hours_worked),
        team_members: parseInt(diaryForm.team_members),
        equipment_used: diaryForm.equipment_used || null,
        weather_conditions: diaryForm.weather_conditions || null,
        safety_incidents: diaryForm.safety_incidents,
        safety_notes: diaryForm.safety_notes || null
      };

      await axios.post(`${API}/work-orders/${workOrderId}/diary`, entryData, { withCredentials: true, headers });
      
      toast.success('Diary entry added');
      setDiaryDialogOpen(false);
      setDiaryForm({
        description: '',
        hours_worked: '',
        team_members: '',
        equipment_used: '',
        weather_conditions: '',
        safety_incidents: false,
        safety_notes: ''
      });
      fetchWorkOrder();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add diary entry');
    } finally {
      setSubmittingDiary(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-700',
      started: 'bg-amber-100 text-amber-700',
      in_progress: 'bg-amber-100 text-amber-700',
      paused: 'bg-slate-100 text-slate-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <DashboardLayout title="Work Order Details">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!workOrder) {
    return (
      <DashboardLayout title="Work Order Details">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Work order not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Work Order Details">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/provider/work-orders')} className="mb-2 -ml-2 gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Work Orders
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-2xl font-bold text-foreground">{workOrder.number}</h2>
              <Badge className={getStatusColor(workOrder.status)}>{workOrder.status?.replace('_', ' ')}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {workOrder.status === 'scheduled' && (
              <Button onClick={() => handleUpdateStatus('started')} disabled={updating} data-testid="start-work-btn">
                Start Work
              </Button>
            )}
            {workOrder.status === 'started' && (
              <Button onClick={() => handleUpdateStatus('in_progress')} disabled={updating}>
                Mark In Progress
              </Button>
            )}
            {['started', 'in_progress'].includes(workOrder.status) && (
              <Button onClick={() => handleUpdateStatus('completed')} disabled={updating} className="bg-green-600 hover:bg-green-700" data-testid="complete-work-btn">
                Mark Complete
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Work Diary */}
            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg">Site Diary</CardTitle>
                {['started', 'in_progress'].includes(workOrder.status) && (
                  <Button onClick={() => setDiaryDialogOpen(true)} size="sm" className="gap-1" data-testid="add-diary-entry-btn">
                    <Plus className="h-4 w-4" /> Add Entry
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {diaryEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <Hammer className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No diary entries yet</p>
                    <p className="text-sm text-muted-foreground">Start logging your work progress</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {diaryEntries.map((entry) => (
                      <div key={entry.entry_id} className="border rounded-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{new Date(entry.entry_date).toLocaleDateString()}</span>
                          <span className="text-sm text-muted-foreground">by {entry.recorder_name}</span>
                        </div>
                        <p className="text-foreground mb-3">{entry.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {entry.hours_worked} hours
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {entry.team_members} workers
                          </span>
                          {entry.weather_conditions && (
                            <span className="flex items-center gap-1">
                              <CloudSun className="h-4 w-4" />
                              {entry.weather_conditions}
                            </span>
                          )}
                          {entry.safety_incidents && (
                            <span className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-4 w-4" />
                              Safety incident reported
                            </span>
                          )}
                        </div>
                        {entry.equipment_used && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Equipment:</strong> {entry.equipment_used}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled Start</p>
                    <p className="font-medium">{new Date(workOrder.scheduled_start_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled End</p>
                    <p className="font-medium">{new Date(workOrder.scheduled_end_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {workOrder.actual_start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Actual Start</p>
                      <p className="font-medium">{new Date(workOrder.actual_start_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {workOrder.actual_end_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Actual End</p>
                      <p className="font-medium">{new Date(workOrder.actual_end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {(workOrder.site_foreman_name || workOrder.site_foreman_phone) && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Site Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  {workOrder.site_foreman_name && <p className="font-medium">{workOrder.site_foreman_name}</p>}
                  {workOrder.site_foreman_phone && <p className="text-muted-foreground">{workOrder.site_foreman_phone}</p>}
                </CardContent>
              </Card>
            )}

            {workOrder.notes && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{workOrder.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add Diary Entry Dialog */}
      <Dialog open={diaryDialogOpen} onOpenChange={setDiaryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Diary Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="description">Work Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the work completed today..."
                rows={3}
                value={diaryForm.description}
                onChange={(e) => setDiaryForm({ ...diaryForm, description: e.target.value })}
                data-testid="diary-description-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hours_worked">Hours Worked *</Label>
                <Input
                  id="hours_worked"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 8"
                  value={diaryForm.hours_worked}
                  onChange={(e) => setDiaryForm({ ...diaryForm, hours_worked: e.target.value })}
                  data-testid="diary-hours-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_members">Team Members *</Label>
                <Input
                  id="team_members"
                  type="number"
                  placeholder="e.g., 3"
                  value={diaryForm.team_members}
                  onChange={(e) => setDiaryForm({ ...diaryForm, team_members: e.target.value })}
                  data-testid="diary-team-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment_used">Equipment Used</Label>
              <Input
                id="equipment_used"
                placeholder="e.g., Excavator, concrete mixer..."
                value={diaryForm.equipment_used}
                onChange={(e) => setDiaryForm({ ...diaryForm, equipment_used: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weather_conditions">Weather Conditions</Label>
              <Select value={diaryForm.weather_conditions} onValueChange={(v) => setDiaryForm({ ...diaryForm, weather_conditions: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select weather" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sunny">Sunny</SelectItem>
                  <SelectItem value="Partly Cloudy">Partly Cloudy</SelectItem>
                  <SelectItem value="Cloudy">Cloudy</SelectItem>
                  <SelectItem value="Rain">Rain</SelectItem>
                  <SelectItem value="Heavy Rain">Heavy Rain</SelectItem>
                  <SelectItem value="Windy">Windy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-sm">
              <div>
                <Label htmlFor="safety_incidents">Safety Incident?</Label>
                <p className="text-sm text-muted-foreground">Report any safety issues</p>
              </div>
              <Switch
                id="safety_incidents"
                checked={diaryForm.safety_incidents}
                onCheckedChange={(checked) => setDiaryForm({ ...diaryForm, safety_incidents: checked })}
              />
            </div>
            {diaryForm.safety_incidents && (
              <div className="space-y-2">
                <Label htmlFor="safety_notes">Safety Notes</Label>
                <Textarea
                  id="safety_notes"
                  placeholder="Describe the safety incident..."
                  rows={2}
                  value={diaryForm.safety_notes}
                  onChange={(e) => setDiaryForm({ ...diaryForm, safety_notes: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiaryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitDiaryEntry} disabled={submittingDiary} data-testid="submit-diary-btn">
              {submittingDiary ? 'Saving...' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
