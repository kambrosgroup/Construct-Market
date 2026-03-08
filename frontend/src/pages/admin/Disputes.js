import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { AlertTriangle, DollarSign, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/admin/disputes`, { withCredentials: true, headers });
      setDisputes(response.data);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const getDisputeStatusColor = (status) => {
    const colors = {
      open: 'bg-red-100 text-red-700',
      in_mediation: 'bg-amber-100 text-amber-700',
      resolved: 'bg-green-100 text-green-700',
      escalated: 'bg-purple-100 text-purple-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout title="Disputes">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Payment Disputes</h2>
          <p className="text-muted-foreground">Review and manage disputed payments</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading disputes...</div>
        ) : disputes.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No active disputes</p>
              <p className="text-sm text-muted-foreground mt-1">All payments are in good standing</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <Card key={dispute.payment_id} className="border border-red-200">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="font-heading text-lg font-semibold">
                          Payment Dispute
                        </h3>
                        <Badge className={getDisputeStatusColor(dispute.dispute_status)}>
                          {dispute.dispute_status?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{dispute.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Contract: {dispute.contract_id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {dispute.dispute_reason && (
                        <div className="mt-3 p-3 bg-red-50 rounded-sm">
                          <p className="text-sm font-medium text-red-700">Dispute Reason:</p>
                          <p className="text-sm text-red-600">{dispute.dispute_reason}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-heading font-bold text-red-600">
                        ${dispute.amount?.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">{dispute.currency}</p>
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
