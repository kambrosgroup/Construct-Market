import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ClipboardList, DollarSign, Clock, Calendar } from 'lucide-react';
import axios from 'axios';

export default function ProviderBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/bids`, { withCredentials: true, headers });
      setBids(response.data);
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-700',
      viewed: 'bg-slate-100 text-slate-700',
      selected: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      withdrawn: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout title="My Bids">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Your Bids</h2>
          <p className="text-muted-foreground">Track your submitted bids</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading bids...</div>
        ) : bids.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No bids submitted yet</p>
              <Link to="/provider/tasks" className="text-primary hover:underline text-sm mt-2 inline-block">
                Browse available tasks
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bids.map((bid) => (
              <Link key={bid.bid_id} to={`/provider/tasks/${bid.task_id}`}>
                <Card className="border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-lg font-semibold text-foreground">
                            Task: {bid.task_id}
                          </h3>
                          <Badge className={getStatusColor(bid.status)}>{bid.status}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                          {bid.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {bid.timeline_days} days
                          </span>
                          {bid.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Start: {new Date(bid.start_date).toLocaleDateString()}
                            </span>
                          )}
                          <span>
                            Submitted {new Date(bid.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-heading font-bold text-primary">
                          ${bid.amount?.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">{bid.currency}</p>
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
