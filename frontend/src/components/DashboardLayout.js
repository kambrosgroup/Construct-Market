import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../App';
import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { 
  Building2, 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  CreditCard, 
  Receipt, 
  Settings, 
  Bell, 
  LogOut, 
  User, 
  Menu, 
  X,
  Search,
  ClipboardList,
  Hammer,
  Star,
  Users,
  Shield,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Target,
  PieChart
} from 'lucide-react';
import axios from 'axios';

const builderNavItems = [
  { href: '/builder', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/builder/tasks', label: 'Tasks', icon: FolderKanban },
  { href: '/builder/contracts', label: 'Contracts', icon: FileText },
  { href: '/builder/payments', label: 'Payments', icon: CreditCard },
  { href: '/builder/invoices', label: 'Invoices', icon: Receipt },
  { href: '/builder/settings', label: 'Settings', icon: Settings },
];

const providerNavItems = [
  { href: '/provider', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/provider/tasks', label: 'Task Feed', icon: Search },
  { href: '/provider/bids', label: 'My Bids', icon: ClipboardList },
  { href: '/provider/contracts', label: 'Contracts', icon: FileText },
  { href: '/provider/work-orders', label: 'Work Orders', icon: Hammer },
  { href: '/provider/payouts', label: 'Payouts', icon: DollarSign },
  { href: '/provider/ratings', label: 'Ratings', icon: Star },
  { href: '/provider/settings', label: 'Settings', icon: Settings },
];

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/companies', label: 'Companies', icon: Building2 },
  { href: '/admin/compliance', label: 'Compliance', icon: Shield },
  { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/crm', label: 'CRM', icon: Target, divider: true },
];

const crmNavItems = [
  { href: '/crm', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm/customers', label: 'Customers', icon: Users },
  { href: '/crm/pipeline', label: 'Pipeline', icon: Target },
  { href: '/crm/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/crm/reports', label: 'Reports', icon: PieChart },
];

export function DashboardLayout({ children, title, isCRM = false }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = isCRM ? crmNavItems :
                   user?.role === 'builder' ? builderNavItems : 
                   user?.role === 'provider' ? providerNavItems : adminNavItems;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const [notifRes, countRes] = await Promise.all([
        axios.get(`${API}/notifications`, { withCredentials: true, headers }),
        axios.get(`${API}/notifications/unread-count`, { withCredentials: true, headers })
      ]);
      
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId, actionUrl) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.put(`${API}/notifications/${notificationId}/read`, {}, { withCredentials: true, headers });
      setUnreadCount(Math.max(0, unreadCount - 1));
      setNotifications(notifications.map(n => 
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      ));
      
      if (actionUrl) {
        navigate(actionUrl);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transform transition-transform duration-200
        lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" strokeWidth={1.5} />
            <span className="font-heading text-xl font-bold">ConstructMarket</span>
          </Link>
          <button 
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors
                    ${isActive 
                      ? 'bg-primary text-white' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="h-5 w-5" strokeWidth={1.5} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden text-foreground"
                onClick={() => setSidebarOpen(true)}
                data-testid="mobile-menu-btn"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="font-heading text-xl font-semibold text-foreground">{title}</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
                    <Bell className="h-5 w-5" strokeWidth={1.5} />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent text-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-2 font-semibold border-b">Notifications</div>
                  <ScrollArea className="h-64">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notif) => (
                        <DropdownMenuItem 
                          key={notif.notification_id}
                          className={`p-3 cursor-pointer ${!notif.is_read ? 'bg-slate-50' : ''}`}
                          onClick={() => markAsRead(notif.notification_id, notif.action_url)}
                        >
                          <div className="flex-1">
                            <p className={`text-sm ${!notif.is_read ? 'font-semibold' : ''}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                          {notif.action_url && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
                          )}
                        </DropdownMenuItem>
                      ))
                    )}
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2" data-testid="user-menu-btn">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {user?.picture ? (
                        <img src={user.picture} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user?.first_name} {user?.last_name}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <Badge variant="secondary" className="mt-1 text-xs capitalize">{user?.role}</Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`/${user?.role}/settings`} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive" data-testid="logout-btn">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
