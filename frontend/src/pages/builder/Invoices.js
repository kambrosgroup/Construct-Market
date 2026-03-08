import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Receipt, Download, Eye, Calendar, DollarSign } from 'lucide-react';
import axios from 'axios';

export default function BuilderInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/invoices`, { withCredentials: true, headers });
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    window.open(`${backendUrl}/api/invoices/${invoiceId}/html`, '_blank');
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      issued: 'bg-blue-100 text-blue-700',
      viewed: 'bg-blue-100 text-blue-700',
      partially_paid: 'bg-amber-100 text-amber-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout title="Invoices">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Invoices</h2>
          <p className="text-muted-foreground">View your project invoices</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No invoices yet</p>
              <p className="text-sm text-muted-foreground mt-1">Invoices are generated when payments are released</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <Card key={invoice.invoice_id} className="border hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          {invoice.invoice_number}
                        </h3>
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">
                        {invoice.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          From: {invoice.issued_by_company_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-heading font-bold text-primary">
                        ${invoice.total?.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        (inc. ${invoice.tax_amount?.toLocaleString()} GST)
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 gap-1"
                        onClick={() => handleViewInvoice(invoice.invoice_id)}
                        data-testid={`view-invoice-${invoice.invoice_id}`}
                      >
                        <Eye className="h-4 w-4" /> View Invoice
                      </Button>
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
