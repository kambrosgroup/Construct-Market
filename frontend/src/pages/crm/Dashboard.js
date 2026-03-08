import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { 
  Users, Building2, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  Activity, Target, Calendar, Clock, FileText, CheckCircle, AlertTriangle
} from 'lucide-react';
import axios from 'axios';

export default function CRMDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/crm/dashboard`, { withCredentials: true, headers });
      setMetrics(response.data.metrics);
      setRecentActivity(response.data.recent_activity || []);
    } catch (error) {
      console.error('Failed to fetch CRM metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount);
  };

  const formatChange = (current, previous) => {
    if (!previous) return { value: 0, positive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change).toFixed(1), positive: change >= 0 };
  };

  if (loading) {
    return (
      <DashboardLayout title="CRM Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="CRM Dashboard" isCRM>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Business Overview</h2>
            <p className="text-muted-foreground">Track your platform metrics and customer lifecycle</p>
          </div>
          <div className="flex gap-2">
            <Link to="/crm/reports">
              <Button variant="outline" className="gap-2">
                <FileText className="h-4 w-4" />
                View Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">Total Revenue</p>
                  <p className="stat-value text-primary">
                    {formatCurrency(metrics?.total_revenue || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    {formatChange(metrics?.total_revenue, metrics?.prev_revenue).positive ? (
                      <>
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">+{formatChange(metrics?.total_revenue, metrics?.prev_revenue).value}%</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                        <span className="text-red-500">-{formatChange(metrics?.total_revenue, metrics?.prev_revenue).value}%</span>
                      </>
                    )}
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">Active Customers</p>
                  <p className="stat-value">{metrics?.active_customers || 0}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {metrics?.new_customers_this_month || 0} new this month
                  </p>
                </div>
                <Users className="h-8 w-8 text-accent/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">Active Projects</p>
                  <p className="stat-value">{metrics?.active_projects || 0}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {metrics?.completed_projects || 0} completed
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="stat-label">GMV (Gross)</p>
                  <p className="stat-value">{formatCurrency(metrics?.gmv || 0)}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Platform total
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Builders</p>
                    <p className="text-2xl font-heading font-bold">{metrics?.total_builders || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Providers</p>
                    <p className="text-2xl font-heading font-bold">{metrics?.total_providers || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contracts</p>
                    <p className="text-2xl font-heading font-bold">{metrics?.total_contracts || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Activity className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Conversion Rate</p>
                    <p className="text-2xl font-heading font-bold">{metrics?.conversion_rate || 0}%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pipeline Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading">Sales Pipeline</CardTitle>
                <Link to="/crm/pipeline">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="font-medium">New Leads</span>
                  </div>
                  <span className="font-heading font-bold">{metrics?.pipeline?.leads || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="font-medium">In Progress</span>
                  </div>
                  <span className="font-heading font-bold">{metrics?.pipeline?.in_progress || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-medium">Won</span>
                  </div>
                  <span className="font-heading font-bold">{metrics?.pipeline?.won || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="font-medium">Lost</span>
                  </div>
                  <span className="font-heading font-bold">{metrics?.pipeline?.lost || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'signup' ? 'bg-green-100' :
                        activity.type === 'contract' ? 'bg-blue-100' :
                        activity.type === 'payment' ? 'bg-primary/10' :
                        'bg-muted'
                      }`}>
                        {activity.type === 'signup' ? <Users className="h-4 w-4 text-green-600" /> :
                         activity.type === 'contract' ? <FileText className="h-4 w-4 text-blue-600" /> :
                         activity.type === 'payment' ? <DollarSign className="h-4 w-4 text-primary" /> :
                         <Activity className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {metrics?.alerts && metrics.alerts.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Attention Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm">{alert.message}</span>
                    <Button variant="outline" size="sm">Take Action</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
