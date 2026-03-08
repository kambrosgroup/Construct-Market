import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../App';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, MapPin, Calendar, DollarSign, Building2, Filter, ArrowRight, Briefcase, Clock, ChevronDown } from 'lucide-react';
import axios from 'axios';

const CATEGORIES = [
  { value: 'concrete', label: 'Concrete', icon: '🏗️' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { value: 'carpentry', label: 'Carpentry', icon: '🪚' },
  { value: 'roofing', label: 'Roofing', icon: '🏠' },
  { value: 'painting', label: 'Painting', icon: '🎨' },
  { value: 'landscaping', label: 'Landscaping', icon: '🌳' },
  { value: 'demolition', label: 'Demolition', icon: '🔨' },
  { value: 'hvac', label: 'HVAC', icon: '❄️' },
  { value: 'flooring', label: 'Flooring', icon: '🪵' },
  { value: 'masonry', label: 'Masonry', icon: '🧱' },
  { value: 'steel_work', label: 'Steel Work', icon: '🔩' },
  { value: 'glazing', label: 'Glazing', icon: '🪟' },
  { value: 'insulation', label: 'Insulation', icon: '🧤' },
  { value: 'other', label: 'Other', icon: '📦' }
];

const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'];

export default function Marketplace() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    state: '',
    search: '',
    budget_min: '',
    budget_max: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({ total: 0, categories: {} });

  useEffect(() => {
    fetchTasks();
  }, [filters.category, filters.state]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.state) params.append('state', filters.state);
      params.append('status', 'posted');
      
      const response = await axios.get(`${API}/marketplace/tasks?${params.toString()}`);
      setTasks(response.data.tasks || []);
      setStats({ total: response.data.total || 0, categories: response.data.categories || {} });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!task.title?.toLowerCase().includes(search) && 
          !task.description?.toLowerCase().includes(search) &&
          !task.location_city?.toLowerCase().includes(search)) {
        return false;
      }
    }
    if (filters.budget_min && task.budget_max < parseFloat(filters.budget_min)) return false;
    if (filters.budget_max && task.budget_min > parseFloat(filters.budget_max)) return false;
    return true;
  });

  const formatBudget = (task) => {
    if (task.budget_fixed) return `$${task.budget_fixed.toLocaleString()}`;
    if (task.budget_min && task.budget_max) {
      return `$${task.budget_min.toLocaleString()} - $${task.budget_max.toLocaleString()}`;
    }
    if (task.budget_min) return `From $${task.budget_min.toLocaleString()}`;
    if (task.budget_max) return `Up to $${task.budget_max.toLocaleString()}`;
    return 'Contact for quote';
  };

  const getCategoryIcon = (cat) => CATEGORIES.find(c => c.value === cat)?.icon || '📦';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="font-heading text-xl font-bold">ConstructMarket</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/marketplace" className="text-sm font-medium text-primary">Marketplace</Link>
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Log In</Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </nav>
            <Link to="/signup" className="md:hidden">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 lg:py-16">
        <div className="container-fluid">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              Construction <span className="text-primary">Marketplace</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Browse {stats.total}+ active projects from verified builders across Australia
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search projects, trades, locations..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button 
                variant="outline" 
                className="h-12 gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Panel */}
      {showFilters && (
        <section className="border-b bg-muted/30 py-4">
          <div className="container-fluid">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v === 'all' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.state} onValueChange={(v) => setFilters({ ...filters, state: v === 'all' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Min Budget"
                value={filters.budget_min}
                onChange={(e) => setFilters({ ...filters, budget_min: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Max Budget"
                value={filters.budget_max}
                onChange={(e) => setFilters({ ...filters, budget_max: e.target.value })}
              />
            </div>
          </div>
        </section>
      )}

      {/* Category Pills */}
      <section className="py-6 border-b">
        <div className="container-fluid">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={!filters.category ? "default" : "outline"}
              size="sm"
              onClick={() => setFilters({ ...filters, category: '' })}
              className="whitespace-nowrap"
            >
              All ({stats.total})
            </Button>
            {CATEGORIES.slice(0, 8).map(cat => (
              <Button
                key={cat.value}
                variant={filters.category === cat.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters({ ...filters, category: cat.value })}
                className="whitespace-nowrap gap-1"
              >
                <span>{cat.icon}</span>
                {cat.label}
                {stats.categories[cat.value] > 0 && (
                  <span className="text-xs opacity-70">({stats.categories[cat.value]})</span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Tasks Grid */}
      <section className="py-8 lg:py-12">
        <div className="container-fluid">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{filteredTasks.length}</span> projects
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-full mb-4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms</p>
              <Button variant="outline" onClick={() => setFilters({ category: '', state: '', search: '', budget_min: '', budget_max: '' })}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map(task => (
                <Link key={task.task_id} to={`/marketplace/${task.task_id}`}>
                  <Card className="h-full card-hover border-2 border-transparent hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="gap-1">
                          <span>{getCategoryIcon(task.category)}</span>
                          {task.category?.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="font-heading text-lg font-semibold text-foreground mb-2 line-clamp-2">
                        {task.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {task.description}
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{task.location_city}, {task.location_state}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium text-foreground">{formatBudget(task)}</span>
                        </div>
                        {task.preferred_timeline && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{task.preferred_timeline.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {task.bid_count || 0} bids
                        </span>
                        <span className="text-sm font-medium text-primary flex items-center gap-1">
                          View Details <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 lg:py-16 bg-primary text-primary-foreground">
        <div className="container-fluid text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Ready to Win More Projects?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of verified trade providers and start bidding on quality projects today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup?role=provider">
              <Button size="lg" variant="secondary" className="gap-2">
                Join as Provider <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/signup?role=builder">
              <Button size="lg" variant="outline" className="bg-transparent border-white/30 hover:bg-white/10">
                Post a Project
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30">
        <div className="container-fluid">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-heading font-bold">ConstructMarket</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 ConstructMarket. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
