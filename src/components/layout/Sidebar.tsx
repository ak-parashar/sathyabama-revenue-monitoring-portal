import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Megaphone,
  FileText,
  Table,
  Key,
  LogOut,
  LayoutDashboard,
  FolderOpen,
  UserPlus,
  Plus,
  Settings
} from 'lucide-react';
import { useAuth, getRoleLabel } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

const Sidebar: React.FC = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = profile?.role;

  const getNavItems = () => {
    const baseItems = [];

    if (role !== 'superadmin') {
      baseItems.push({ to: '/home', icon: Home, label: 'Home' });
    }

    if (role === 'admin' || role === 'superadmin') {
      baseItems.push({ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' });
    }

    if (role === 'admin' || role === 'superadmin') {
      baseItems.push({ to: '/projects', icon: FolderOpen, label: 'Projects' });
    }

    baseItems.push(
      { to: '/projects-table', icon: Table, label: 'Projects Table' },
    );

    if (role === 'pi' || role === 'jrf' || role === 'assistant') {
      baseItems.push({ to: '/add-project', icon: Plus, label: 'Add Project' });
    }

    if (role === 'superadmin' || role === 'admin' || role === 'pi') {
      baseItems.push({ to: '/create-user', icon: UserPlus, label: 'Create User' });
    }

    baseItems.push({ to: '/settings', icon: Settings, label: 'Settings' });

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <aside className="w-60 min-h-screen bg-background border-r flex flex-col">
      {/* Portal title & Profile */}
      <div className="p-4 border-b space-y-4">
        <div className="bg-primary rounded-md px-4 py-3 text-center">
          <h2 className="text-sm font-semibold text-primary-foreground">
            Revenue Monitoring Portal
          </h2>
        </div>

        {profile && (
          <div className="flex flex-col items-center gap-2 py-2">
            <Dialog>
              <DialogTrigger asChild>
                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20 bg-muted cursor-pointer hover:border-primary/50 transition-all hover:scale-105">
                  <img
                    src={profile.avatar_url
                      ? `http://localhost:5000/${profile.avatar_url}`
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none flex items-center justify-center">
                <div className="relative group">
                  <img
                    src={profile.avatar_url
                      ? `http://localhost:5000/${profile.avatar_url}`
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`}
                    alt="Profile Large"
                    className="max-h-[80vh] max-w-full rounded-lg shadow-2xl border-4 border-white/20"
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white text-sm font-medium">
                    {profile.name}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <div className="text-center">
              <p className="text-sm font-bold text-primary truncate max-w-[180px]">
                {profile.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                {profile.email}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom info section if needed */}
      <div className="p-4 border-t text-xs text-muted-foreground text-center">
        &copy; 2024 Sathyabama Portal
      </div>
    </aside>
  );
};

export default Sidebar;
