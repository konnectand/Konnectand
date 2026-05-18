'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Monitor,
  Link2,
  Users,
  Building2,
  BarChart3,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser, RoleName } from '@/lib/types'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles: RoleName[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Panel principal',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin_konnectand', 'admin_client', 'operator_konnectand', 'operator_client', 'viewer_client'],
  },
  {
    href: '/portals',
    label: 'Portales',
    icon: Monitor,
    roles: ['super_admin', 'admin_konnectand', 'admin_client', 'operator_konnectand', 'operator_client', 'viewer_client'],
  },
  {
    href: '/pairings',
    label: 'Emparejamientos',
    icon: Link2,
    roles: ['super_admin', 'admin_konnectand', 'admin_client', 'operator_konnectand'],
  },
  {
    href: '/clients',
    label: 'Clientes',
    icon: Building2,
    roles: ['super_admin', 'admin_konnectand'],
  },
  {
    href: '/users',
    label: 'Usuarios',
    icon: Users,
    roles: ['super_admin', 'admin_konnectand', 'admin_client'],
  },
  {
    href: '/analytics',
    label: 'Analitica',
    icon: BarChart3,
    roles: ['super_admin', 'admin_konnectand', 'admin_client', 'operator_konnectand', 'operator_client', 'viewer_client'],
  },
]

const ROLE_LABELS: Record<RoleName, string> = {
  super_admin: 'Super Admin',
  admin_konnectand: 'Admin KonnectAND',
  admin_client: 'Admin Cliente',
  operator_konnectand: 'Operador KonnectAND',
  operator_client: 'Operador Cliente',
  viewer_client: 'Visor Cliente',
}

export function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname()
  const router = useRouter()

  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(user.role))

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <aside className="w-60 h-screen bg-[#0F0F1A] border-r border-[#1A1A2E] flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-[#1A1A2E]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8B7FF5]/20 border border-[#8B7FF5]/25 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <circle cx="7" cy="14" r="5" fill="#8B7FF5" />
              <circle cx="21" cy="14" r="5" fill="#2DD4A8" />
              <path d="M12 14 Q14 8 16 14" stroke="#8B7FF5" strokeWidth="1.5" fill="none" />
              <path d="M12 14 Q14 20 16 14" stroke="#2DD4A8" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">KonnectAND</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Panel de Control</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {visibleItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                active
                  ? 'bg-[#8B7FF5]/15 text-[#8B7FF5]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/4'
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 ${active ? 'text-[#8B7FF5]' : 'text-gray-500 group-hover:text-gray-300'}`}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 text-[#8B7FF5]/60" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-[#1A1A2E] space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#8B7FF5]/20 border border-[#8B7FF5]/25 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-[#8B7FF5]">
              {(user.full_name || user.email).charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white font-medium truncate">
              {user.full_name || user.email}
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/8 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
