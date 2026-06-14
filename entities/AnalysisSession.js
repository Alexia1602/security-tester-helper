 
export const AnalysisSessionSchema = {
  name: "AnalysisSession",
  properties: [
    "id", // Generat automat de backend local
    "name",
    "target_description",
    "language",
    "status", // active, completed, archived
    "code_snippet",
    "code_source",
    "notes",
    "created_at"
  ],
  required: ["name"]
};