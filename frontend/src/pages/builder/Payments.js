import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CreditCard, DollarSign, Check, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function BuilderPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/payments`, { withCredentials: true, headers });
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiatePayment = async (paymentId) => {
    setProcessingPayment(paymentId);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.post(
        `${API}/payments/${paymentId}/initiate-checkout`,
        { origin_url: window.location.origin },
        { withCredentials: true, headers }
      );
      
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initiate payment');
      setProcessingPayment(null);
    }
  };

  const handleReleasePayment = async (paymentId) => {
    setProcessingPayment(paymentId);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.post(`${API}/payments/${paymentId}/release`, {}, { withCredentials: true, headers });
      toast.success('Payment released successfully!');
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to release payment');
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-slate-100 text-slate-700',
      escrow_held: 'bg-amber-100 text-amber-700',
      paid: 'bg-green-100 text-green-700',
      refunded: 'bg-blue-100 text-blue-700',
      disputed: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout title="Payments">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Payments</h2>
          <p className="text-muted-foreground">Manage your project payments</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading payments...</div>
        ) : payments.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No payments yet</p>
              <p className="text-sm text-muted-foreground mt-1">Payments are created when contracts are executed</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {payments.map((payment) => (
              <Card key={payment.payment_id} className="border">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          {payment.description}
                        </h3>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status?.replace('_', ' ')}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {payment.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Contract: {payment.contract_id}
                      </p>
                      {payment.escrow_held_at && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          In escrow since {new Date(payment.escrow_held_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-heading font-bold text-primary">
                        ${payment.amount?.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">{payment.currency}</p>
                      <div className="mt-3">
                        {payment.status === 'pending' && (
                          <Button 
                            onClick={() => handleInitiatePayment(payment.payment_id)}
                            disabled={processingPayment === payment.payment_id}
                            className="gap-2"
                            data-testid={`pay-${payment.payment_id}`}
                          >
                            <CreditCard className="h-4 w-4" />
                            {processingPayment === payment.payment_id ? 'Processing...' : 'Pay Now'}
                          </Button>
                        )}
                        {payment.status === 'escrow_held' && (
                          <Button 
                            onClick={() => handleReleasePayment(payment.payment_id)}
                            disabled={processingPayment === payment.payment_id}
                            className="gap-2 bg-accent hover:bg-accent/90"
                            data-testid={`release-${payment.payment_id}`}
                          >
                            <Check className="h-4 w-4" />
                            {processingPayment === payment.payment_id ? 'Releasing...' : 'Release Payment'}
                          </Button>
                        )}
                        {payment.status === 'paid' && (
                          <Badge className="bg-green-100 text-green-700">
                            <Check className="h-4 w-4 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
