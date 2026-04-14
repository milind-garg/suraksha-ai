'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PeerComparisonWidgetProps {
  yourCoverage: {
    health: number;
    life: number;
    vehicle: number;
    home: number;
    total: number;
  };
  peerBenchmark: {
    avgHealthCoverage: number;
    avgLifeInsurance: number;
    avgVehicleInsurance: number;
    avgHomeInsurance: number;
    percentile: number;
    sampleSize: number;
    isEstimate?: boolean;
  };
  insights: string[];
}

export function PeerComparisonWidget({
  yourCoverage,
  peerBenchmark,
  insights,
}: PeerComparisonWidgetProps) {
  const categories = [
    {
      label: '🏥 Health Insurance',
      your: yourCoverage.health,
      peer: peerBenchmark.avgHealthCoverage,
    },
    {
      label: '💚 Life Insurance',
      your: yourCoverage.life,
      peer: peerBenchmark.avgLifeInsurance,
    },
    {
      label: '🚗 Vehicle Insurance',
      your: yourCoverage.vehicle,
      peer: peerBenchmark.avgVehicleInsurance,
    },
    {
      label: '🏠 Home Insurance',
      your: yourCoverage.home,
      peer: peerBenchmark.avgHomeInsurance,
    },
  ];

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getPercentageDiff = (your: number, peer: number) => {
    if (peer === 0) return 0;
    return Math.round(((your - peer) / peer) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Coverage vs Peers</CardTitle>
        <CardDescription>
          {peerBenchmark.isEstimate
            ? 'Benchmark estimates — not enough peer data yet to compute real averages'
            : `Compared to similar individuals in your age, income, and industry (${peerBenchmark.sampleSize} users)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Percentile */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-100">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Your Coverage Percentile Rank</p>
            <p className="text-4xl font-bold text-purple-600">{peerBenchmark.percentile}%</p>
            <p className="text-xs text-gray-500 mt-2">
              {peerBenchmark.percentile >= 75
                ? "You're in the top 25% for coverage!"
                : peerBenchmark.percentile >= 50
                ? 'Your coverage is in line with the average.'
                : 'Consider increasing your coverage.'}
            </p>
          </div>
        </div>

        {/* Coverage Comparison */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Coverage by Category</h3>
          {categories.map(({ label, your, peer }) => {
            const diff = getPercentageDiff(your, peer);
            const isBetter = your >= peer;

            return (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isBetter ? 'text-green-600' : 'text-orange-600'}`}>
                      {isBetter ? '+' : ''}{diff}%
                    </span>
                    {isBetter ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                </div>

                {/* Bar comparison */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {/* Your coverage */}
                    <div className="flex-1">
                      <div className="bg-blue-100 rounded text-xs text-center py-1 text-blue-600 font-semibold">
                        {formatCurrency(your)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Your Coverage</p>
                    </div>

                    {/* Peer average */}
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded text-xs text-center py-1 text-gray-600 font-semibold">
                        {formatCurrency(peer)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Peer Average</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-lg">Key Insights</h3>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700"
              >
                <div className="flex gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{insight}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total Coverage Summary */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Your Total Coverage</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(yourCoverage.total)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Peer Total Average</p>
              <p className="text-2xl font-bold text-gray-700 mt-1">
                {formatCurrency(
                  peerBenchmark.avgHealthCoverage +
                    peerBenchmark.avgLifeInsurance +
                    peerBenchmark.avgVehicleInsurance +
                    peerBenchmark.avgHomeInsurance
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
