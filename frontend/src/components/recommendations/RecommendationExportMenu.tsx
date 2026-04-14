'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRecommendationStore } from '@/store/recommendation-store'
import {
  Download,
  Share2,
  Printer,
  FileJson,
  FileText,
  Mail,
  Loader,
} from 'lucide-react'
import {
  exportRecommendationsToPDF,
  exportRecommendationsAsJSON,
  exportRecommendationsAsCSV,
  shareRecommendationsViaEmail,
  printRecommendations,
  generateRecommendationSummary,
} from '@/lib/pdf-export'

export function RecommendationExportMenu() {
  const { recommendations } = useRecommendationStore()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  if (!recommendations || recommendations.recommendations.length === 0) {
    return null
  }

  const handlePDFExport = async () => {
    setIsExporting(true)
    try {
      await exportRecommendationsToPDF({
        filename: `suraksha-recommendations-${new Date().toISOString().split('T')[0]}.pdf`,
      })
      toast({
        title: 'Success',
        description: 'Recommendations exported as PDF',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export PDF',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleJSONExport = () => {
    try {
      exportRecommendationsAsJSON(
        {
          generatedAt: new Date().toISOString(),
          recommendations: recommendations.recommendations,
          summary: generateRecommendationSummary(recommendations.recommendations),
        },
        `suraksha-recommendations-${new Date().toISOString().split('T')[0]}.json`
      )
      toast({
        title: 'Success',
        description: 'Recommendations exported as JSON',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export JSON',
        variant: 'destructive',
      })
    }
  }

  const handleCSVExport = () => {
    try {
      exportRecommendationsAsCSV(
        recommendations.recommendations,
        `suraksha-recommendations-${new Date().toISOString().split('T')[0]}.csv`
      )
      toast({
        title: 'Success',
        description: 'Recommendations exported as CSV',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export CSV',
        variant: 'destructive',
      })
    }
  }

  const handlePrint = () => {
    try {
      printRecommendations()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to print',
        variant: 'destructive',
      })
    }
  }

  const handleEmailShare = () => {
    try {
      shareRecommendationsViaEmail()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to share',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={handlePDFExport}
        disabled={isExporting}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {isExporting ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isExporting ? 'Exporting...' : 'Export PDF'}
      </Button>

      <Button
        onClick={handleJSONExport}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <FileJson className="h-4 w-4" />
        JSON
      </Button>

      <Button
        onClick={handleCSVExport}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        CSV
      </Button>

      <Button
        onClick={handlePrint}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Printer className="h-4 w-4" />
        Print
      </Button>

      <Button
        onClick={handleEmailShare}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Mail className="h-4 w-4" />
        Email
      </Button>
    </div>
  )
}
