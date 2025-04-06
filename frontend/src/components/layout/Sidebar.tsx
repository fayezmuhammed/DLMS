import { Clock } from 'lucide-react';
import { ComponentType } from 'react';

interface SidebarItem {
  title: string;
  href: string;
  icon?: ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  {
    title: 'Reservations',
    href: '/reservations',
    icon: Clock,
  },
  // Add other navigation items here as needed
];

export function Sidebar() {
  return (
    <nav className="space-y-2">
      {sidebarItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-900 hover:bg-gray-100"
        >
          {item.icon && <item.icon className="h-5 w-5" />}
          <span>{item.title}</span>
        </a>
      ))}
    </nav>
  );
}