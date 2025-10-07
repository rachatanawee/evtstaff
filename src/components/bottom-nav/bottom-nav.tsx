'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Scan, Trophy, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function BottomNav() {
  const pathname = usePathname()
  const locale = pathname.split('/')[1]; // Assuming locale is always the second segment
  const t = useTranslations('BottomNav');

  const navItems = [
    { href: `/${locale}/home`, icon: Home, labelKey: 'Home', color: 'text-blue-500' },
    { href: `/${locale}/register`, icon: Scan, labelKey: 'Register', color: 'text-green-500' }, // Swapped back
    { href: `/${locale}/prize`, icon: Trophy, labelKey: 'Prize', color: 'text-yellow-500' }, // Swapped back
    { href: `/${locale}/profile`, icon: User, labelKey: 'Profile', color: 'text-purple-500' },
  ]

  

  return (
    <nav className="fixed bottom-0 w-full border-t bg-indigo-100">
      <div className="flex justify-around">
        {navItems.map(({ href, icon: Icon, labelKey, color }) => {
          const isActive = pathname.endsWith(href)
          return (
            <Link key={href} href={href} className={`flex flex-col items-center p-2 ${isActive ? 'text-indigo-800' : color}`}>
              <Icon className="h-6 w-6" />
              <span className="text-xs">{t(labelKey)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
