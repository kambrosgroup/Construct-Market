import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, Building2, FolderKanban, FileText, DollarSign, Star, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

const COLORS = ['#0F766E', '#F97316', '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#6366F1', '#EC4899'];

export default function AdminAnalytics() {
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

  const categoryData = analytics?.tasks_by_category 
    ? Object.entries(analytics.tasks_by_category).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }))
    : [];

  const statusData = analytics?.tasks_by_status
    ? Object.entries(analytics.tasks_by_status).map(([name, value]) => ({
        name: name.replace('_', ' ').charAt(0).toUpperCase() + name.replace('_', ' ').slice(1),
        value
      }))
    : [];

  return (
    <DashboardLayout title="Analytics">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Platform Analytics</h2>
          <p className="text-muted-foreground">Detailed insights into platform performance</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border">
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

              <Card className="border">
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

              <Card className="border">
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

              <Card className="border">
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

            {/* Financial Metrics */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="border bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">Total Payment Volume</p>
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

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Tasks by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0F766E" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Tasks by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Task Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                  {statusData.map((item, index) => (
                    <div key={item.name} className="p-3 bg-slate-50 rounded-sm text-center">
                      <div 
                        className="w-3 h-3 rounded-full mx-auto mb-2" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <p className="text-2xl font-heading font-bold text-foreground">{item.value}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
