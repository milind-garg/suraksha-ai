'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRecommendationStore } from '@/store/recommendation-store';
import { AlertCircle, CheckCircle } from 'lucide-react';

function parseIntSafe(value: string): number | undefined {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
}

export function ProfileQuestionnaire() {
  const { profile, updateProfile, setIsLoading, setError, isLoading, error } = useRecommendationStore();
  const [step, setStep] = useState(1);
  const [localProfile, setLocalProfile] = useState(profile || {});
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (field: string, value: string | number | boolean | undefined) => {
    setLocalProfile({ ...localProfile, [field]: value });
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (validateStep(step)) {
      setIsLoading(true);
      setError(null);
      try {
        updateProfile(localProfile);
        // Save to backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('auth_token');

        if (!token) {
          setError('Authentication required. Please log in.');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${apiUrl}/users/profile-questionnaire`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(localProfile),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to save profile (${response.status})`);
        }

        setError(null);
      } catch (err: any) {
        console.error('Profile save error:', err);
        setError(err.message || 'Failed to save profile');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(localProfile.age && localProfile.familySize && localProfile.dependents);
      case 2:
        return !!(localProfile.annualIncome && localProfile.monthlyExpenses && localProfile.savingsAmount);
      case 3:
        return !!(localProfile.jobTitle && localProfile.industry && localProfile.occupationalRisk);
      case 4:
        return !!(localProfile.healthStatus && localProfile.goals && localProfile.retirementAge);
      default:
        return true;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Build Your Recommendation Profile</CardTitle>
        <CardDescription>Step {step} of 4 — Let us know more about you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Personal Information</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Age (years)</label>
              <Input
                type="number"
                min="18"
                max="100"
                value={localProfile.age || ''}
                onChange={(e) => handleInputChange('age', parseIntSafe(e.target.value))}
                placeholder="Enter your age"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Family Size</label>
              <Input
                type="number"
                min="1"
                value={localProfile.familySize || ''}
                onChange={(e) => handleInputChange('familySize', parseIntSafe(e.target.value))}
                placeholder="Total members including you"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Number of Dependents</label>
              <Input
                type="number"
                min="0"
                value={localProfile.dependents || ''}
                onChange={(e) => handleInputChange('dependents', parseIntSafe(e.target.value))}
                placeholder="Children, elderly parents, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Marital Status</label>
              <select
                value={localProfile.maritalStatus || ''}
                onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Financial Info */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Financial Information</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Annual Income (₹)</label>
              <Input
                type="number"
                value={localProfile.annualIncome || ''}
                onChange={(e) => handleInputChange('annualIncome', parseIntSafe(e.target.value))}
                placeholder="Enter annual income"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Monthly Expenses (₹)</label>
              <Input
                type="number"
                value={localProfile.monthlyExpenses || ''}
                onChange={(e) => handleInputChange('monthlyExpenses', parseIntSafe(e.target.value))}
                placeholder="Average monthly expenses"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Savings Amount (₹)</label>
              <Input
                type="number"
                value={localProfile.savingsAmount || ''}
                onChange={(e) => handleInputChange('savingsAmount', parseIntSafe(e.target.value))}
                placeholder="Current savings/emergency fund"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assets (e.g., house, vehicle)</label>
              <Input
                type="text"
                value={localProfile.assets || ''}
                onChange={(e) => handleInputChange('assets', e.target.value)}
                placeholder="Brief description of assets"
              />
            </div>
          </div>
        )}

        {/* Step 3: Occupation Info */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Occupation & Risk</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Job Title</label>
              <Input
                type="text"
                value={localProfile.jobTitle || ''}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="Your current job title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Industry</label>
              <Input
                type="text"
                value={localProfile.industry || ''}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                placeholder="e.g., IT, Finance, Healthcare"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Occupational Risk Level</label>
              <select
                value={localProfile.occupationalRisk || ''}
                onChange={(e) => handleInputChange('occupationalRisk', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select risk level</option>
                <option value="low">Low Risk (Office-based)</option>
                <option value="medium">Medium Risk (Some physical work)</option>
                <option value="high">High Risk (Construction, Mining, etc.)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Travel Frequency</label>
              <select
                value={localProfile.travelFrequency || ''}
                onChange={(e) => handleInputChange('travelFrequency', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select frequency</option>
                <option value="low">Rarely (&lt; once/month)</option>
                <option value="medium">Occasionally (1-4 times/month)</option>
                <option value="high">Frequently (&gt; once/week)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Lifestyle & Goals */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Lifestyle & Goals</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Health Status</label>
              <select
                value={localProfile.healthStatus || ''}
                onChange={(e) => handleInputChange('healthStatus', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select health status</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Do you smoke?</label>
              <select
                value={localProfile.smokingStatus === undefined ? '' : localProfile.smokingStatus ? 'yes' : 'no'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleInputChange('smokingStatus', val === '' ? undefined : val === 'yes');
                }}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select an option</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Exercise Frequency</label>
              <select
                value={localProfile.exerciseFrequency || ''}
                onChange={(e) => handleInputChange('exerciseFrequency', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select frequency</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="rarely">Rarely</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Financial Goals</label>
              <Input
                type="text"
                value={localProfile.goals || ''}
                onChange={(e) => handleInputChange('goals', e.target.value)}
                placeholder="e.g., Buy home in 5 years, fund child education"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Retirement Age</label>
              <Input
                type="number"
                min="40"
                max="80"
                value={localProfile.retirementAge || ''}
                onChange={(e) => handleInputChange('retirementAge', parseIntSafe(e.target.value))}
                placeholder="When do you plan to retire?"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-2 justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={handleNext} disabled={!validateStep(step)}>
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!validateStep(step) || isLoading}
            >
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
