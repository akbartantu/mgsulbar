import { ReactNode, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardStatsProvider } from '@/contexts/DashboardStatsContext';
import { useDashboardStats } from '@/hooks/useDataWithFallback';
import type { DashboardStats } from '@/types/mail';
import {
  LayoutDashboard,
  Send,
  FileEdit,
  ClipboardCheck,
  Archive,
  PlusCircle,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Menu,
  GraduationCap,
  BarChart3,
  Wallet,
  UsersRound,
  Mail,
  MapPin,
  Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavGroup {
  label: string;
  icon: typeof LayoutDashboard;
  basePath: string;
  items: {
    path: string;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }[];
}

function getNavGroups(stats: DashboardStats): NavGroup[] {
  return [
    {
      label: 'Surat Menyurat',
      icon: Mail,
      basePath: '/surat',
      items: [
        { path: '/outbox', label: 'Dokumen', icon: Send, badge: stats.outbox },
        { path: '/drafts', label: 'Draft', icon: FileEdit, badge: stats.drafts },
        { path: '/lacak', label: 'Lacak Surat', icon: MapPin },
        { path: '/approvals', label: 'Persetujuan', icon: ClipboardCheck, badge: stats.awaitingMyApproval },
        { path: '/notifications', label: 'Notifikasi', icon: Bell },
        { path: '/archive', label: 'Arsip', icon: Archive },
      ],
    },
    {
      label: 'Database Awardee',
      icon: GraduationCap,
      basePath: '/awardees',
      items: [
        { path: '/awardees', label: 'Data Awardee', icon: GraduationCap },
      ],
    },
    {
      label: 'Monitoring Program',
      icon: BarChart3,
      basePath: '/programs',
      items: [
        { path: '/programs', label: 'Daftar Program', icon: BarChart3 },
      ],
    },
    {
      label: 'Keuangan',
      icon: Wallet,
      basePath: '/finance',
      items: [
        { path: '/finance', label: 'Keuangan', icon: Wallet },
      ],
    },
    {
      label: 'Manajemen Anggota',
      icon: UsersRound,
      basePath: '/members',
      items: [
        { path: '/members', label: 'Data Anggota', icon: UsersRound },
      ],
    },
    {
      label: 'Pengaturan',
      icon: Settings,
      basePath: '/pengaturan',
      items: [
        { path: '/pengaturan', label: 'Pengaturan', icon: Settings },
      ],
    },
  ];
}

// Paths belonging to surat menyurat module
const suratPaths = ['/outbox', '/drafts', '/lacak', '/approvals', '/notifications', '/archive', '/create'];

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { stats, refetch } = useDashboardStats();

  return (
    <DashboardStatsProvider value={{ refetchDashboardStats: refetch }}>
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 gradient-header z-50 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="iconSm"
          className="text-sidebar-foreground"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-sidebar-foreground font-semibold">MGSULBAR</h1>
        <Button variant="ghost" size="iconSm" className="text-sidebar-foreground">
          <Bell className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-foreground/50 z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-sidebar z-50"
            >
              <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} currentPath={location.pathname} navGroups={getNavGroups(stats)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          currentPath={location.pathname}
          navGroups={getNavGroups(stats)}
        />
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen pt-14 lg:pt-0 transition-all duration-300",
          collapsed ? "lg:pl-[68px]" : "lg:pl-[260px]"
        )}
      >
        {children}
      </main>
    </div>
    </DashboardStatsProvider>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  currentPath: string;
  navGroups: NavGroup[];
}

function SidebarContent({ collapsed, onToggleCollapse, onClose, currentPath, navGroups }: SidebarContentProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayUser = user ?? { name: 'Pengguna', id: '', email: '', role: 'viewer' as const };

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/login', { replace: true });
  };
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-sidebar-foreground">MGSULBAR</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
        {onToggleCollapse && !collapsed && (
          <Button
            variant="ghost"
            size="iconSm"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {onToggleCollapse && collapsed && (
          <Button
            variant="ghost"
            size="iconSm"
            className="text-sidebar-foreground hover:bg-sidebar-accent absolute -right-3 top-5 bg-sidebar border border-sidebar-border rounded-full"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="iconSm"
            className="text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
            onClick={onClose}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {/* Dashboard */}
          <NavLink to="/" onClick={onClose}>
            <Button
              variant={currentPath === '/' ? 'sidebarActive' : 'sidebar'}
              className={cn("w-full", collapsed ? "justify-center px-0" : "justify-start")}
            >
              <LayoutDashboard className="h-4 w-4" />
              {!collapsed && <span className="flex-1 text-left">Dashboard</span>}
            </Button>
          </NavLink>

          {/* Nav Groups */}
          {navGroups.map((group) => {
            const isGroupActive = group.items.some(item => currentPath === item.path) ||
              (group.basePath === '/surat' && suratPaths.includes(currentPath));

            if (collapsed) {
              // In collapsed mode, show only first item icon
              const firstItem = group.items[0];
              return (
                <NavLink key={group.label} to={firstItem.path} onClick={onClose}>
                  <Button
                    variant={isGroupActive ? 'sidebarActive' : 'sidebar'}
                    className="w-full justify-center px-0"
                  >
                    <group.icon className="h-4 w-4" />
                  </Button>
                </NavLink>
              );
            }

            // Single-item groups render as direct link
            if (group.items.length === 1) {
              const item = group.items[0];
              return (
                <NavLink key={group.label} to={item.path} onClick={onClose}>
                  <Button
                    variant={currentPath === item.path ? 'sidebarActive' : 'sidebar'}
                    className="w-full justify-start"
                  >
                    <group.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{group.label}</span>
                  </Button>
                </NavLink>
              );
            }

            // Multi-item groups render as collapsible
            return (
              <Collapsible key={group.label} defaultOpen={isGroupActive}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant={isGroupActive ? 'sidebarActive' : 'sidebar'}
                    className="w-full justify-start group"
                  >
                    <group.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                  {/* Create button for surat */}
                  {group.basePath === '/surat' && (
                    <NavLink to="/create" onClick={onClose}>
                      <Button
                        variant={currentPath === '/create' ? 'sidebarActive' : 'sidebar'}
                        className="w-full justify-start h-8 text-xs"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Buat Surat</span>
                      </Button>
                    </NavLink>
                  )}
                  {group.items.map((item) => (
                    <NavLink key={item.path} to={item.path} onClick={onClose}>
                      <Button
                        variant={currentPath === item.path ? 'sidebarActive' : 'sidebar'}
                        className="w-full justify-start h-8 text-xs"
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="ml-auto bg-sidebar-primary text-sidebar-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Button>
                    </NavLink>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Section */}
      <div className={cn(
        "border-t border-sidebar-border p-4",
        collapsed && "px-2"
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <NavLink to="/profile" className="flex items-center gap-3 flex-1 min-w-0" onClick={onClose}>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-sm">
                  {displayUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {displayUser.name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {displayUser.role}
                </p>
              </div>
            </NavLink>
            <Button variant="ghost" size="iconSm" className="text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={handleLogout} aria-label="Keluar">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <NavLink to="/profile" onClick={onClose}>
          <Avatar className="h-9 w-9 mx-auto">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-sm">
              {displayUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          </NavLink>
        )}
      </div>
    </div>
  );
}
