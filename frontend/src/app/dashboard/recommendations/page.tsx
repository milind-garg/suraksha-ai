'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth-store';
import { useRecommendationStore } from '@/store/recommendation-store';
import { RecommendationList } from '@/components/recommendations/RecommendationList';
import { PeerComparisonWidget } from '@/components/recommendations/PeerComparisonWidget';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function RecommendationsPage() {
  const { token } = useAuthStore();
  const {
    profile,
    recommendations,
    peerMetrics,
    isLoading,
    error,
    isProfileComplete,
    setIsLoading,
    setError,
    setRecommendations,
    setPeerMetrics,
  } = useRecommendationStore();

  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);

  useEffect(() => {
    if (recommendations) {
      setHasGeneratedOnce(true);
    }
  }, [recommendations]);

  const handleGenerateRecommendations = async () => {
    if (!isProfileComplete()) {
      setError('Please complete your profile first');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Generate recommendations
      const recResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recommendations/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!recResponse.ok) throw new Error('Failed to generate recommendations');

      const recData = await recResponse.json();
      setRecommendations(recData.data);

      // Get peer comparison
      const peerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/recommendations/peer-comparison`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (peerResponse.ok) {
        const peerData = await peerResponse.json();
        setPeerMetrics(peerData.data);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isProfileComplete() && !hasGeneratedOnce) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Policy Recommendations</h1>
          <p className="text-gray-600 mt-2">Get personalized insurance recommendations for you</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete your profile first to get personalized recommendations.
            <Link href="/dashboard/profile" className="ml-2 font-semibold underline hover:no-underline">
              Go to Profile
            </Link>
          </AlertDescription>
        </Alert>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Build Your Recommendation Profile</CardTitle>
            <CardDescription>
              We'll analyze your personal, financial, and occupational information to provide targeted recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Personal: Age, family size, dependents</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Financial: Income, expenses, savings</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Occupation: Job title, industry, risk level</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Lifestyle: Health, exercise, goals</span>
              </li>
            </ul>
            <Button className="mt-6" asChild>
              <Link href="/dashboard/profile">Complete Your Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Policy Recommendations</h1>
        <p className="text-gray-600 mt-2">Personalized recommendations based on your profile and peer comparison</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generate Button */}
      {!hasGeneratedOnce && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Get Recommendations?</CardTitle>
            <CardDescription>
              Click below to analyze your profile and generate personalized policy recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateRecommendations} disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Peer Comparison */}
      {peerMetrics && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Peer Comparison Insights</h2>
          <PeerComparisonWidget {...peerMetrics} />
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Your Recommendations</h2>
              <p className="text-sm text-gray-600 mt-1">
                Overall Risk Score: <span className="font-bold text-lg">{recommendations.overallRiskScore}/100</span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleGenerateRecommendations}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Risk Assessment */}
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800">{recommendations.riskAssessment}</p>
              <p className="text-sm text-gray-600 mt-3">
                <span className="font-semibold">Next Steps:</span> {recommendations.actionNextSteps}
              </p>
            </CardContent>
          </Card>

          {/* Recommendations List */}
          <RecommendationList
            recommendations={recommendations.recommendations}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* CTA */}
      {recommendations && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              Ready to take action on these recommendations?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Use Suraksha AI to upload your existing policies and compare them with these recommendations.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/dashboard/upload">Upload Your Policies</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/gap-analysis">View Gap Analysis</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
