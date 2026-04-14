"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePolicyStore } from "@/store/policy-store";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  TrendingUp,
  Brain,
  ArrowRight,
  IndianRupee,
  Star,
  ChevronRight,
  Info,
  Lightbulb,
} from "lucide-react";

// ── Indian Insurance Standards ─────────────────────────
const RECOMMENDED_COVERAGE = [
  {
    type: "health",
    icon: "🏥",
    label: "Health Insurance",
    labelHindi: "स्वास्थ्य बीमा",
    minCoverage: 500000,
    idealCoverage: 1000000,
    reason: "Medical inflation in India is 14% annually",
    reasonHindi: "भारत में चिकित्सा महंगाई 14% सालाना है",
    critical: true,
  },
  {
    type: "life",
    icon: "💚",
    label: "Life Insurance",
    labelHindi: "जीवन बीमा",
    minCoverage: 5000000,
    idealCoverage: 10000000,
    reason: "Should be 10x your annual income",
    reasonHindi: "वार्षिक आय का 10 गुना होना चाहिए",
    critical: true,
  },
  {
    type: "vehicle",
    icon: "🚗",
    label: "Vehicle Insurance",
    labelHindi: "वाहन बीमा",
    minCoverage: 100000,
    idealCoverage: 500000,
    reason: "Comprehensive cover protects against all damages",
    reasonHindi: "व्यापक कवर सभी नुकसान से बचाता है",
    critical: false,
  },
  {
    type: "home",
    icon: "🏠",
    label: "Home Insurance",
    labelHindi: "गृह बीमा",
    minCoverage: 1000000,
    idealCoverage: 5000000,
    reason: "Most Indian families lack home insurance",
    reasonHindi: "अधिकांश भारतीय परिवारों के पास गृह बीमा नहीं है",
    critical: false,
  },
  {
    type: "travel",
    icon: "✈️",
    label: "Travel Insurance",
    labelHindi: "यात्रा बीमा",
    minCoverage: 500000,
    idealCoverage: 2000000,
    reason: "Essential for international travel",
    reasonHindi: "अंतर्राष्ट्रीय यात्रा के लिए जरूरी",
    critical: false,
  },
];

interface GapItem {
  type: string;
  icon: string;
  label: string;
  labelHindi: string;
  status: "good" | "low" | "missing";
  currentCoverage: number;
  recommendedCoverage: number;
  gap: number;
  gapPercent: number;
  critical: boolean;
  reason: string;
  reasonHindi: string;
  policies: string[];
}

interface AnalysisResult {
  overallScore: number;
  totalCurrentCoverage: number;
  totalRecommendedCoverage: number;
  gaps: GapItem[];
  criticalGaps: GapItem[];
  topRecommendations: string[];
  topRecommendationsHindi: string[];
}

