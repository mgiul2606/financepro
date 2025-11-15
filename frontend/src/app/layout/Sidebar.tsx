import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Target,
  TrendingUp,
  Bot,
  PiggyBank,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Financial',
    items: [
      { label: 'Accounts', href: '/accounts', icon: Wallet },
      { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
      { label: 'Budgets', href: '/budgets', icon: PiggyBank },
      { label: 'Goals', href: '/goals', icon: Target },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Optimization', href: '/optimization', icon: TrendingUp },
      { label: 'AI Assistant', href: '/ai-assistant', icon: Bot },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export interface SidebarProps {
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen bg-neutral-900 text-white transition-all duration-300 border-r border-neutral-800',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">
              FP
            </div>
            <span className="font-bold text-lg">FinancePro</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors ml-auto"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navigationSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            {section.title && !isCollapsed && (
              <div className="px-3 mb-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  {section.title}
                </p>
              </div>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                        'hover:bg-neutral-800',
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-neutral-300 hover:text-white',
                        isCollapsed && 'justify-center'
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={clsx('flex-shrink-0', isCollapsed ? 'h-5 w-5' : 'h-5 w-5')} />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 font-medium text-sm">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500 text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Section / Logout */}
      {onLogout && (
        <div className="border-t border-neutral-800 p-2">
          <button
            onClick={onLogout}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all duration-150',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      )}
    </aside>
  );
};
