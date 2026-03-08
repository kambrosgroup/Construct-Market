import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Hammer, Calendar, Clock } from 'lucide-react';
import axios from 'axios';

export default function ProviderWorkOrders() {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/work-orders`, { withCredentials: true, headers });
      setWorkOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-700',
      started: 'bg-amber-100 text-amber-700',
      in_progress: 'bg-amber-100 text-amber-700',
      paused: 'bg-slate-100 text-slate-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout title="Work Orders">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Work Orders</h2>
          <p className="text-muted-foreground">Manage your active work orders</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading work orders...</div>
        ) : workOrders.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <Hammer className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No work orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">Work orders are created when contracts are executed</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {workOrders.map((wo) => (
              <Link key={wo.work_order_id} to={`/provider/work-orders/${wo.work_order_id}`}>
                <Card className="border hover:border-primary hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-heading text-lg font-semibold text-foreground">
                            {wo.number}
                          </h3>
                          <Badge className={getStatusColor(wo.status)}>
                            {wo.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">
                          Contract: {wo.contract_id}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Scheduled: {new Date(wo.scheduled_start_date).toLocaleDateString()} - {new Date(wo.scheduled_end_date).toLocaleDateString()}
                          </span>
                          {wo.actual_duration_hours && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {wo.actual_duration_hours} hours logged
                            </span>
                          )}
                        </div>
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
