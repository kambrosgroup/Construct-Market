import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { useAuth, API } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { User, Building2, Save } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function BuilderSettings() {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    position_title: ''
  });
  const [companyData, setCompanyData] = useState({
    name: '',
    abn: '',
    phone: '',
    address_line_1: '',
    city: '',
    state: '',
    postcode: '',
    website: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        position_title: user.position_title || ''
      });
      if (user.company) {
        setCompanyData({
          name: user.company.name || '',
          abn: user.company.abn || '',
          phone: user.company.phone || '',
          address_line_1: user.company.address_line_1 || '',
          city: user.company.city || '',
          state: user.company.state || '',
          postcode: user.company.postcode || '',
          website: user.company.website || ''
        });
      }
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(`${API}/users/me`, profileData, { withCredentials: true, headers });
      await checkAuth();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(`${API}/companies/me`, companyData, { withCredentials: true, headers });
      await checkAuth();
      toast.success('Company updated successfully');
    } catch (error) {
      toast.error('Failed to update company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground">Manage your account and company settings</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <Building2 className="h-4 w-4" /> Company
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ''} disabled />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position Title</Label>
                  <Input
                    id="position"
                    value={profileData.position_title}
                    onChange={(e) => setProfileData({ ...profileData, position_title: e.target.value })}
                  />
                </div>
                <Button onClick={handleSaveProfile} disabled={loading} className="gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="mt-6">
            <Card className="border">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={companyData.name}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="abn">ABN</Label>
                    <Input
                      id="abn"
                      value={companyData.abn}
                      onChange={(e) => setCompanyData({ ...companyData, abn: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company_phone">Phone</Label>
                    <Input
                      id="company_phone"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={companyData.address_line_1}
                    onChange={(e) => setCompanyData({ ...companyData, address_line_1: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={companyData.city}
                      onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={companyData.state}
                      onChange={(e) => setCompanyData({ ...companyData, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      value={companyData.postcode}
                      onChange={(e) => setCompanyData({ ...companyData, postcode: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={companyData.website}
                    onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                  />
                </div>
                <Button onClick={handleSaveCompany} disabled={loading} className="gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
