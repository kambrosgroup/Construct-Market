import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  FileText, Download, Calendar, TrendingUp, Users, Building2, 
  DollarSign, BarChart3, PieChart
} from 'lucide-react';
import axios from 'axios';

const REPORT_TYPES = [
  { id: 'executive', label: 'Executive Summary', icon: FileText, description: 'High-level overview of platform performance' },
  { id: 'financial', label: 'Financial Report', icon: DollarSign, description: 'Detailed revenue and transaction analysis' },
  { id: 'customer', label: 'Customer Report', icon: Users, description: 'Customer acquisition and retention metrics' },
  { id: 'operations', label: 'Operations Report', icon: Building2, description: 'Task completion and provider performance' }
];

export default function CRMReports() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API}/crm/reports`, { withCredentials: true, headers });
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType) => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(`${API}/crm/reports/generate`, 
        { type: reportType, period },
        { withCredentials: true, headers }
      );
      setSelectedReport(response.data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <DashboardLayout title="Reports" isCRM>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Reports & Analytics</h2>
            <p className="text-muted-foreground">Generate and view platform reports</p>
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
          </div>
        </div>

        {/* Report Types */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REPORT_TYPES.map(report => (
            <Card 
              key={report.id} 
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
              onClick={() => generateReport(report.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-primary/10 rounded-lg mb-4">
                    <report.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold mb-2">{report.label}</h3>
                  <p className="text-xs text-muted-foreground">{report.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Generated Report */}
        {generating ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Generating report...</p>
            </CardContent>
          </Card>
        ) : selectedReport ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading">{selectedReport.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generated on {new Date(selectedReport.generated_at).toLocaleString()}
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid sm:grid-cols-4 gap-4 mb-8">
                {selectedReport.summary?.map((stat, idx) => (
                  <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-heading font-bold">
                      {stat.type === 'currency' ? formatCurrency(stat.value) : stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Report Sections */}
              {selectedReport.sections?.map((section, idx) => (
                <div key={idx} className="mb-8">
                  <h3 className="font-heading text-lg font-semibold mb-4">{section.title}</h3>
                  {section.type === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {section.columns?.map((col, i) => (
                              <th key={i}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows?.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {section.type === 'text' && (
                    <p className="text-muted-foreground">{section.content}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No reports generated yet</p>
                <p className="text-sm text-muted-foreground">Click on a report type above to generate</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(report.generated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
