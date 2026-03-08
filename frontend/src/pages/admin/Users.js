import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { API } from '../../App';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Users, Search, UserCheck, UserX, Mail } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    is_active: '',
    search: ''
  });

  useEffect(() => {
    fetchUsers();
  }, [filters.role, filters.is_active]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.is_active !== '') params.append('is_active', filters.is_active);
      
      const response = await axios.get(`${API}/admin/users?${params.toString()}`, { withCredentials: true, headers });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.put(`${API}/admin/users/${userId}/activate`, { is_active: !currentStatus }, { withCredentials: true, headers });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return user.email?.toLowerCase().includes(search) ||
             user.first_name?.toLowerCase().includes(search) ||
             user.last_name?.toLowerCase().includes(search);
    }
    return true;
  });

  const getRoleColor = (role) => {
    const colors = {
      builder: 'bg-blue-100 text-blue-700',
      provider: 'bg-green-100 text-green-700',
      admin: 'bg-purple-100 text-purple-700',
      pending: 'bg-amber-100 text-amber-700'
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  return (
    <DashboardLayout title="Users">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Users</h2>
            <p className="text-muted-foreground">{total} total users</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              data-testid="search-users-input"
            />
          </div>
          <Select value={filters.role} onValueChange={(v) => setFilters({ ...filters, role: v })}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              <SelectItem value="builder">Builder</SelectItem>
              <SelectItem value="provider">Provider</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.is_active} onValueChange={(v) => setFilters({ ...filters, is_active: v })}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <Card className="border">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.user_id} className="border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {user.picture ? (
                          <img src={user.picture} alt="" className="h-10 w-10 rounded-full" />
                        ) : (
                          <Users className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(user.user_id, user.is_active)}
                        className="gap-1"
                        data-testid={`toggle-user-${user.user_id}`}
                      >
                        {user.is_active ? (
                          <>
                            <UserX className="h-4 w-4" /> Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" /> Activate
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
