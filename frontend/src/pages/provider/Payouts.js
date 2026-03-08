import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API, useAuth } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, ExternalLink, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function ProviderPayouts() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState({ available: 0, pending: 0, total: 0 });
  const [stripeStatus, setStripeStatus] = useState({ connected: false, onboarding_url: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
    checkStripeStatus();
  }, []);

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/provider/payouts`, { withCredentials: true, headers });
      setPayouts(response.data.payouts || []);
      setStats(response.data.stats || { available: 0, pending: 0, total: 0 });
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStripeStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/provider/stripe-status`, { withCredentials: true, headers });
      setStripeStatus(response.data);
    } catch (error) {
      console.error('Failed to check Stripe status:', error);
    }
  };

  const initiateStripeOnboarding = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${API}/provider/stripe-onboard`, 
        { return_url: window.location.origin + '/provider/payouts' },
        { withCredentials: true, headers }
      );
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error('Failed to start Stripe onboarding');
    }
  };

  const requestPayout = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/provider/request-payout`, {}, { withCredentials: true, headers });
      toast.success('Payout request submitted');
      fetchPayouts();
    } catch (error) {
      toast.error('Failed to request payout');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return <Badge className={styles[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  return (
    <DashboardLayout title="Payouts">
      <div className="space-y-8">
        {/* Stripe Connect Status */}
        {!stripeStatus.connected && (
          <Card className="border-2 border-accent bg-accent/5">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Building2 className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold">Set Up Payouts</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your bank account via Stripe to receive payments for completed work.
                    </p>
                  </div>
                </div>
                <Button onClick={initiateStripeOnboarding} className="gap-2">
                  Connect Stripe <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Available Balance</p>
                  <p className="stat-value text-primary">${stats.available.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Pending</p>
                  <p className="stat-value text-accent">${stats.pending.toLocaleString()}</p>
                </div>
                <Clock className="h-8 w-8 text-accent/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">Total Earned</p>
                  <p className="stat-value">${stats.total.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request Payout */}
        {stripeStatus.connected && stats.available > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold">Ready to withdraw</h3>
                  <p className="text-sm text-muted-foreground">
                    Your available balance of ${stats.available.toLocaleString()} can be transferred to your bank account.
                  </p>
                </div>
                <Button onClick={requestPayout} className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  Request Payout
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No payouts yet</p>
                <p className="text-sm text-muted-foreground">Complete work to start earning</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr key={payout.payout_id}>
                        <td>{new Date(payout.created_at).toLocaleDateString()}</td>
                        <td>{payout.description || 'Payout'}</td>
                        <td className="font-medium">${payout.amount.toLocaleString()}</td>
                        <td>{getStatusBadge(payout.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
