'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Shield, LayoutDashboard, FileText, LogOut, Upload, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', labelHindi: 'डैशबोर्ड', icon: LayoutDashboard },
  { href: '/dashboard/upload', label: 'Upload Policy', labelHindi: 'अपलोड', icon: Upload },
  { href: '/dashboard/policies', label: 'My Policies', labelHindi: 'पॉलिसी', icon: FileText },
  { href: '/dashboard/profile', label: 'Profile', labelHindi: 'प्रोफाइल', icon: User },
]

export function DashboardNav() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-400" />
          <div>
            <span className="text-lg font-bold">Suraksha AI</span>
            <p className="text-xs text-gray-400 hindi-text">सुरक्षा AI</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs opacity-70 hindi-text">{item.labelHindi}</div>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout / लॉगआउट
        </Button>
      </div>
    </aside>
  )
}