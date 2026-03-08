import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Building2, MapPin, Calendar, DollarSign, Clock, Users, FileText, ArrowLeft, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function MarketplaceTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await axios.get(`${API}/marketplace/tasks/${taskId}`);
      setTask(response.data);
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (task) => {
    if (!task) return '';
    if (task.budget_fixed) return `$${task.budget_fixed.toLocaleString()}`;
    if (task.budget_min && task.budget_max) {
      return `$${task.budget_min.toLocaleString()} - $${task.budget_max.toLocaleString()}`;
    }
    if (task.budget_min) return `From $${task.budget_min.toLocaleString()}`;
    if (task.budget_max) return `Up to $${task.budget_max.toLocaleString()}`;
    return 'Contact for quote';
  };

  const getTimelineLabel = (timeline) => {
    const labels = {
      urgent: 'Urgent - ASAP',
      week_1: 'Within 1 week',
      week_2: 'Within 2 weeks',
      month_1: 'Within 1 month',
      month_3: 'Within 3 months',
      flexible: 'Flexible timeline'
    };
    return labels[timeline] || timeline;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-fluid py-16 text-center">
          <h1 className="font-heading text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">This project may have been removed or is no longer available.</p>
          <Link to="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <nav className="flex items-center gap-4">
              <Link to="/marketplace" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Marketplace
              </Link>
              <Link to="/signup?role=provider">
                <Button size="sm">Apply to Bid</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container-fluid py-8">
        {/* Back Button */}
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge variant="outline" className="mb-3">
                {task.category?.replace('_', ' ')}
              </Badge>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
                {task.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {task.location_city}, {task.location_state}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Posted {new Date(task.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {task.bid_count || 0} bids received
                </span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>

            {task.scope && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Scope of Work</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{task.scope}</p>
                </CardContent>
              </Card>
            )}

            {task.required_qualifications && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{task.required_qualifications}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Project Budget</p>
                  <p className="font-heading text-3xl font-bold text-primary">{formatBudget(task)}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Timeline</span>
                    <span className="text-sm font-medium">{getTimelineLabel(task.preferred_timeline)}</span>
                  </div>
                  {task.estimated_team_size && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">Team Size</span>
                      <span className="text-sm font-medium">{task.estimated_team_size} workers</span>
                    </div>
                  )}
                  {task.scheduled_start_date && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">Start Date</span>
                      <span className="text-sm font-medium">{new Date(task.scheduled_start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="text-sm font-medium">{task.location_city}, {task.location_state}</span>
                  </div>
                </div>

                <Link to="/signup?role=provider" className="block">
                  <Button className="w-full gap-2" size="lg">
                    Sign Up to Bid <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Free to join. No fees until you win work.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold mb-4">Why ConstructMarket?</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Verified Builders</p>
                      <p className="text-xs text-muted-foreground">All builders are verified and vetted</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Secure Payments</p>
                      <p className="text-xs text-muted-foreground">Funds held in escrow until work approved</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Digital Contracts</p>
                      <p className="text-xs text-muted-foreground">Professional contracts with e-signatures</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30 mt-16">
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
