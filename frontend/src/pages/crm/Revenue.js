import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Calendar, Download
} from 'lucide-react';
import axios from 'axios';

export default function CRMRevenue() {
  const [revenueData, setRevenueData] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [period]);

  const fetchRevenueData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/crm/revenue?period=${period}`, { 
        withCredentials: true, headers 
      });
      setRevenueData(response.data);
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount || 0);
  };

  const getChangeIndicator = (change) => {
    if (change >= 0) {
      return (
        <span className="flex items-center gap-1 text-green-600">
          <ArrowUpRight className="h-4 w-4" />
          +{change.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-red-600">
        <ArrowDownRight className="h-4 w-4" />
        {change.toFixed(1)}%
      </span>
    );
  };

  return (
    <DashboardLayout title="Revenue" isCRM>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Revenue Analytics</h2>
            <p className="text-muted-foreground">Track your platform revenue and growth</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <>
            {/* Revenue Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="stat-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stat-label">Total Revenue</p>
                      <p className="stat-value text-primary">{formatCurrency(revenueData?.total_revenue)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getChangeIndicator(revenueData?.revenue_change || 0)}
                        <span className="text-xs text-muted-foreground">vs previous</span>
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
                      <p className="stat-label">Platform Fees</p>
                      <p className="stat-value">{formatCurrency(revenueData?.platform_fees)}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {revenueData?.fee_rate || 0}% avg rate
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stat-label">GMV (Gross)</p>
                      <p className="stat-value">{formatCurrency(revenueData?.gmv)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getChangeIndicator(revenueData?.gmv_change || 0)}
                        <span className="text-xs text-muted-foreground">vs previous</span>
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-accent/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="stat-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stat-label">Avg Transaction</p>
                      <p className="stat-value">{formatCurrency(revenueData?.avg_transaction)}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {revenueData?.transaction_count || 0} transactions
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Breakdown */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(revenueData?.by_category || []).map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary" style={{
                            backgroundColor: `hsl(${idx * 45}, 70%, 50%)`
                          }}></div>
                          <span className="capitalize">{cat.category?.replace('_', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(cat.revenue)}</p>
                          <p className="text-xs text-muted-foreground">{cat.percentage}%</p>
                        </div>
                      </div>
                    ))}
                    {(!revenueData?.by_category || revenueData.by_category.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">No revenue data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(revenueData?.monthly_trend || []).map((month, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-16">{month.month}</span>
                        <div className="flex-1 h-8 bg-muted rounded overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${(month.revenue / (revenueData?.max_monthly || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-medium w-24 text-right">{formatCurrency(month.revenue)}</span>
                      </div>
                    ))}
                    {(!revenueData?.monthly_trend || revenueData.monthly_trend.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">No trend data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Customers */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Top Revenue Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Company</th>
                        <th>Transactions</th>
                        <th>Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(revenueData?.top_customers || []).map((customer, idx) => (
                        <tr key={idx}>
                          <td>{customer.name}</td>
                          <td>{customer.company}</td>
                          <td>{customer.transactions}</td>
                          <td className="font-medium text-primary">{formatCurrency(customer.revenue)}</td>
                        </tr>
                      ))}
                      {(!revenueData?.top_customers || revenueData.top_customers.length === 0) && (
                        <tr>
                          <td colSpan={4} className="text-center text-muted-foreground py-8">
                            No customer data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
