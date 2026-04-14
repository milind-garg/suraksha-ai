'use client'

import { useLanguage } from '@/hooks/use-language'

interface PageHeaderProps {
  title: string
  titleHindi?: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, titleHindi, description, children }: PageHeaderProps) {
  const { isHindi } = useLanguage()
  const displayTitle = isHindi ? (titleHindi || title) : title

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-start">
        <div>
          <h1 className={`text-2xl font-bold text-gray-900 ${isHindi ? 'hindi-text' : ''}`}>
            {displayTitle}
          </h1>
          {description && (
            <p className="text-gray-500 text-sm mt-1">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}