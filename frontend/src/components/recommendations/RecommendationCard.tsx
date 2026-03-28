'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface RecommendationCardProps {
  type: 'New Policy' | 'Coverage Enhancement' | 'Risk Mitigation' | 'Peer Comparison';
  priority: 'High' | 'Medium' | 'Low';
  category: string;
  title: string;
  description: string;
  suggestedCoverage: string;
  estimatedPremium: string;
  relevanceForIndians: string;
}

export function RecommendationCard({
  type,
  priority,
  category,
  title,
  description,
  suggestedCoverage,
  estimatedPremium,
  relevanceForIndians,
}: RecommendationCardProps) {
  const priorityColors = {
    High: 'bg-red-100 border-red-300 text-red-800',
    Medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    Low: 'bg-blue-100 border-blue-300 text-blue-800',
  };

  const priorityIcons = {
    High: <AlertCircle className="w-5 h-5" />,
    Medium: <AlertTriangle className="w-5 h-5" />,
    Low: <Info className="w-5 h-5" />,
  };

  const typeIcons: { [key: string]: React.ReactNode } = {
    'New Policy': <CheckCircle className="w-5 h-5 text-green-600" />,
    'Coverage Enhancement': <AlertTriangle className="w-5 h-5 text-blue-600" />,
    'Risk Mitigation': <AlertCircle className="w-5 h-5 text-orange-600" />,
    'Peer Comparison': <Info className="w-5 h-5 text-purple-600" />,
  };

  return (
    <Card
      className={`border-2 ${priorityColors[priority]}`}
    >
      <CardContent className="pt-6 space-y-4">
        {/* Header with type and priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">{typeIcons[type]}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{title}</h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="secondary">{category.toUpperCase()}</Badge>
                <Badge variant="outline">{type}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {priorityIcons[priority]}
            <Badge variant="outline">{priority}</Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700">{description}</p>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Suggested Coverage</p>
            <p className="text-sm font-semibold mt-1">{suggestedCoverage}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold">Est. Premium</p>
            <p className="text-sm font-semibold mt-1">{estimatedPremium}/year</p>
          </div>
        </div>

        {/* Relevance section */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Why This Matters for You</p>
          <p className="text-sm text-gray-700">{relevanceForIndians}</p>
        </div>
      </CardContent>
    </Card>
  );
}
