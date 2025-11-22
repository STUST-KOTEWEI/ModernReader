"""Knowledge graph for content relationships and reasoning."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import networkx as nx

logger = logging.getLogger(__name__)


@dataclass
class ContentNode:
    """Node representing a content item in the knowledge graph."""

    id: str
    type: str  # book, topic, concept, culture
    properties: dict[str, Any]


@dataclass
class ContentRelation:
    """Edge representing a relationship between content items."""

    source: str
    target: str
    relation_type: str  # prerequisite, related, cultural_context, difficulty
    weight: float = 1.0
    properties: dict[str, Any] | None = None


class KnowledgeGraph:
    """
    Knowledge graph for content relationships and semantic reasoning.

    Features:
    - Multi-hop reasoning for content discovery
    - Cultural context mapping
    - Prerequisite tracking for learning paths
    - Difficulty progression modeling
    """

    def __init__(self):
        """Initialize knowledge graph."""
        self.graph = nx.DiGraph()
        self._node_index: dict[str, ContentNode] = {}

    def add_node(self, node: ContentNode) -> None:
        """Add a content node to the graph."""
        self.graph.add_node(
            node.id,
            node_type=node.type,
            **node.properties,
        )
        self._node_index[node.id] = node
        logger.debug(f"Added node: {node.id} (type: {node.type})")

    def add_relation(self, relation: ContentRelation) -> None:
        """Add a relationship between content items."""
        self.graph.add_edge(
            relation.source,
            relation.target,
            relation_type=relation.relation_type,
            weight=relation.weight,
            **(relation.properties or {}),
        )
        logger.debug(
            f"Added relation: {relation.source} --[{relation.relation_type}]"
            f"--> {relation.target}"
        )

    def find_learning_path(
        self,
        start_id: str,
        end_id: str,
        max_difficulty_jump: float = 0.3,
    ) -> list[str]:
        """
        Find optimal learning path between two content items.

        Args:
            start_id: Starting content ID
            end_id: Target content ID
            max_difficulty_jump: Maximum allowed difficulty increase per step

        Returns:
            List of content IDs forming the learning path
        """
        if start_id not in self.graph or end_id not in self.graph:
            return []

        try:
            # Use shortest path with difficulty constraints
            path = nx.shortest_path(
                self.graph,
                source=start_id,
                target=end_id,
                weight="weight",
            )

            # Filter by difficulty progression
            filtered_path = [path[0]]
            for node_id in path[1:]:
                prev_diff = self.graph.nodes[filtered_path[-1]].get(
                    "difficulty", 0.5
                )
                curr_diff = self.graph.nodes[node_id].get("difficulty", 0.5)

                if curr_diff - prev_diff <= max_difficulty_jump:
                    filtered_path.append(node_id)
                else:
                    logger.warning(
                        f"Skipping {node_id}: difficulty jump too large"
                    )

            return filtered_path

        except nx.NetworkXNoPath:
            logger.warning(f"No path found from {start_id} to {end_id}")
            return []

    def find_related_content(
        self,
        content_id: str,
        relation_types: list[str] | None = None,
        max_hops: int = 2,
        limit: int = 10,
    ) -> list[tuple[str, float]]:
        """
        Find related content using multi-hop graph traversal.

        Args:
            content_id: Source content ID
            relation_types: Filter by relation types (None = all)
            max_hops: Maximum number of hops to explore
            limit: Maximum results to return

        Returns:
            List of (content_id, relevance_score) tuples
        """
        if content_id not in self.graph:
            return []

        related: dict[str, float] = {}

        # BFS traversal with decay
        queue: list[tuple[str, int, float]] = [(content_id, 0, 1.0)]
        visited = {content_id}

        while queue:
            current, hops, score = queue.pop(0)

            if hops >= max_hops:
                continue

            # Explore neighbors
            for neighbor in self.graph.neighbors(current):
                edge_data = self.graph.get_edge_data(current, neighbor)
                rel_type = edge_data.get("relation_type", "")

                # Filter by relation type
                if relation_types and rel_type not in relation_types:
                    continue

                # Calculate decayed score
                edge_weight = edge_data.get("weight", 1.0)
                new_score = score * edge_weight * (0.7 ** (hops + 1))

                # Update or add to related
                if (
                    neighbor not in related
                    or new_score > related[neighbor]
                ):
                    related[neighbor] = new_score

                # Add to queue if not visited
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, hops + 1, new_score))

        # Sort by score and limit
        sorted_related = sorted(
            related.items(), key=lambda x: x[1], reverse=True
        )
        return sorted_related[:limit]

    def get_cultural_context(
        self, content_id: str
    ) -> dict[str, Any]:
        """
        Get cultural context for a content item.

        Args:
            content_id: Content ID

        Returns:
            Dictionary with cultural context information
        """
        if content_id not in self.graph:
            return {}

        # Find all cultural_context relations
        context: dict[str, Any] = {
            "cultures": [],
            "languages": [],
            "traditions": [],
            "historical_period": None,
        }

        for neighbor in self.graph.neighbors(content_id):
            edge_data = self.graph.get_edge_data(content_id, neighbor)

            if edge_data.get("relation_type") == "cultural_context":
                node_data = self.graph.nodes[neighbor]
                node_type = node_data.get("node_type", "")

                if node_type == "culture":
                    context["cultures"].append(node_data.get("name"))
                elif node_type == "language":
                    context["languages"].append(node_data.get("name"))
                elif node_type == "tradition":
                    context["traditions"].append(node_data.get("name"))

        return context

    def explain_recommendation(
        self, content_id: str, user_id: str
    ) -> dict[str, Any]:
        """
        Generate explainable reasoning for why content was recommended.

        Args:
            content_id: Recommended content ID
            user_id: User ID

        Returns:
            Dictionary with explanation components
        """
        explanation: dict[str, Any] = {
            "content_id": content_id,
            "reasons": [],
            "related_to": [],
            "cultural_relevance": [],
            "difficulty_match": None,
        }

        if content_id not in self.graph:
            return explanation

        # Find paths from user's previous content
        user_history_ids = self._get_user_history(user_id)

        for hist_id in user_history_ids[:3]:  # Top 3 recent items
            if hist_id in self.graph:
                try:
                    path = nx.shortest_path(
                        self.graph, source=hist_id, target=content_id
                    )
                    if len(path) <= 3:
                        explanation["related_to"].append(
                            {
                                "content": hist_id,
                                "path_length": len(path) - 1,
                            }
                        )
                except nx.NetworkXNoPath:
                    continue

        # Cultural relevance
        cultural_ctx = self.get_cultural_context(content_id)
        if cultural_ctx.get("cultures"):
            explanation["cultural_relevance"] = cultural_ctx["cultures"]

        # Difficulty match
        content_difficulty = self.graph.nodes[content_id].get(
            "difficulty", 0.5
        )
        user_level = self._get_user_level(user_id)
        diff_delta = abs(content_difficulty - user_level)

        if diff_delta < 0.1:
            explanation["difficulty_match"] = "perfect"
        elif diff_delta < 0.2:
            explanation["difficulty_match"] = "good"
        else:
            explanation["difficulty_match"] = "challenging"

        # Generate reason text
        if explanation["related_to"]:
            explanation["reasons"].append(
                f"Related to {len(explanation['related_to'])} items "
                "you've read"
            )

        if explanation["cultural_relevance"]:
            explanation["reasons"].append(
                "Relevant to "
                + ", ".join(explanation["cultural_relevance"]) + " culture"
            )

        if explanation["difficulty_match"] in ["perfect", "good"]:
            explanation["reasons"].append(
                "Difficulty level matches your current proficiency"
            )

        return explanation

    def _get_user_history(self, user_id: str) -> list[str]:
        """Get user's reading history (mock for now)."""
        # TODO: Integrate with database
        return []

    def _get_user_level(self, user_id: str) -> float:
        """Get user's proficiency level (mock for now)."""
        # TODO: Integrate with database
        return 0.5

    def get_statistics(self) -> dict[str, Any]:
        """Get graph statistics."""
        return {
            "num_nodes": self.graph.number_of_nodes(),
            "num_edges": self.graph.number_of_edges(),
            "node_types": self._count_node_types(),
            "relation_types": self._count_relation_types(),
            "average_degree": (self._average_degree()),
        }

    def _average_degree(self) -> float:
        """
        Compute average degree without relying on built-in sum
        (avoids shadowing).
        """
        n = self.graph.number_of_nodes()
        if n == 0:
            return 0.0
        total = 0
        for _, v in self.graph.degree():
            total += int(v)
        return total / n

    def _count_node_types(self) -> dict[str, int]:
        """Count nodes by type."""
        counts: dict[str, int] = {}
        for node_id in self.graph.nodes():
            node_type = self.graph.nodes[node_id].get("node_type", "unknown")
            counts[node_type] = counts.get(node_type, 0) + 1
        return counts

    def _count_relation_types(self) -> dict[str, int]:
        """Count edges by relation type."""
        counts: dict[str, int] = {}
        for source, target in self.graph.edges():
            edge_data = self.graph.get_edge_data(source, target)
            rel_type = edge_data.get("relation_type", "unknown")
            counts[rel_type] = counts.get(rel_type, 0) + 1
        return counts


