import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Shield, FileText, Check, X, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function AdminCompliance() {
  const [licences, setLicences] = useState([]);
  const [insurance, setInsurance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [licRes, insRes] = await Promise.all([
        axios.get(`${API}/admin/compliance/licences?status=pending`, { withCredentials: true, headers }),
        axios.get(`${API}/admin/compliance/insurance?status=pending`, { withCredentials: true, headers })
      ]);
      
      setLicences(licRes.data);
      setInsurance(insRes.data);
    } catch (error) {
      console.error('Failed to fetch compliance data:', error);
      toast.error('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLicence = async (licenceId, status) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.put(`${API}/admin/compliance/licences/${licenceId}`, { verification_status: status }, { withCredentials: true, headers });
      toast.success(`Licence ${status}`);
      fetchCompliance();
    } catch (error) {
      toast.error('Failed to update licence');
    }
  };

  const handleVerifyInsurance = async (insuranceId, status) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.put(`${API}/admin/compliance/insurance/${insuranceId}`, { verification_status: status }, { withCredentials: true, headers });
      toast.success(`Insurance ${status}`);
      fetchCompliance();
    } catch (error) {
      toast.error('Failed to update insurance');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      verified: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout title="Compliance">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Compliance Verification</h2>
          <p className="text-muted-foreground">Review and verify licences and insurance</p>
        </div>

        <Tabs defaultValue="licences">
          <TabsList>
            <TabsTrigger value="licences" className="gap-2">
              <FileText className="h-4 w-4" />
              Licences ({licences.length})
            </TabsTrigger>
            <TabsTrigger value="insurance" className="gap-2">
              <Shield className="h-4 w-4" />
              Insurance ({insurance.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="licences" className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : licences.length === 0 ? (
              <Card className="border">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No pending licences to review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {licences.map((lic) => (
                  <Card key={lic.licence_id} className="border">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-heading font-semibold">{lic.license_type}</h3>
                            <Badge className={getStatusColor(lic.verification_status)}>
                              {lic.verification_status}
                            </Badge>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <p><strong>License #:</strong> {lic.license_number}</p>
                            <p><strong>Issuing Body:</strong> {lic.issuing_body}</p>
                            <p><strong>State:</strong> {lic.state}</p>
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Expires: {new Date(lic.expiry_date).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            User: {lic.user_id}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyLicence(lic.licence_id, 'rejected')}
                            className="gap-1 text-red-600 hover:text-red-700"
                            data-testid={`reject-licence-${lic.licence_id}`}
                          >
                            <X className="h-4 w-4" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleVerifyLicence(lic.licence_id, 'verified')}
                            className="gap-1 bg-green-600 hover:bg-green-700"
                            data-testid={`verify-licence-${lic.licence_id}`}
                          >
                            <Check className="h-4 w-4" /> Verify
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insurance" className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : insurance.length === 0 ? (
              <Card className="border">
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No pending insurance to review</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {insurance.map((ins) => (
                  <Card key={ins.insurance_id} className="border">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-heading font-semibold capitalize">
                              {ins.policy_type?.replace('_', ' ')}
                            </h3>
                            <Badge className={getStatusColor(ins.verification_status)}>
                              {ins.verification_status}
                            </Badge>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <p><strong>Policy #:</strong> {ins.policy_number}</p>
                            <p><strong>Provider:</strong> {ins.provider_name}</p>
                            <p><strong>Cover:</strong> ${ins.cover_amount?.toLocaleString()}</p>
                            <p className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Expires: {new Date(ins.expiry_date).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            User: {ins.user_id}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyInsurance(ins.insurance_id, 'rejected')}
                            className="gap-1 text-red-600 hover:text-red-700"
                            data-testid={`reject-insurance-${ins.insurance_id}`}
                          >
                            <X className="h-4 w-4" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleVerifyInsurance(ins.insurance_id, 'verified')}
                            className="gap-1 bg-green-600 hover:bg-green-700"
                            data-testid={`verify-insurance-${ins.insurance_id}`}
                          >
                            <Check className="h-4 w-4" /> Verify
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
