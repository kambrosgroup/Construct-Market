import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Building2, Search, CheckCircle, XCircle, MapPin, Phone } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    company_type: '',
    is_verified: '',
    search: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, [filters.company_type, filters.is_verified]);

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const params = new URLSearchParams();
      if (filters.company_type) params.append('company_type', filters.company_type);
      if (filters.is_verified !== '') params.append('is_verified', filters.is_verified);
      
      const response = await axios.get(`${API}/admin/companies?${params.toString()}`, { withCredentials: true, headers });
      setCompanies(response.data.companies);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerified = async (companyId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.put(`${API}/admin/companies/${companyId}/verify`, { is_verified: !currentStatus }, { withCredentials: true, headers });
      toast.success(`Company ${!currentStatus ? 'verified' : 'unverified'}`);
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to update company status');
    }
  };

  const filteredCompanies = companies.filter(company => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return company.name?.toLowerCase().includes(search) ||
             company.abn?.toLowerCase().includes(search) ||
             company.city?.toLowerCase().includes(search);
    }
    return true;
  });

  const getTypeColor = (type) => {
    const colors = {
      builder: 'bg-blue-100 text-blue-700',
      provider: 'bg-green-100 text-green-700',
      supplier: 'bg-purple-100 text-purple-700'
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout title="Companies">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Companies</h2>
            <p className="text-muted-foreground">{total} total companies</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ABN, or city..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              data-testid="search-companies-input"
            />
          </div>
          <Select value={filters.company_type} onValueChange={(v) => setFilters({ ...filters, company_type: v })}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="builder">Builder</SelectItem>
              <SelectItem value="provider">Provider</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.is_verified} onValueChange={(v) => setFilters({ ...filters, is_verified: v })}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="true">Verified</SelectItem>
              <SelectItem value="false">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading companies...</div>
        ) : filteredCompanies.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No companies found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCompanies.map((company) => (
              <Card key={company.company_id} className="border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-sm bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-foreground">{company.name}</p>
                        <p className="text-sm text-muted-foreground">ABN: {company.abn || 'N/A'}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {company.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {company.city}, {company.state}
                            </span>
                          )}
                          {company.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {company.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getTypeColor(company.company_type)}>{company.company_type}</Badge>
                      <Badge variant="secondary" className="capitalize">{company.subscription_tier}</Badge>
                      <Badge variant={company.is_verified ? 'default' : 'secondary'} className={company.is_verified ? 'bg-green-100 text-green-700' : ''}>
                        {company.is_verified ? 'Verified' : 'Unverified'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleVerified(company.company_id, company.is_verified)}
                        className="gap-1"
                        data-testid={`toggle-company-${company.company_id}`}
                      >
                        {company.is_verified ? (
                          <>
                            <XCircle className="h-4 w-4" /> Unverify
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" /> Verify
                          </>
                        )}
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
