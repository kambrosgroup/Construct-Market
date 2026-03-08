import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Search, MapPin, Calendar, DollarSign, Users, Clock } from 'lucide-react';
import axios from 'axios';

export default function ProviderTaskFeed() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    city: '',
    search: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [filters.category, filters.city]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.city) params.append('city', filters.city);
      
      const response = await axios.get(`${API}/tasks?${params.toString()}`, { 
        withCredentials: true, 
        headers 
      });
      setTasks(response.data.filter(t => ['posted', 'bidding_open'].includes(t.status)));
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

  const formatBudget = (task) => {
    if (task.budget_fixed) return `$${task.budget_fixed.toLocaleString()}`;
    if (task.budget_min && task.budget_max) {
      return `$${task.budget_min.toLocaleString()} - $${task.budget_max.toLocaleString()}`;
    }
    if (task.budget_min) return `From $${task.budget_min.toLocaleString()}`;
    if (task.budget_max) return `Up to $${task.budget_max.toLocaleString()}`;
    return 'Budget TBD';
  };

  const getTimelineLabel = (timeline) => {
    const labels = {
      urgent: 'Urgent',
      week_1: 'Within 1 week',
      week_2: 'Within 2 weeks',
      month_1: 'Within 1 month',
      flexible: 'Flexible'
    };
    return labels[timeline] || timeline;
  };

  return (
    <DashboardLayout title="Task Feed">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Available Tasks</h2>
          <p className="text-muted-foreground">Find projects that match your skills</p>
        </div>

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
          <Input
            placeholder="Filter by city..."
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="w-full sm:w-[180px]"
            data-testid="city-filter"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No tasks found matching your criteria</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <Link key={task.task_id} to={`/provider/tasks/${task.task_id}`}>
                <Card className="border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-lg font-semibold text-foreground truncate">
                            {task.title}
                          </h3>
                          {task.preferred_timeline === 'urgent' && (
                            <Badge className="bg-red-100 text-red-700">Urgent</Badge>
                          )}
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
                          {task.preferred_timeline && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {getTimelineLabel(task.preferred_timeline)}
                            </span>
                          )}
                          {task.bid_deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Deadline: {new Date(task.bid_deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="text-muted-foreground">
                            <Users className="h-4 w-4 inline mr-1" />
                            {task.bid_count || 0} bids
                          </span>
                          <span className="text-muted-foreground">
                            Posted by {task.company_name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right lg:ml-4">
                        <p className="text-2xl font-heading font-bold text-primary">
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
