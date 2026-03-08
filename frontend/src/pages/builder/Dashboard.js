import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuth, API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  FolderKanban, 
  FileText, 
  CreditCard, 
  Clock, 
  Plus,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';

export default function BuilderDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeTasks: 0,
    openBids: 0,
    activeContracts: 0,
    pendingPayments: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [tasksRes, contractsRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/tasks`, { withCredentials: true, headers }),
        axios.get(`${API}/contracts`, { withCredentials: true, headers }),
        axios.get(`${API}/payments`, { withCredentials: true, headers })
      ]);

      const tasks = tasksRes.data;
      const contracts = contractsRes.data;
      const payments = paymentsRes.data;

      // Calculate stats
      const activeTasks = tasks.filter(t => ['posted', 'bidding_open', 'awarded', 'in_progress'].includes(t.status)).length;
      const openBids = tasks.reduce((sum, t) => sum + (t.bid_count || 0), 0);
      const activeContracts = contracts.filter(c => ['draft', 'sent_for_signature', 'signed_by_builder', 'signed_by_provider', 'fully_executed'].includes(c.status)).length;
      const pendingPayments = payments.filter(p => ['pending', 'escrow_held'].includes(p.status)).length;

      setStats({ activeTasks, openBids, activeContracts, pendingPayments });
      setRecentTasks(tasks.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
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

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Welcome back, {user?.first_name}!
            </h2>
            <p className="text-muted-foreground">
              Here's what's happening with your projects today.
            </p>
          </div>
          <Link to="/builder/tasks/create">
            <Button className="gap-2" data-testid="new-task-btn">
              <Plus className="h-4 w-4" />
              Post New Task
            </Button>
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Tasks</p>
                  <p className="text-3xl font-heading font-bold text-foreground mt-1">
                    {loading ? '-' : stats.activeTasks}
                  </p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-sm flex items-center justify-center">
                  <FolderKanban className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Bids</p>
                  <p className="text-3xl font-heading font-bold text-foreground mt-1">
                    {loading ? '-' : stats.openBids}
                  </p>
                </div>
                <div className="h-12 w-12 bg-accent/10 rounded-sm flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Contracts</p>
                  <p className="text-3xl font-heading font-bold text-foreground mt-1">
                    {loading ? '-' : stats.activeContracts}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-sm flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-3xl font-heading font-bold text-foreground mt-1">
                    {loading ? '-' : stats.pendingPayments}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-sm flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-600" strokeWidth={1.5} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent tasks */}
        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Recent Tasks</CardTitle>
            <Link to="/builder/tasks">
              <Button variant="ghost" size="sm" className="gap-1" data-testid="view-all-tasks-btn">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tasks yet</p>
                <Link to="/builder/tasks/create">
                  <Button variant="outline" className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Create your first task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <Link 
                    key={task.task_id} 
                    to={`/builder/tasks/${task.task_id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 border rounded-sm hover:border-primary hover:shadow-sm transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{task.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="capitalize">{task.category?.replace('_', ' ')}</span>
                          {task.location_city && (
                            <>
                              <span>•</span>
                              <span>{task.location_city}</span>
                            </>
                          )}
                          {task.bid_count > 0 && (
                            <>
                              <span>•</span>
                              <span>{task.bid_count} bids</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
