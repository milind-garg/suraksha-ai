/**
 * PDF Generation Utilities for Recommendations
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFExportOptions {
  filename?: string
  orientation?: 'portrait' | 'landscape'
  includeProfileSummary?: boolean
  includePeerComparison?: boolean
}

/**
 * Export recommendations to PDF
 */
export async function exportRecommendationsToPDF(options: PDFExportOptions = {}) {
  const {
    filename = `recommendations-${new Date().toISOString().split('T')[0]}.pdf`,
    orientation = 'portrait',
    includeProfileSummary = true,
    includePeerComparison = true,
  } = options

  try {
    // Get the recommendations container
    const container = document.getElementById('recommendations-export-container')
    if (!container) {
      throw new Error('Recommendations container not found')
    }

    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      logging: false,
      allowTaint: true,
      useCORS: true,
    })

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = orientation === 'portrait' ? 210 : 297
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Add content to PDF
    let yPosition = 10

    // Title
    pdf.setFontSize(24)
    pdf.text('Insurance Recommendations Report', 10, yPosition)
    yPosition += 15

    // Date
    pdf.setFontSize(10)
    pdf.setTextColor(100)
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 10, yPosition)
    yPosition += 10

    // Add image
    pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth - 20, imgHeight - 20)

    // Add page numbers
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(9)
      pdf.setTextColor(150)
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pdf.internal.pageSize.getWidth() / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    // Save/Download
    pdf.save(filename)
    return { success: true, filename }
  } catch (error) {
    console.error('PDF export error:', error)
    throw error
  }
}

/**
 * Export as JSON (for archiving)
 */
export function exportRecommendationsAsJSON(data: any, filename?: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `recommendations-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Export as CSV (for spreadsheet)
 */
export function exportRecommendationsAsCSV(recommendations: any[], filename?: string) {
  const headers = ['Title', 'Type', 'Priority', 'Category', 'Coverage', 'Premium', 'Description']
  const rows = recommendations.map(rec => [
    rec.title,
    rec.type,
    rec.priority,
    rec.category,
    rec.suggestedCoverage,
    rec.estimatedPremium,
    rec.description,
  ])

  const csv =
    [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `recommendations-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Share via email (opens mailto)
 */
export async function shareRecommendationsViaEmail(recipientEmail?: string) {
  const subject = 'My Insurance Recommendations Report'
  const body = `
Hi,

Please find my insurance recommendations report attached.

This report contains personalized policy recommendations based on my profile and existing coverage analysis.

Best regards,
Your Suraksha AI User
  `.trim()

  const mailtoLink = `mailto:${recipientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = mailtoLink
}

/**
 * Print recommendations
 */
export function printRecommendations() {
  const container = document.getElementById('recommendations-export-container')
  if (!container) {
    alert('Nothing to print')
    return
  }

  const printWindow = window.open('', '', 'height=600,width=800')
  if (!printWindow) {
    alert('Please allow popups to print')
    return
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>Insurance Recommendations - Print</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .recommendation { margin-bottom: 20px; page-break-inside: avoid; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        ${container.innerHTML}
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}

/**
 * Generate summary statistics
 */
export function generateRecommendationSummary(recommendations: any[]) {
  return {
    totalRecommendations: recommendations.length,
    byType: recommendations.reduce((acc, rec) => {
      acc[rec.type] = (acc[rec.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byPriority: recommendations.reduce((acc, rec) => {
      acc[rec.priority] = (acc[rec.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    byCategory: recommendations.reduce((acc, rec) => {
      acc[rec.category] = (acc[rec.category] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }
}

/**
 * Calculate total estimated premium
 */
export function calculateTotalPremium(recommendations: any[]) {
  return recommendations.reduce((sum, rec) => {
    const premium = parseInt(rec.estimatedPremium?.replace(/[^0-9]/g, '') || '0')
    return sum + premium
  }, 0)
}
