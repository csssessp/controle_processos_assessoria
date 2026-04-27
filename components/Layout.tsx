
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, userHasArea } from '../types';
import logoImg from '../img/logo1.png';
import {
  Files,
  Users,
  History,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  FileText,
  BarChart3,
  ClipboardList,
  BarChart2,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser, logout } = useApp();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [drawerOpen]);

  const DrawerItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
          isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={17} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
          {label}
        </div>
        {isActive && <ChevronRight size={14} className="opacity-70" />}
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="px-3 pt-5 pb-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
    </div>
  );

  const LogoImage = logoImg;

  const isGpc = userHasArea(currentUser, 'gpc');
  const isAssessoria = userHasArea(currentUser, 'assessoria');
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const sectorLabel = currentUser?.role === UserRole.ADMIN
    ? 'ADMINISTRADOR'
    : currentUser?.role === UserRole.GPC
    ? 'GRUPO DE PRESTAÇÃO DE CONTAS'
    : 'ASSESSORIA';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ── Top Header ── */}
      <header className="bg-primary text-white shadow-md sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-3">

            {/* Left: Hamburger + Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setDrawerOpen(o => !o)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors focus:outline-none"
                aria-label="Menu"
              >
                {drawerOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <img src={LogoImage} alt="Brasão SP" className="h-24 w-auto flex-shrink-0" />
            </div>

            {/* Center: Title */}
            <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
              <div className="hidden sm:flex flex-col min-w-0 text-center">
                <h1 className="text-sm sm:text-base font-bold tracking-wide leading-tight uppercase text-white">
                  Sistema de Controle de Processos
                </h1>
                <span className="text-xs text-slate-300 font-semibold leading-snug uppercase tracking-wide">
                  Coordenadoria de Gestão Orçamentária e Financeira
                </span>
              </div>
            </div>

            {/* Right: Sector badge + User + Logout */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-200 border border-slate-600 whitespace-nowrap">
                {sectorLabel}
              </span>

              <Link
                to="/perfil"
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${location.pathname === '/perfil' ? 'bg-slate-800' : 'hover:bg-slate-800'}`}
              >
                <div className="text-right hidden lg:block mr-1">
                  <p className="text-sm font-medium leading-none">{currentUser?.name}</p>
                </div>
                <div className="p-1.5 bg-slate-700 rounded-full text-slate-300">
                  <UserIcon size={15} />
                </div>
              </Link>

              <div className="w-px h-6 bg-slate-700" />

              <button
                onClick={logout}
                className="p-2 text-slate-300 hover:text-white hover:bg-red-500/20 rounded-full transition-colors"
                title="Sair"
              >
                <LogOut size={19} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      )}

      {/* ── Left Drawer ── */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-700 flex-shrink-0">
          <span className="text-sm font-bold text-white tracking-wide uppercase">Menu</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">

          {/* General — only users with assessoria area */}
          {isAssessoria && (
            <>
              <SectionLabel label="Geral" />
              <DrawerItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <DrawerItem to="/processos" icon={Files} label="Processos Assessoria" />
              <DrawerItem to="/prestacao-contas" icon={FileText} label="Prestação de Contas" />
            </>
          )}

          {/* GPC — users with gpc area access */}
          {isGpc && (
            <>
              <SectionLabel label="GPC" />
              <div className="mb-1.5 mx-3">
                <div className="h-px bg-slate-700" />
              </div>
              <DrawerItem to="/gpc" icon={ClipboardList} label="Processos GPC" />
              <DrawerItem to="/gpc/relatorios" icon={BarChart2} label="Relatórios GPC" />
            </>
          )}

          {/* Admin */}
          {isAdmin && (
            <>
              <SectionLabel label="Administração" />
              <DrawerItem to="/usuarios" icon={Users} label="Usuários" />
              <DrawerItem to="/logs" icon={History} label="Auditoria" />
            </>
          )}
        </nav>

        {/* Drawer footer — user info + logout */}
        <div className="border-t border-slate-700 px-4 py-4 flex-shrink-0">
          <Link to="/perfil" className="flex items-center gap-3 group" onClick={() => setDrawerOpen(false)}>
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <UserIcon size={16} className="text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentUser?.name}</p>
              <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
            </div>
            <ShieldCheck size={14} className="text-slate-500 flex-shrink-0" />
          </Link>
          <button
            onClick={() => { setDrawerOpen(false); logout(); }}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-red-600/30 text-slate-300 hover:text-red-400 text-sm font-medium transition-colors border border-slate-700"
          >
            <LogOut size={15} />Sair da conta
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6">
        <div className="max-w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
