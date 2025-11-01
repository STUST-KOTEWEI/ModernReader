import { useEffect, useState } from "react";

import { recommendationClient } from "../services/api";

interface Recommendation {
  book_id: string;
  title: string;
  rationale: string;
  confidence: number;
}

export const RecommendationPanel = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    recommendationClient
      .getRecommendations({ user_id: "demo-user" })
      .then((response) => setRecommendations(response.recommendations))
      .catch((error) => console.error(error));
  }, []);

  return (
    <section className="panel">
      <h3>Recommended Reads</h3>
      <ul>
        {recommendations.map((item) => (
          <li key={item.book_id}>
            <div className="panel-item">
              <strong>{item.title}</strong>
              <span>{item.rationale}</span>
              <small>Confidence: {(item.confidence * 100).toFixed(0)}%</small>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
