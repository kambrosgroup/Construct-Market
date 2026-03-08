import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { FileText, Calendar, DollarSign } from 'lucide-react';
import axios from 'axios';

export default function BuilderContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/contracts`, { withCredentials: true, headers });
      setContracts(response.data);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
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

  return (
    <DashboardLayout title="Contracts">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Your Contracts</h2>
          <p className="text-muted-foreground">View and manage your contracts</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading contracts...</div>
        ) : contracts.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No contracts yet</p>
              <p className="text-sm text-muted-foreground mt-1">Contracts are created when you select a bid</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {contracts.map((contract) => (
              <Link key={contract.contract_id} to={`/builder/contracts/${contract.contract_id}`}>
                <Card className="border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-lg font-semibold text-foreground">
                            {contract.task_title || `Contract ${contract.contract_id}`}
                          </h3>
                          <Badge className={getStatusColor(contract.status)}>
                            {contract.status?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">
                          Provider: {contract.provider_company_name}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(contract.start_date).toLocaleDateString()} - {new Date(contract.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-heading font-bold text-primary">
                          ${contract.price?.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Contract Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
