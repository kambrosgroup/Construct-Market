import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuth, API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Search, ClipboardList, FileText, DollarSign, Star, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    availableTasks: 0,
    activeBids: 0,
    activeContracts: 0,
    pendingPayments: 0,
    averageRating: 0
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
      
      const [tasksRes, bidsRes, contractsRes, paymentsRes, ratingsRes] = await Promise.all([
        axios.get(`${API}/tasks`, { withCredentials: true, headers }),
        axios.get(`${API}/bids`, { withCredentials: true, headers }),
        axios.get(`${API}/contracts`, { withCredentials: true, headers }),
        axios.get(`${API}/payments`, { withCredentials: true, headers }),
        axios.get(`${API}/ratings`, { withCredentials: true, headers })
      ]);

      const tasks = tasksRes.data;
      const bids = bidsRes.data;
      const contracts = contractsRes.data;
      const payments = paymentsRes.data;
      const ratings = ratingsRes.data;

      const availableTasks = tasks.filter(t => ['posted', 'bidding_open'].includes(t.status)).length;
      const activeBids = bids.filter(b => b.status === 'submitted').length;
      const activeContracts = contracts.filter(c => ['fully_executed'].includes(c.status)).length;
      const pendingPayments = payments.filter(p => ['pending', 'escrow_held'].includes(p.status)).length;
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length 
        : 0;

      setStats({ availableTasks, activeBids, activeContracts, pendingPayments, averageRating });
      setRecentTasks(tasks.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Welcome back, {user?.first_name}!
            </h2>
            <p className="text-muted-foreground">Find new opportunities and manage your work.</p>
          </div>
          <Link to="/provider/tasks">
            <Button className="gap-2" data-testid="browse-tasks-btn">
              <Search className="h-4 w-4" />
              Browse Tasks
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Tasks</p>
                  <p className="text-3xl font-heading font-bold text-foreground mt-1">
                    {loading ? '-' : stats.availableTasks}
                  </p>
                </div>
                <Search className="h-8 w-8 text-primary" strokeWidth={1.5} />
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Bids</p>
                  <p className="text-3xl font-heading font-bold text-foreground mt-1">
                    {loading ? '-' : stats.activeBids}
                  </p>
                </div>
                <ClipboardList className="h-8 w-8 text-accent" strokeWidth={1.5} />
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
                <FileText className="h-8 w-8 text-blue-600" strokeWidth={1.5} />
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
                <DollarSign className="h-8 w-8 text-green-600" strokeWidth={1.5} />
              </div>
            </CardContent>
          </Card>

          <Card className="border hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Rating</p>
                  <p className="text-3xl font-heading font-bold text-foreground mt-1">
                    {loading ? '-' : stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                  </p>
                </div>
                <Star className="h-8 w-8 text-amber-400 fill-amber-400" strokeWidth={1.5} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Recent Opportunities</CardTitle>
            <Link to="/provider/tasks">
              <Button variant="ghost" size="sm" className="gap-1" data-testid="view-all-opportunities-btn">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No available tasks at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <Link key={task.task_id} to={`/provider/tasks/${task.task_id}`} className="block">
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
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {task.budget_fixed ? `$${task.budget_fixed.toLocaleString()}` : 
                           task.budget_min && task.budget_max ? `$${task.budget_min.toLocaleString()} - $${task.budget_max.toLocaleString()}` : 
                           'Budget TBD'}
                        </p>
                      </div>
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
