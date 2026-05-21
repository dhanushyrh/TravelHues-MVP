import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Video, Package, Store, Settings, LogOut, Globe } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/content', label: 'Content', icon: Video },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/storefront', label: 'Storefront', icon: Store },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b">
          <Globe className="h-6 w-6 text-indigo-600 mr-2" />
          <span className="font-bold text-gray-900 text-lg">TravelHues</span>
          <span className="ml-1.5 text-xs text-indigo-500 font-medium">Creator</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}>
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t">
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={() => { clearAuth(); navigate('/auth/login'); }} className="text-gray-400 hover:text-red-500">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
