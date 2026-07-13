import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { visibleNavSections } from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  /** Invoked when a link is chosen — used to close the mobile drawer. */
  onNavigate?: () => void;
}

/**
 * Primary navigation. Items a role may not access are hidden (usability aid);
 * routes remain guarded and RLS is authoritative.
 */
export function Sidebar({ onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const sections = visibleNavSections(user?.role);

  return (
    <nav className="flex h-full flex-col bg-sidebar" aria-label="Основная навигация">
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-5">
        <Logo />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.key} className="mb-5 last:mb-0">
            {section.label && (
              <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-accent text-primary shadow-soft'
                            : 'text-sidebar-foreground hover:bg-accent/50 hover:text-foreground',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity',
                              isActive ? 'opacity-100' : 'opacity-0',
                            )}
                            aria-hidden
                          />
                          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
