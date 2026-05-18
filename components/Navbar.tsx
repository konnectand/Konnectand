'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const LOGO_SVG = (
  <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
    <circle cx="7"  cy="14" r="5" fill="#8B7FF5" />
    <circle cx="21" cy="14" r="5" fill="#2DD4A8" />
    <path d="M12 14 Q14 8 16 14"  stroke="#8B7FF5" strokeWidth="1.5" fill="none" />
    <path d="M12 14 Q14 20 16 14" stroke="#2DD4A8" strokeWidth="1.5" fill="none" />
  </svg>
)

const NAV_LINKS = [
  { href: '#nosotros',    label: 'Nosotros' },
  { href: '#experiencias', label: 'Experiencias' },
  { href: '#formatos',    label: 'Formatos' },
  { href: '#andorra',     label: 'Andorra' },
  { href: '#contacto',    label: 'Contacto' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#1A1A2E]/80"
            style={{ background: 'rgba(9,9,15,0.85)', backdropFilter: 'blur(16px)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {LOGO_SVG}
          <span className="text-sm font-bold text-white tracking-tight">KonnectAND</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Acceder CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:block px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: '#8B7FF5' }}
          >
            Acceder
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[#1A1A2E] px-6 py-4 space-y-3"
             style={{ background: 'rgba(9,9,15,0.95)' }}>
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block text-sm text-gray-400 hover:text-white py-1 transition-colors"
            >
              {label}
            </a>
          ))}
          <Link
            href="/login"
            className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium text-white mt-2"
            style={{ background: '#8B7FF5' }}
          >
            Acceder al panel
          </Link>
        </div>
      )}
    </header>
  )
}
