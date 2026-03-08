import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Search, MapPin, Calendar, Users } from 'lucide-react';
import axios from 'axios';

export default function BuilderTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [filters.status, filters.category]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      
      const response = await axios.get(`${API}/tasks?${params.toString()}`, { 
        withCredentials: true, 
        headers 
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return task.title.toLowerCase().includes(search) || 
             task.description?.toLowerCase().includes(search) ||
             task.location_city?.toLowerCase().includes(search);
    }
    return true;
  });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      posted: 'bg-blue-100 text-blue-700',
      bidding_open: 'bg-blue-100 text-blue-700',
      bidding_closed: 'bg-slate-100 text-slate-700',
      awarded: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-amber-100 text-amber-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const formatBudget = (task) => {
    if (task.budget_fixed) return `$${task.budget_fixed.toLocaleString()}`;
    if (task.budget_min && task.budget_max) {
      return `$${task.budget_min.toLocaleString()} - $${task.budget_max.toLocaleString()}`;
    }
    if (task.budget_min) return `From $${task.budget_min.toLocaleString()}`;
    if (task.budget_max) return `Up to $${task.budget_max.toLocaleString()}`;
    return 'Budget not set';
  };

  return (
    <DashboardLayout title="Tasks">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Your Tasks</h2>
            <p className="text-muted-foreground">Manage your project tasks and bids</p>
          </div>
          <Link to="/builder/tasks/create">
            <Button className="gap-2" data-testid="create-task-btn">
              <Plus className="h-4 w-4" />
              Post New Task
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              data-testid="search-tasks-input"
            />
          </div>
          <Select value={filters.status || "all"} onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="awarded">Awarded</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.category || "all"} onValueChange={(v) => setFilters({ ...filters, category: v === "all" ? "" : v })}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
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

        {/* Tasks list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No tasks found</p>
              <Link to="/builder/tasks/create">
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create your first task
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <Link key={task.task_id} to={`/builder/tasks/${task.task_id}`}>
                <Card className="border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-lg font-semibold text-foreground truncate">
                            {task.title}
                          </h3>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                          {task.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="capitalize px-2 py-0.5 bg-slate-100 rounded-sm">
                            {task.category?.replace('_', ' ')}
                          </span>
                          {task.location_city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {task.location_city}, {task.location_state}
                            </span>
                          )}
                          {task.scheduled_start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(task.scheduled_start_date).toLocaleDateString()}
                            </span>
                          )}
                          {task.bid_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {task.bid_count} bids
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-heading text-lg font-bold text-primary">
                          {formatBudget(task)}
                        </p>
                        <p className="text-sm text-muted-foreground">Budget</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
