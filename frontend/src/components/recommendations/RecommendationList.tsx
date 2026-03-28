'use client';

import { useState } from 'react';
import { RecommendationCard } from './RecommendationCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Recommendation } from '@/store/recommendation-store';

interface RecommendationListProps {
  recommendations: Recommendation[];
  isLoading?: boolean;
}

type FilterType = 'All' | 'New Policy' | 'Coverage Enhancement' | 'Risk Mitigation' | 'Peer Comparison';
type PriorityFilter = 'All' | 'High' | 'Medium' | 'Low';

export function RecommendationList({ recommendations, isLoading = false }: RecommendationListProps) {
  const [typeFilter, setTypeFilter] = useState<FilterType>('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('All');

  const typeOptions: FilterType[] = ['All', 'New Policy', 'Coverage Enhancement', 'Risk Mitigation', 'Peer Comparison'];
  const priorityOptions: PriorityFilter[] = ['All', 'High', 'Medium', 'Low'];

  const filtered = recommendations.filter((rec) => {
    const typeMatch = typeFilter === 'All' || rec.type === typeFilter;
    const priorityMatch = priorityFilter === 'All' || rec.priority === priorityFilter;
    return typeMatch && priorityMatch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-gray-600">No recommendations generated yet.</p>
        <p className="text-sm text-gray-500 mt-1">Complete your profile and generate recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Filter by Type</p>
          <div className="flex gap-2 flex-wrap">
            {typeOptions.map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Filter by Priority</p>
          <div className="flex gap-2 flex-wrap">
            {priorityOptions.map((priority) => (
              <Button
                key={priority}
                variant={priorityFilter === priority ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriorityFilter(priority)}
              >
                {priority}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filtered.length} of {recommendations.length} recommendations
      </div>

      {/* Recommendations Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map((rec, idx) => (
            <RecommendationCard key={idx} {...rec} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border">
          <p className="text-gray-600">No recommendations match your filters.</p>
        </div>
      )}
    </div>
  );
}
