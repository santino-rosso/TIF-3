from sklearn.metrics.pairwise import cosine_similarity


def _recipe_id(recipe):
    return str(recipe.get("_id"))


def _has_embedding(recipe):
    embedding = recipe.get("embedding")
    return embedding is not None and len(embedding) > 0


def score_recipes_by_cosine_similarity(query_embedding, recipes, excluded_ids=None):
    excluded_ids = {str(recipe_id) for recipe_id in (excluded_ids or set())}
    eligible_recipes = [
        recipe
        for recipe in recipes
        if _has_embedding(recipe) and _recipe_id(recipe) not in excluded_ids
    ]
    if not eligible_recipes:
        return []

    embeddings = [recipe["embedding"] for recipe in eligible_recipes]
    similarities = cosine_similarity([query_embedding], embeddings)[0]
    scored_recipes = list(zip(eligible_recipes, similarities))
    return sorted(scored_recipes, key=lambda item: item[1], reverse=True)


def rank_recipes_by_cosine_similarity(query_embedding, recipes, excluded_ids=None, top_k=None):
    scored_recipes = score_recipes_by_cosine_similarity(
        query_embedding,
        recipes,
        excluded_ids=excluded_ids,
    )
    ranked_recipes = [recipe for recipe, _ in scored_recipes]
    if top_k is None:
        return ranked_recipes
    return ranked_recipes[:top_k]


def find_duplicate_recipe(query_embedding, recipes, threshold=0.98):
    scored_recipes = score_recipes_by_cosine_similarity(query_embedding, recipes)
    if not scored_recipes:
        return None

    recipe, similarity = scored_recipes[0]
    if similarity > threshold:
        return recipe
    return None