# Global instance
_graph: KnowledgeGraph | None = None


def get_knowledge_graph() -> KnowledgeGraph:
    """Get or create global knowledge graph instance."""
    global _graph
    if _graph is None:
        _graph = KnowledgeGraph()
        _initialize_sample_graph(_graph)
    return _graph


def _initialize_sample_graph(graph: KnowledgeGraph) -> None:
    """Initialize graph with sample data."""
    # Sample books
    books = [
        ContentNode(
            "book_001",
            "book",
            {
                "title": "Seediq Legends",
                "difficulty": 0.3,
                "language": "Seediq",
            },
        ),
        ContentNode(
            "book_002",
            "book",
            {
                "title": "Amis Traditions",
                "difficulty": 0.5,
                "language": "Amis",
            },
        ),
        ContentNode(
            "book_003",
            "book",
            {
                "title": "Paiwan Stories",
                "difficulty": 0.7,
                "language": "Paiwan",
            },
        ),
    ]

    # Sample topics
    topics = [
        ContentNode(
            "topic_001",
            "topic",
            {"name": "Traditional Hunting", "difficulty": 0.4},
        ),
        ContentNode(
            "topic_002",
            "topic",
            {"name": "Tribal Ceremonies", "difficulty": 0.6},
        ),
    ]

    # Sample cultures
    cultures = [
        ContentNode("culture_001", "culture", {"name": "Seediq"}),
        ContentNode("culture_002", "culture", {"name": "Amis"}),
        ContentNode("culture_003", "culture", {"name": "Paiwan"}),
    ]

    # Add nodes
    for node in books + topics + cultures:
        graph.add_node(node)

    # Add relations
    relations = [
        ContentRelation("book_001", "book_002", "prerequisite", 0.8),
        ContentRelation("book_002", "book_003", "prerequisite", 0.9),
        ContentRelation("book_001", "topic_001", "covers", 1.0),
        ContentRelation("book_002", "topic_002", "covers", 1.0),
        ContentRelation("book_001", "culture_001", "cultural_context", 1.0),
        ContentRelation("book_002", "culture_002", "cultural_context", 1.0),
        ContentRelation("book_003", "culture_003", "cultural_context", 1.0),
        ContentRelation("topic_001", "topic_002", "related", 0.6),
    ]

    for relation in relations:
        graph.add_relation(relation)

    logger.info("Sample knowledge graph initialized")
