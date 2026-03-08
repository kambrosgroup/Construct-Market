import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  DollarSign, Users, ArrowRight, Calendar, Building2, MoreHorizontal
} from 'lucide-react';
import axios from 'axios';

const PIPELINE_STAGES = [
  { id: 'lead', label: 'New Leads', color: 'bg-blue-500' },
  { id: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-purple-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'won', label: 'Won', color: 'bg-green-500' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500' }
];

export default function CRMPipeline() {
  const [deals, setDeals] = useState({});
  const [stats, setStats] = useState({ total_value: 0, win_rate: 0, avg_deal_size: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPipeline();
  }, [filter]);

  const fetchPipeline = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/crm/pipeline?filter=${filter}`, { 
        withCredentials: true, headers 
      });
      setDeals(response.data.deals || {});
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Failed to fetch pipeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount);
  };

  const getStageTotal = (stageId) => {
    return (deals[stageId] || []).reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  return (
    <DashboardLayout title="Sales Pipeline" isCRM>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Sales Pipeline</h2>
            <p className="text-muted-foreground">Track and manage your sales opportunities</p>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                  <p className="text-2xl font-heading font-bold text-primary">{formatCurrency(stats.total_value)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-heading font-bold">{stats.win_rate}%</p>
                </div>
                <Users className="h-8 w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Deal Size</p>
                  <p className="text-2xl font-heading font-bold">{formatCurrency(stats.avg_deal_size)}</p>
                </div>
                <Building2 className="h-8 w-8 text-accent/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Board */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading pipeline...</div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {PIPELINE_STAGES.slice(0, 5).map(stage => (
                <div key={stage.id} className="w-72 flex-shrink-0">
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                          <CardTitle className="font-heading text-base">{stage.label}</CardTitle>
                        </div>
                        <Badge variant="outline">{(deals[stage.id] || []).length}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(getStageTotal(stage.id))}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
                      {(deals[stage.id] || []).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No deals in this stage
                        </div>
                      ) : (
                        (deals[stage.id] || []).map(deal => (
                          <Card key={deal.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm line-clamp-1">{deal.title}</h4>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {deal.company_name}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="font-heading font-bold text-primary">
                                  {formatCurrency(deal.value)}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(deal.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