export default function GapAnalysisPage() {
  const router = useRouter();
  const { policies } = usePolicyStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "details" | "recommendations"
  >("overview");

  const runGapAnalysis = async () => {
    setIsAnalyzing(true);
    await new Promise((r) => setTimeout(r, 2000));

    const gaps: GapItem[] = RECOMMENDED_COVERAGE.map((rec) => {
      // Find matching policies
      const matchingPolicies = policies.filter(
        (p) => p.policyType === rec.type,
      );
      const currentCoverage = matchingPolicies.reduce(
        (sum, p) => sum + (p.sumInsured || 0),
        0,
      );
      const policyNames = matchingPolicies.map((p) => p.policyName);

      let status: "good" | "low" | "missing";
      if (currentCoverage === 0) {
        status = "missing";
      } else if (currentCoverage < rec.minCoverage) {
        status = "low";
      } else {
        status = "good";
      }

      const gap = Math.max(0, rec.idealCoverage - currentCoverage);
      const gapPercent = Math.min(
        100,
        Math.round((currentCoverage / rec.idealCoverage) * 100),
      );

      return {
        type: rec.type,
        icon: rec.icon,
        label: rec.label,
        labelHindi: rec.labelHindi,
        status,
        currentCoverage,
        recommendedCoverage: rec.idealCoverage,
        gap,
        gapPercent,
        critical: rec.critical,
        reason: rec.reason,
        reasonHindi: rec.reasonHindi,
        policies: policyNames,
      };
    });

    const criticalGaps = gaps.filter((g) => g.status !== "good" && g.critical);
    const goodCount = gaps.filter((g) => g.status === "good").length;
    const overallScore = gaps.length > 0 ? Math.round((goodCount / gaps.length) * 100) : 0;

    const totalCurrentCoverage = gaps.reduce(
      (sum, g) => sum + g.currentCoverage,
      0,
    );
    const totalRecommendedCoverage = gaps.reduce(
      (sum, g) => sum + g.recommendedCoverage,
      0,
    );

    const topRecommendations: string[] = [];
    const topRecommendationsHindi: string[] = [];

    if (gaps.find((g) => g.type === "health" && g.status !== "good")) {
      topRecommendations.push(
        "Get health insurance immediately — medical costs can wipe out savings",
      );
      topRecommendationsHindi.push(
        "तुरंत स्वास्थ्य बीमा लें — चिकित्सा खर्च बचत खत्म कर सकता है",
      );
    }
    if (gaps.find((g) => g.type === "life" && g.status !== "good")) {
      topRecommendations.push(
        "Buy term life insurance — cheapest way to protect your family",
      );
      topRecommendationsHindi.push(
        "टर्म लाइफ इंश्योरेंस खरीदें — परिवार की सुरक्षा का सबसे सस्ता तरीका",
      );
    }
    if (gaps.find((g) => g.type === "health" && g.status === "low")) {
      topRecommendations.push(
        "Increase health cover — add a super top-up plan for low premium",
      );
      topRecommendationsHindi.push(
        "स्वास्थ्य कवर बढ़ाएं — कम प्रीमियम पर सुपर टॉप-अप प्लान लें",
      );
    }
    topRecommendations.push(
      "Review all policies annually at renewal for better terms",
    );
    topRecommendationsHindi.push(
      "बेहतर शर्तों के लिए नवीनीकरण पर सभी पॉलिसियों की सालाना समीक्षा करें",
    );

    setResult({
      overallScore,
      totalCurrentCoverage,
      totalRecommendedCoverage,
      gaps,
      criticalGaps,
      topRecommendations,
      topRecommendationsHindi,
    });

    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (policies.length > 0) {
      runGapAnalysis();
    }
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { en: "Well Protected", hi: "अच्छी तरह सुरक्षित" };
    if (score >= 60)
      return { en: "Moderately Protected", hi: "मध्यम सुरक्षित" };
    if (score >= 40)
      return { en: "Partially Protected", hi: "आंशिक रूप से सुरक्षित" };
    return { en: "At Risk", hi: "खतरे में" };
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Coverage Gap Analysis"
        titleHindi="कवरेज गैप विश्लेषण"
        description="AI-powered comparison of your coverage vs recommended standards"
      />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* No Policies State */}
        {policies.length === 0 && !isAnalyzing && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Policies to Analyze
              </h3>
              <p className="text-blue-600 hindi-text mb-4">
                विश्लेषण के लिए कोई पॉलिसी नहीं है
              </p>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Upload at least one insurance policy to see your coverage gaps
                and get personalized recommendations.
              </p>
              <Button
                onClick={() => router.push("/dashboard/upload")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Upload a Policy First
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Brain className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Analyzing Your Coverage...
              </h3>
              <p className="text-blue-600 hindi-text mb-6">
                आपकी कवरेज का विश्लेषण हो रहा है...
              </p>
              <div className="max-w-sm mx-auto space-y-3">
                {[
                  "Scanning all your policies",
                  "Comparing with Indian coverage standards",
                  "Identifying critical gaps",
                  "Generating recommendations",
                ].map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm text-gray-600"
                  >
                    <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                    {step}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && !isAnalyzing && (
          <>
            {/* Overall Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Score */}
              <Card className="border-0 shadow-sm md:col-span-1">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-gray-500 mb-2">
                    Overall Protection Score
                  </p>
                  <p className="text-xs text-blue-500 hindi-text mb-4">
                    समग्र सुरक्षा स्कोर
                  </p>
                  <div
                    className={`text-6xl font-bold ${getScoreColor(result.overallScore)}`}
                  >
                    {result.overallScore}
                  </div>
                  <div className="text-gray-400 text-lg mb-2">/100</div>
                  <div
                    className={`font-semibold ${getScoreColor(result.overallScore)}`}
                  >
                    {getScoreLabel(result.overallScore).en}
                  </div>
                  <div
                    className={`text-sm hindi-text ${getScoreColor(result.overallScore)}`}
                  >
                    {getScoreLabel(result.overallScore).hi}
                  </div>
                  <Progress value={result.overallScore} className="mt-4 h-2" />
                </CardContent>
              </Card>

              {/* Coverage Stats */}
              <Card className="border-0 shadow-sm md:col-span-2">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-green-600" />
                    Coverage Overview / कवरेज अवलोकन
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500">
                        Your Current Coverage
                      </p>
                      <p className="text-xs text-green-600 hindi-text">
                        आपका मौजूदा कवरेज
                      </p>
                      <p className="text-2xl font-bold text-green-700 mt-1">
                        ₹{(result.totalCurrentCoverage / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500">
                        Recommended Coverage
                      </p>
                      <p className="text-xs text-blue-600 hindi-text">
                        अनुशंसित कवरेज
                      </p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">
                        ₹{(result.totalRecommendedCoverage / 100000).toFixed(1)}
                        L
                      </p>
                    </div>
                  </div>

                  {/* Gap Summary */}
                  <div className="flex gap-3">
                    {[
                      {
                        label: "Well Covered",
                        hindi: "अच्छा",
                        count: result.gaps.filter((g) => g.status === "good")
                          .length,
                        color: "bg-green-100 text-green-700",
                      },
                      {
                        label: "Low Coverage",
                        hindi: "कम",
                        count: result.gaps.filter((g) => g.status === "low")
                          .length,
                        color: "bg-yellow-100 text-yellow-700",
                      },
                      {
                        label: "Not Covered",
                        hindi: "नहीं",
                        count: result.gaps.filter((g) => g.status === "missing")
                          .length,
                        color: "bg-red-100 text-red-700",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-xl p-3 text-center ${item.color}`}
                      >
                        <div className="text-2xl font-bold">{item.count}</div>
                        <div className="text-xs font-medium">{item.label}</div>
                        <div className="text-xs hindi-text">{item.hindi}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Critical Alerts */}
            {result.criticalGaps.length > 0 && (
              <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Critical Gaps — Action Required / गंभीर कमियां — तुरंत
                    कार्रवाई जरूरी
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.criticalGaps.map((gap, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-red-50 rounded-xl p-4"
                      >
                        <span className="text-2xl">{gap.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-red-800">
                              {gap.label}
                            </span>
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              {gap.status === "missing"
                                ? "NOT COVERED"
                                : "LOW COVERAGE"}
                            </Badge>
                          </div>
                          <p className="text-sm text-red-700 hindi-text">
                            {gap.labelHindi}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {gap.reason}
                          </p>
                          <p className="text-xs text-orange-600 hindi-text mt-0.5">
                            {gap.reasonHindi}
                          </p>
                          {gap.status === "low" && (
                            <p className="text-sm text-red-600 mt-1 font-medium">
                              Current: ₹
                              {(gap.currentCoverage / 100000).toFixed(1)}L →
                              Need: ₹
                              {(gap.recommendedCoverage / 100000).toFixed(1)}L
                              (Gap: ₹{(gap.gap / 100000).toFixed(1)}L)
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {[
                {
                  key: "overview",
                  label: "Coverage Overview",
                  hindi: "कवरेज अवलोकन",
                },
                {
                  key: "details",
                  label: "Detailed Analysis",
                  hindi: "विस्तृत विश्लेषण",
                },
                {
                  key: "recommendations",
                  label: "Recommendations",
                  hindi: "सिफारिशें",
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div>{tab.label}</div>
                  <div className="text-xs hindi-text opacity-70">
                    {tab.hindi}
                  </div>
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.gaps.map((gap, i) => (
                  <Card
                    key={i}
                    className={`border-0 shadow-sm ${
                      gap.status === "good"
                        ? "bg-green-50"
                        : gap.status === "low"
                          ? "bg-yellow-50"
                          : "bg-red-50"
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{gap.icon}</span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {gap.label}
                            </p>
                            <p className="text-xs text-blue-600 hindi-text">
                              {gap.labelHindi}
                            </p>
                          </div>
                        </div>
                        {gap.status === "good" ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : gap.status === "low" ? (
                          <AlertTriangle className="h-6 w-6 text-yellow-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Coverage</span>
                          <span className="font-medium">
                            {gap.gapPercent}% of recommended
                          </span>
                        </div>
                        <Progress
                          value={gap.gapPercent}
                          className={`h-2 ${
                            gap.status === "good"
                              ? "[&>div]:bg-green-500"
                              : gap.status === "low"
                                ? "[&>div]:bg-yellow-500"
                                : "[&>div]:bg-red-500"
                          }`}
                        />
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">
                            Have:{" "}
                            {gap.currentCoverage > 0
                              ? `₹${(gap.currentCoverage / 100000).toFixed(1)}L`
                              : "Nothing"}
                          </span>
                          <span className="text-blue-600">
                            Need: ₹
                            {(gap.recommendedCoverage / 100000).toFixed(1)}L
                          </span>
                        </div>
                      </div>

                      {gap.policies.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          📋 {gap.policies.join(", ")}
                        </div>
                      )}

                      {gap.critical && gap.status !== "good" && (
                        <Badge className="mt-2 bg-red-100 text-red-700 text-xs">
                          ⚠️ Critical Gap
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Tab: Detailed Analysis */}
            {activeTab === "details" && (
              <div className="space-y-4">
                {result.gaps.map((gap, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">{gap.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {gap.label}
                            </h3>
                            <span className="text-sm hindi-text text-blue-600">
                              {gap.labelHindi}
                            </span>
                            <Badge
                              className={
                                gap.status === "good"
                                  ? "bg-green-100 text-green-700"
                                  : gap.status === "low"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }
                            >
                              {gap.status === "good"
                                ? "Well Covered ✓"
                                : gap.status === "low"
                                  ? "Low Coverage ⚠️"
                                  : "Not Covered ✗"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-500">
                                Your Coverage
                              </p>
                              <p className="font-bold text-gray-900">
                                {gap.currentCoverage > 0
                                  ? `₹${(gap.currentCoverage / 100000).toFixed(1)}L`
                                  : "₹0"}
                              </p>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-2 text-center">
                              <p className="text-xs text-gray-500">
                                Recommended
                              </p>
                              <p className="font-bold text-blue-700">
                                ₹{(gap.recommendedCoverage / 100000).toFixed(1)}
                                L
                              </p>
                            </div>
                            <div
                              className={`rounded-lg p-2 text-center ${
                                gap.gap === 0 ? "bg-green-50" : "bg-red-50"
                              }`}
                            >
                              <p className="text-xs text-gray-500">
                                Gap Amount
                              </p>
                              <p
                                className={`font-bold ${gap.gap === 0 ? "text-green-700" : "text-red-700"}`}
                              >
                                {gap.gap === 0
                                  ? "None!"
                                  : `₹${(gap.gap / 100000).toFixed(1)}L`}
                              </p>
                            </div>
                          </div>

                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-sm text-gray-700 flex items-start gap-2">
                              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              {gap.reason}
                            </p>
                            <p className="text-xs text-blue-600 hindi-text mt-1 ml-6">
                              {gap.reasonHindi}
                            </p>
                          </div>

                          {gap.policies.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">
                                Your policies in this category:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {gap.policies.map((name, j) => (
                                  <Badge
                                    key={j}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Tab: Recommendations */}
            {activeTab === "recommendations" && (
              <div className="space-y-4">
                {/* Priority Recommendations */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Priority Actions / प्राथमिकता कार्य
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.topRecommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex gap-3 p-3 bg-yellow-50 rounded-xl"
                        >
                          <div className="w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm text-gray-800">{rec}</p>
                            {result.topRecommendationsHindi[i] && (
                              <p className="text-xs text-orange-600 hindi-text mt-0.5">
                                {result.topRecommendationsHindi[i]}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Insurance Buying Guide */}
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-5 w-5 text-blue-500" />
                      Smart Insurance Tips / स्मार्ट बीमा सुझाव
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          icon: "💡",
                          tip: "Buy term insurance online — 30-40% cheaper than offline",
                          hindi:
                            "ऑनलाइन टर्म इंश्योरेंस खरीदें — ऑफलाइन से 30-40% सस्ता",
                        },
                        {
                          icon: "📅",
                          tip: "Buy health insurance young — premiums are lower and fewer exclusions",
                          hindi:
                            "युवावस्था में स्वास्थ्य बीमा लें — प्रीमियम कम और अपवाद कम",
                        },
                        {
                          icon: "👨‍👩‍👧‍👦",
                          tip: "Family floater health plan covers entire family at lower cost",
                          hindi:
                            "फैमिली फ्लोटर प्लान पूरे परिवार को कम लागत पर कवर करता है",
                        },
                        {
                          icon: "📈",
                          tip: "Review and increase sum insured every 2-3 years for inflation",
                          hindi:
                            "महंगाई के लिए हर 2-3 साल में बीमा राशि बढ़ाएं",
                        },
                        {
                          icon: "🔄",
                          tip: "Port your health insurance to a better insurer without losing benefits",
                          hindi:
                            "लाभ खोए बिना बेहतर बीमाकर्ता के पास स्वास्थ्य बीमा पोर्ट करें",
                        },
                        {
                          icon: "📋",
                          tip: "Always disclose pre-existing conditions to avoid claim rejection",
                          hindi:
                            "क्लेम अस्वीकृति से बचने के लिए हमेशा पहले से मौजूद बीमारी बताएं",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex gap-3 p-3 bg-blue-50 rounded-xl"
                        >
                          <span className="text-xl flex-shrink-0">
                            {item.icon}
                          </span>
                          <div>
                            <p className="text-sm text-gray-800">{item.tip}</p>
                            <p className="text-xs text-blue-600 hindi-text mt-0.5">
                              {item.hindi}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Re-analyze Button */}
                <div className="text-center">
                  <Button
                    onClick={runGapAnalysis}
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    Re-run Analysis / दोबारा विश्लेषण
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
