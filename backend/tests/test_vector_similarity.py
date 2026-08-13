from app.utils.vector_similarity import (
    find_duplicate_recipe,
    rank_recipes_by_cosine_similarity,
    score_recipes_by_cosine_similarity,
)


def test_rank_recipes_by_cosine_similarity_orders_by_similarity():
    recipes = [
        {"_id": "low", "embedding": [0.0, 1.0]},
        {"_id": "high", "embedding": [1.0, 0.0]},
        {"_id": "medium", "embedding": [0.5, 0.5]},
    ]

    ranked = rank_recipes_by_cosine_similarity([1.0, 0.0], recipes)

    assert [recipe["_id"] for recipe in ranked] == ["high", "medium", "low"]


def test_rank_recipes_by_cosine_similarity_omits_excluded_ids():
    recipes = [
        {"_id": "excluded", "embedding": [1.0, 0.0]},
        {"_id": "included", "embedding": [0.5, 0.5]},
    ]

    ranked = rank_recipes_by_cosine_similarity(
        [1.0, 0.0],
        recipes,
        excluded_ids={"excluded"},
    )

    assert [recipe["_id"] for recipe in ranked] == ["included"]


def test_rank_recipes_by_cosine_similarity_ignores_recipes_without_embeddings():
    recipes = [
        {"_id": "missing"},
        {"_id": "none", "embedding": None},
        {"_id": "empty", "embedding": []},
        {"_id": "valid", "embedding": [1.0, 0.0]},
    ]

    ranked = rank_recipes_by_cosine_similarity([1.0, 0.0], recipes)

    assert [recipe["_id"] for recipe in ranked] == ["valid"]


def test_score_recipes_by_cosine_similarity_returns_ordered_score_pairs():
    recipes = [
        {"_id": "low", "embedding": [0.0, 1.0]},
        {"_id": "high", "embedding": [1.0, 0.0]},
    ]

    scored = score_recipes_by_cosine_similarity([1.0, 0.0], recipes)

    assert [recipe["_id"] for recipe, _ in scored] == ["high", "low"]
    assert scored[0][1] == 1.0


def test_find_duplicate_recipe_uses_threshold():
    duplicate = {"_id": "duplicate", "embedding": [1.0, 0.0]}
    different = {"_id": "different", "embedding": [0.0, 1.0]}

    assert find_duplicate_recipe([1.0, 0.0], [different, duplicate]) == duplicate
    assert find_duplicate_recipe(
        [1.0, 0.0],
        [duplicate],
        threshold=1.0,
    ) is None
