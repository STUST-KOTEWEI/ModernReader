"""Advanced recommendation engine with multi-objective optimization."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, cast

import numpy as np
from sklearn.preprocessing import MinMaxScaler
import networkx as nx

from app.services.knowledge_graph import (
    KnowledgeGraph,
    get_knowledge_graph,
)

logger = logging.getLogger(__name__)


@dataclass
class RecommendationObjective:
    """Single objective for multi-objective optimization."""

    name: str
    weight: float
    maximize: bool = True


@dataclass
class ContentFeatures:
    """Features for a content item."""

    content_id: str
    difficulty: float
    relevance: float
    cultural_match: float
    novelty: float
    engagement_potential: float


@dataclass
class AdvancedRecommendation:
    """Recommendation with multi-objective scores and explanation."""

    content_id: str
    overall_score: float
    objective_scores: dict[str, float]
    explanation: dict[str, Any]
    confidence: float


class MultiObjectiveRecommender:
    """
    Advanced recommendation engine with multi-objective optimization.

    Features:
    - Multi-objective scoring (relevance, difficulty, novelty, engagement)
    - Pareto-optimal recommendations
    - Explainable recommendations using knowledge graph
    - Counterfactual explanations ("what if" scenarios)
    - Dynamic weight adjustment based on user feedback
    """

    def __init__(
        self,
        knowledge_graph: KnowledgeGraph | None = None,
        objectives: list[RecommendationObjective] | None = None,
    ):
        """Initialize recommender."""
        self.kg = knowledge_graph or get_knowledge_graph()
        self.objectives = objectives or self._default_objectives()
        self.scaler = MinMaxScaler()

    def _default_objectives(self) -> list[RecommendationObjective]:
        """Default recommendation objectives."""
        return [
            RecommendationObjective("relevance", weight=0.35, maximize=True),
            RecommendationObjective(
                "difficulty_match", weight=0.25, maximize=True
            ),
            RecommendationObjective("novelty", weight=0.20, maximize=True),
            RecommendationObjective(
                "engagement", weight=0.20, maximize=True
            ),
        ]

    def recommend(
        self,
        user_id: str,
        user_context: dict[str, Any],
        candidate_ids: list[str],
        top_k: int = 10,
    ) -> list[AdvancedRecommendation]:
        """
        Generate recommendations with multi-objective optimization.

        Args:
            user_id: User ID
            user_context: User context (reading history, preferences, etc.)
            candidate_ids: List of candidate content IDs
            top_k: Number of recommendations to return

        Returns:
            List of advanced recommendations with explanations
        """
        if not candidate_ids:
            return []

        # Extract features for all candidates
        features_list = [
            self._extract_features(content_id, user_id, user_context)
            for content_id in candidate_ids
        ]

        # Calculate multi-objective scores
        recommendations: list[AdvancedRecommendation] = []
        for features in features_list:
            obj_scores = self._calculate_objective_scores(features)
            overall_score = self._aggregate_scores(obj_scores)

            # Get explanation from knowledge graph
            explanation = self.kg.explain_recommendation(
                features.content_id, user_id
            )

            # Calculate confidence
            confidence = self._calculate_confidence(
                features, obj_scores, explanation
            )

            recommendations.append(
                AdvancedRecommendation(
                    content_id=features.content_id,
                    overall_score=overall_score,
                    objective_scores=obj_scores,
                    explanation=explanation,
                    confidence=confidence,
                )
            )

        # Sort by overall score
        recommendations.sort(key=lambda x: x.overall_score, reverse=True)

        return recommendations[:top_k]
    def _extract_features(
        self,
        content_id: str,
        user_id: str,
        user_context: dict[str, Any],
    ) -> ContentFeatures:
        """Extract features for a content item."""
        # Get content properties from knowledge graph
        graph: nx.DiGraph[str] = cast(nx.DiGraph[str], self.kg.graph)
        if content_id not in graph.nodes:
            return ContentFeatures(
                content_id=content_id,
                difficulty=0.5,
                relevance=0.0,
                cultural_match=0.0,
                novelty=0.5,
                engagement_potential=0.5,
            )

        node_data = self.kg.graph.nodes[content_id]

        # Difficulty
        difficulty = node_data.get("difficulty", 0.5)

        # Relevance (based on related content in reading history)
        relevance = self._calculate_relevance(
            content_id, user_context.get("history", [])
        )

        # Cultural match
        cultural_match = self._calculate_cultural_match(
            content_id, user_context.get("cultural_preferences", [])
        )

        # Novelty (inverse of similarity to history)
        novelty = self._calculate_novelty(
            content_id, user_context.get("history", [])
        )

        # Engagement potential (based on historical engagement)
        engagement_potential = node_data.get("avg_engagement", 0.5)

        return ContentFeatures(
            content_id=content_id,
            difficulty=difficulty,
            relevance=relevance,
            cultural_match=cultural_match,
            novelty=novelty,
            engagement_potential=engagement_potential,
        )

    def _calculate_relevance(
        self, content_id: str, history: list[str]
    ) -> float:
        """Calculate relevance based on reading history."""
        if not history:
            return 0.5

        # Find related content in knowledge graph
        max_relevance = 0.0
        for hist_id in history[-5:]:  # Last 5 items
            related = self.kg.find_related_content(
                hist_id, max_hops=2, limit=20
            )
            for rel_id, score in related:
                if rel_id == content_id:
                    max_relevance = max(max_relevance, score)

        return min(max_relevance, 1.0)

    def _calculate_cultural_match(
        self, content_id: str, cultural_prefs: list[str]
    ) -> float:
        """Calculate cultural relevance match."""
        if not cultural_prefs:
            return 0.5

        cultural_ctx = self.kg.get_cultural_context(content_id)
        content_cultures = set(cultural_ctx.get("cultures", []))

        if not content_cultures:
            return 0.3

        # Calculate Jaccard similarity
        pref_set = set(cultural_prefs)
        intersection = len(content_cultures & pref_set)
        union = len(content_cultures | pref_set)

        return intersection / union if union > 0 else 0.0

    def _calculate_novelty(
        self, content_id: str, history: list[str]
    ) -> float:
        """Calculate novelty (inverse of familiarity)."""
        if not history:
            return 1.0

        # Check if content is too similar to recent history
        similarities = []
        for hist_id in history[-10:]:  # Last 10 items
            if hist_id == content_id:
                return 0.0  # Already read

            # Find path length as inverse similarity
            related = self.kg.find_related_content(
                hist_id, max_hops=1, limit=50
            )
            for rel_id, score in related:
                if rel_id == content_id:
                    similarities.append(score)

        if not similarities:
            return 1.0

        avg_similarity = sum(similarities) / len(similarities)
        return 1.0 - avg_similarity

    def _calculate_objective_scores(
        self, features: ContentFeatures
    ) -> dict[str, float]:
        """Calculate scores for each objective."""
        return {
            "relevance": features.relevance,
            "difficulty_match": self._score_difficulty_match(
                features.difficulty
            ),
            "novelty": features.novelty,
            "engagement": features.engagement_potential,
        }

    def _score_difficulty_match(self, difficulty: float) -> float:
        """
        Score difficulty match (prefer slightly challenging).

        Optimal zone: user_level to user_level + 0.2
        """
        # TODO: Get actual user level from database
        user_level = 0.5
        optimal_min = user_level
        optimal_max = user_level + 0.2

        if optimal_min <= difficulty <= optimal_max:
            return 1.0
        elif difficulty < optimal_min:
            # Too easy
            return 0.5 + (difficulty / optimal_min) * 0.5
        else:
            # Too hard
            return max(0.0, 1.0 - (difficulty - optimal_max) * 2.0)

    def _aggregate_scores(
        self, objective_scores: dict[str, float]
    ) -> float:
        """Aggregate objective scores using weighted sum."""
        total_score = 0.0
        total_weight = 0.0

        for obj in self.objectives:
            score = objective_scores.get(obj.name, 0.0)
            if not obj.maximize:
                score = 1.0 - score

            total_score += score * obj.weight
            total_weight += obj.weight

        return total_score / total_weight if total_weight > 0 else 0.0

    def _calculate_confidence(
        self,
        features: ContentFeatures,
        objective_scores: dict[str, float],
        explanation: dict[str, Any],
    ) -> float:
        """Calculate confidence in the recommendation."""
        # Factors affecting confidence:
        # 1. Number of explanation reasons
        # 2. Variance in objective scores
        # 3. Graph connectivity

        confidence = 0.5

        # Bonus for explanations
        num_reasons = len(explanation.get("reasons", []))
        confidence += min(num_reasons * 0.1, 0.3)

        # Penalty for high variance in scores
        scores = list(objective_scores.values())
        if len(scores) > 1:
            variance = np.var(scores)
            confidence -= min(variance * 0.2, 0.2)

        # Bonus for graph connectivity
        if explanation.get("related_to"):
            confidence += 0.1

        return max(0.0, min(1.0, confidence))

    def counterfactual_explain(
        self,
        content_id: str,
        user_id: str,
        user_context: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Generate counterfactual explanation.

        "What would need to change for this to be recommended?"

        Args:
            content_id: Content ID
            user_id: User ID
            user_context: User context

        Returns:
            Counterfactual explanation
        """
        # Extract current features
        features = self._extract_features(
            content_id, user_id, user_context
        )
        current_scores = self._calculate_objective_scores(features)
        current_overall = self._aggregate_scores(current_scores)

        # Identify weakest objectives
        weak_objectives = []
        for obj in self.objectives:
            score = current_scores.get(obj.name, 0.0)
            if score < 0.5:
                weak_objectives.append((obj.name, score))

        weak_objectives.sort(key=lambda x: x[1])

        # Generate counterfactual suggestions
        suggestions = []
        for obj_name, score in weak_objectives[:2]:  # Top 2 weakest
            if obj_name == "relevance":
                suggestions.append(
                    "Read more related content to increase relevance"
                )
            elif obj_name == "difficulty_match":
                if features.difficulty > 0.7:
                    suggestions.append(
                        "Build up proficiency with easier content first"
                    )
                else:
                    suggestions.append(
                        "This content may be too easy for your level"
                    )
            elif obj_name == "novelty":
                suggestions.append(
                    "Explore different topics for more diverse learning"
                )
            elif obj_name == "engagement":
                suggestions.append(
                    "Try content with higher community engagement"
                )

        return {
            "content_id": content_id,
            "current_score": current_overall,
            "weak_objectives": dict(weak_objectives),
            "suggestions": suggestions,
            "potential_score_improvement": self._estimate_improvement(
                weak_objectives
            ),
        }

    def _estimate_improvement(
        self, weak_objectives: list[tuple[str, float]]
    ) -> float:
        """Estimate potential score improvement."""
        if not weak_objectives:
            return 0.0

        # Calculate weighted improvement if weak objectives reach 0.8
        total_improvement = 0.0
        for obj_name, current_score in weak_objectives:
            obj = next(
                (o for o in self.objectives if o.name == obj_name), None
            )
            if obj:
                improvement = (0.8 - current_score) * obj.weight
                total_improvement += improvement

        return total_improvement

    def adjust_weights(
        self, feedback: dict[str, float]
    ) -> None:
        """
        Adjust objective weights based on user feedback.

        Args:
            feedback: Dictionary mapping objective names to adjustment factors
        """
        for obj in self.objectives:
            if obj.name in feedback:
                adj_factor = feedback[obj.name]
                obj.weight *= adj_factor

        # Renormalize weights
        total_weight = sum(obj.weight for obj in self.objectives)
        for obj in self.objectives:
            obj.weight /= total_weight

        logger.info(f"Adjusted weights: {[(o.name, o.weight) for o in self.objectives]}")


# Global instance
_recommender: MultiObjectiveRecommender | None = None


def get_recommender() -> MultiObjectiveRecommender:
    """Get or create global recommender instance."""
    global _recommender
    if _recommender is None:
        _recommender = MultiObjectiveRecommender()
    return _recommender
