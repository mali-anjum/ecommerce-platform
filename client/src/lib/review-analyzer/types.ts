export type ReviewAnalyzerPeriod = "7d" | "30d" | "90d";

export type ReviewComplaintRank = {
  theme: string;
  label: string;
  count: number;
  sharePercent: number;
  changePercent: number | null;
  sampleQuotes: string[];
};

export type ReviewAnalyzerDashboard = {
  period: string;
  range: { start: string; end: string };
  summary: {
    totalReviews: number;
    negativeReviews: number;
    averageRating: number;
    analyzedCount: number;
    reviewsChangePercent: number | null;
  };
  topComplaints: ReviewComplaintRank[];
  trends: Array<{
    date: string;
    negativeCount: number;
    reviewCount: number;
  }>;
  themeGroups: Array<{
    theme: string;
    label: string;
    count: number;
    reviews: Array<{
      id: string;
      rating: number;
      body: string;
      productName: string;
      createdAt: string;
    }>;
  }>;
  reportNarrative: string;
  lastAnalyzedAt: string | null;
};
