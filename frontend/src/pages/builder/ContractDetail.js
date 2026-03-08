import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ArrowLeft, FileText, Calendar, DollarSign, Check, Download } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function BuilderContractDetail() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/contracts/${contractId}`, { withCredentials: true, headers });
      setContract(response.data);
    } catch (error) {
      console.error('Failed to fetch contract:', error);
      toast.error('Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    setSigning(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/contracts/${contractId}/sign`, {}, { withCredentials: true, headers });
      toast.success('Contract signed successfully!');
      fetchContract();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      sent_for_signature: 'bg-blue-100 text-blue-700',
      signed_by_builder: 'bg-amber-100 text-amber-700',
      signed_by_provider: 'bg-amber-100 text-amber-700',
      fully_executed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const canSign = contract && !contract.builder_signed_at && 
    ['draft', 'sent_for_signature', 'signed_by_provider'].includes(contract.status);

  if (loading) {
    return (
      <DashboardLayout title="Contract Details">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout title="Contract Details">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Contract not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Contract Details">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/builder/contracts')} className="mb-2 -ml-2 gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Contracts
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-2xl font-bold text-foreground">
                {contract.task_title || `Contract ${contract.contract_id}`}
              </h2>
              <Badge className={getStatusColor(contract.status)}>{contract.status?.replace(/_/g, ' ')}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Contract with {contract.provider_company_name}
            </p>
          </div>
          {canSign && (
            <Button onClick={handleSignContract} disabled={signing} className="gap-2 bg-accent hover:bg-accent/90" data-testid="sign-contract-btn">
              <Check className="h-4 w-4" />
              {signing ? 'Signing...' : 'Sign Contract'}
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Contract Document</CardTitle>
              </CardHeader>
              <CardContent>
                {contract.html_body ? (
                  <div 
                    className="prose max-w-none border p-6 rounded-sm bg-white"
                    dangerouslySetInnerHTML={{ __html: contract.html_body }}
                  />
                ) : (
                  <p className="text-muted-foreground">Contract document not available</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Contract Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-heading font-bold text-primary">
                    ${contract.price?.toLocaleString()}
                  </span>
                </div>
                {contract.payment_terms && (
                  <p className="text-sm text-muted-foreground mt-2">{contract.payment_terms}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Start: {new Date(contract.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>End: {new Date(contract.end_date).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Signatures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Builder</span>
                  {contract.builder_signed_at ? (
                    <Badge className="bg-green-100 text-green-700">
                      Signed {new Date(contract.builder_signed_at).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  {contract.provider_signed_at ? (
                    <Badge className="bg-green-100 text-green-700">
                      Signed {new Date(contract.provider_signed_at).toLocaleDateString()}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
