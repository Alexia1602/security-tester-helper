 
export const ChainAnalysisSchema = {
  name: "ChainAnalysis",
  properties: [
    "id",
    "session_id",
    "chain_data", // Structura de noduri și legături SVG
    "critical_intersections",
    "chain_breaker_recommendations",
    "overall_risk_score",
    "summary"
  ],
  required: ["session_id"]
};