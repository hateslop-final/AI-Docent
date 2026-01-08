from app.db.supabase import supabase
from app.models.artworks import ArtworkModel
from app.models.image_search import ImageSearchResult
from typing import List
import numpy as np
import json

def fetch_artworks_by_exhibition(exhibition_id: int) -> List[ArtworkModel]:
    res = (
        supabase.table("Artworks")
        .select("*")
        .eq("exhibition_id", exhibition_id)
        .execute()
    )
    artworks = []
    for row in res.data:
        if isinstance(row.get("embedding"), str):
            row["embedding"] = json.loads(row["embedding"])

        artworks.append(ArtworkModel(**row))

    return artworks

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def search_similar_artworks_in_exhibition(
    exhibition_id: int,
    query_embedding: list[float],
    top_k: int = 5
) -> list[ImageSearchResult]:

    res = supabase.rpc(
        "search_artworks_by_exhibition",
        {
            "query_embedding": query_embedding,
            "exh_id": exhibition_id,
            "match_count": top_k
        }
    ).execute()

    rows = res.data or []

    results: list[ImageSearchResult] = []

    for r in rows:
        artwork = ArtworkModel(
            id=r["id"],
            exhibition_id=exhibition_id,
            title=r["title"],
            artist=r["artist"],
            description=r.get("description"),
            image_url=r.get("image_url"),
            production_year=r.get("production_year"),
            ingredients=r.get("ingredients"),
            size=r.get("size"),
            management_number=r.get("management_number"),
            is_now=r.get("is_now"),
        )

        results.append(
            ImageSearchResult(
                score=r["score"],
                artwork=artwork
            )
        )

    return results