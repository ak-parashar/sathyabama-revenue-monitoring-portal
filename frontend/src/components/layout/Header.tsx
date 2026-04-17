import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth, getRoleLabel, AppRole } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../ThemeToggle';

interface HeaderProps {
  onAddProject?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddProject }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="w-full bg-primary flex items-center justify-between px-6 py-2 shadow-md shrink-0">
      {/* Left side: White Logo */}
      <div className="flex items-center">
        <img 
          src="/sathyabama-logo.png" 
          alt="Sathyabama Logo" 
          className="h-12 sm:h-14 object-contain" 
        />
      </div>

      {/* Right side: Add Project, Theme Toggle, User Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {profile && profile.role === 'pi' && onAddProject && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddProject}
            className="flex items-center gap-1 text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 bg-transparent"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Project</span>
          </Button>
        )}

        {/* Theme Toggle (in place of notification bell) */}
        <div className="text-primary-foreground [&_button]:hover:bg-primary-foreground/10 [&_button]:text-primary-foreground [&_button]:hover:text-primary-foreground">
          <ThemeToggle />
        </div>

        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 sm:gap-3 hover:bg-primary-foreground/10 px-2 sm:px-3 py-1.5 rounded-md transition-colors outline-none cursor-pointer">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-primary-foreground uppercase tracking-wide hidden sm:inline-block max-w-[150px] truncate">
                  {profile?.name || profile?.email?.split('@')[0] || "USER"}
                </span>
                <ChevronDown className="h-4 w-4 text-primary-foreground/70" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium truncate">{profile?.name || profile?.email}</span>
                <span className="text-xs text-muted-foreground truncate">{profile?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <span className="text-xs font-semibold text-primary uppercase">{getRoleLabel((profile?.role ?? 'student') as AppRole)}</span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
