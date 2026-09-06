import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Truck, MessageSquare, FileText, Settings as SettingsIcon, Search, LogOut, UserCircle2, Shield, ScrollText, Share2, ChevronDown, UserCheck, UploadCloud, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/my-clients', label: 'My Clients', icon: UserCheck },
  { to: '/deliveries', label: 'Deliveries', icon: Truck },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/templates', label: 'SMS Templates', icon: FileText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const adminNav = [
  { to: '/admin/offers', label: 'Offer Catalogue', icon: ScrollText },
  { to: '/admin/inbound-queue', label: 'Inbound Queue', icon: FileText },
  { to: '/admin/users', label: 'Team & Access', icon: Shield },
  { to: '/admin/share', label: 'Share Links', icon: Share2 },
  { to: '/admin/imports', label: 'Data Imports', icon: UploadCloud },
  { to: '/admin/audit', label: 'Audit Log', icon: ScrollText },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const initials = (user?.name || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="min-h-screen bg-[#fafafa] overflow-x-hidden">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-neutral-900/40 md:hidden"
          onClick={closeMobileNav}
        />
      )}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 h-screen w-72 max-w-[85vw] overflow-hidden bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 md:z-auto md:max-w-none md:translate-x-0',
        mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="px-5 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <img src="/delivery-centre-logo.svg" alt="Delivery Centre" className="h-10 w-10" />
            <div className="leading-tight">
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#E11B22]">DELIVERY CENTRE</p>
              <p className="font-bold text-[15px] tracking-tight text-neutral-900">BYD Melbourne</p>
              <p className="font-semibold text-[12px] text-neutral-500">&amp; Fairfield</p>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto md:hidden" aria-label="Close navigation" onClick={closeMobileNav}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="min-h-0 flex-1 p-3 space-y-0.5 overflow-y-auto">
          {mainNav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeMobileNav}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive ? 'bg-[#FFEDED] text-[#B81319]' : 'text-neutral-700 hover:bg-neutral-100',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <p className="px-3 pt-5 pb-2 text-[10px] font-bold tracking-[0.18em] text-neutral-400 uppercase">Admin</p>
              {adminNav.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={closeMobileNav}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'bg-[#FFEDED] text-[#B81319]' : 'text-neutral-700 hover:bg-neutral-100',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-neutral-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-100 text-left">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-neutral-900 text-white text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-neutral-500 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-neutral-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/change-password')}>
                <UserCircle2 className="h-4 w-4 mr-2" /> Change password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { logout(); navigate('/login'); }}>
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="min-h-screen flex flex-col min-w-0 md:ml-72">
        <header className="min-h-16 bg-white border-b border-neutral-200 flex items-center px-4 sm:px-6 py-3 gap-3 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input placeholder="Search clients, vehicles, messages..." className="pl-9 h-10 bg-neutral-50 border-neutral-200" />
          </div>
          <Button onClick={() => navigate('/clients?new=1')} className="bg-[#E11B22] hover:bg-[#B81319] text-white shadow-sm shrink-0 px-3 sm:px-4">
            <span className="hidden sm:inline">New Delivery</span>
            <span className="sm:hidden">New</span>
          </Button>
        </header>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
