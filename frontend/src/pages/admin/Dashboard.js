import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Building2, FolderKanban, FileText, DollarSign, Star, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/admin/analytics`, { withCredentials: true, headers });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-8">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Platform Overview</h2>
          <p className="text-muted-foreground">Monitor and manage ConstructMarket</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-heading font-bold text-foreground mt-1">
                        {analytics?.total_users || 0}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-primary" strokeWidth={1.5} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Companies</p>
                      <p className="text-3xl font-heading font-bold text-foreground mt-1">
                        {analytics?.total_companies || 0}
                      </p>
                    </div>
                    <Building2 className="h-8 w-8 text-accent" strokeWidth={1.5} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Tasks</p>
                      <p className="text-3xl font-heading font-bold text-foreground mt-1">
                        {analytics?.total_tasks || 0}
                      </p>
                    </div>
                    <FolderKanban className="h-8 w-8 text-blue-600" strokeWidth={1.5} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Contracts</p>
                      <p className="text-3xl font-heading font-bold text-foreground mt-1">
                        {analytics?.total_contracts || 0}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-green-600" strokeWidth={1.5} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial & Performance */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Payment Volume</p>
                      <p className="text-3xl font-heading font-bold text-green-800 mt-1">
                        ${(analytics?.total_payment_volume || 0).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" strokeWidth={1.5} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed Contracts</p>
                      <p className="text-3xl font-heading font-bold text-foreground mt-1">
                        {analytics?.completed_contracts || 0}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary" strokeWidth={1.5} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Provider Rating</p>
                      <p className="text-3xl font-heading font-bold text-foreground mt-1">
                        {analytics?.average_provider_rating || 0}
                        <span className="text-lg text-muted-foreground">/5</span>
                      </p>
                    </div>
                    <Star className="h-8 w-8 text-amber-400 fill-amber-400" strokeWidth={1.5} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/admin/users">
                <Card className="border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="font-medium">Manage Users</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/admin/companies">
                <Card className="border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span className="font-medium">Manage Companies</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/admin/compliance">
                <Card className="border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <span className="font-medium">Compliance Queue</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
              <Link to="/admin/analytics">
                <Card className="border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="font-medium">View Analytics</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Tasks by Category */}
            {analytics?.tasks_by_category && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Tasks by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(analytics.tasks_by_category).map(([category, count]) => (
                      <div key={category} className="p-3 bg-slate-50 rounded-sm">
                        <p className="text-sm text-muted-foreground capitalize">{category.replace('_', ' ')}</p>
                        <p className="text-2xl font-heading font-bold text-foreground">{count}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
