import os
import numpy as np
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from rapidfuzz import fuzz

MODEL_DIR = os.environ.get("MODEL_DIR", "/app/ml_models")
MODEL_NAME = "intfloat/multilingual-e5-large"
LOCAL_MODEL_PATH = os.path.join(MODEL_DIR, "multilingual-e5-large")

#минимальна рлевантность
MIN_SCORE = 0.76
#ограничение по результатам
MAX_RESULTS = 20

GAP_CUTOFF = 0.05

EXACT_WORD_THRESHOLD_BONUS = -0.05

def _load_model() -> SentenceTransformer:
    os.makedirs(MODEL_DIR, exist_ok=True)
    if os.path.isdir(LOCAL_MODEL_PATH) and os.listdir(LOCAL_MODEL_PATH):
        print(f"[Search] Загрузка из кэша: {LOCAL_MODEL_PATH}")
        return SentenceTransformer(LOCAL_MODEL_PATH)
    else:
        print(f"[Search] Скачиваю {MODEL_NAME}...")
        model = SentenceTransformer(MODEL_NAME)
        model.save(LOCAL_MODEL_PATH)
        print(f"[Search] Сохранено в {LOCAL_MODEL_PATH}")
        return model

class SemanticSearchEngine:
    def __init__(self):
        self.model: SentenceTransformer = _load_model()
        self._items: List[Dict] = []
        self._embeddings: Optional[np.ndarray] = None
        self._last_count: int = -1

    def _prepare_text(self, item: Dict) -> str:
        parts = [
            f"Название: {item['name']}",
            f"Название: {item['name']}",
        ]
        if item.get("description"):
            parts.append(f"Описание: {item['description']}")
        if item.get("category_name"):
            parts.append(f"Категория: {item['category_name']}")
        return "passage: " + ". ".join(parts)

    def update_index(self, items: List[Dict]):
        current_count = len(items)
        if current_count == self._last_count and self._embeddings is not None:
            return

        print(f"[Search] Пересчёт индекса: {current_count} товаров...")
        self._items = items
        self._last_count = current_count

        if not items:
            self._embeddings = np.array([]).reshape(
                0, self.model.get_sentence_embedding_dimension()
            )
            return

        texts = [self._prepare_text(item) for item in items]
        self._embeddings = self.model.encode(
            texts, convert_to_numpy=True, show_progress_bar=False
        )
        print(f"[Search] Индекс готов: {self._embeddings.shape}")

    def invalidate(self):
        self._last_count = -1
        print("[Search] Индекс инвалидирован.")

    def search(self, query: str) -> List[Dict]:
        if not self._items or self._embeddings is None or self._embeddings.size == 0:
            return []

        query_embedding = self.model.encode(["query: " + query], convert_to_numpy=True)
        similarities = cosine_similarity(query_embedding, self._embeddings).flatten()

        query_lower = query.lower()
        query_words = [w for w in query_lower.split() if len(w) >= 2]

        scored = []
        for i, item in enumerate(self._items):
            score = float(similarities[i])
            item_name_lower = item["name"].lower()

            effective_min = MIN_SCORE
            for word in query_words:
                if word in item_name_lower:
                    effective_min -= 0.05
                    break
                elif fuzz.partial_ratio(word, item_name_lower) > 88:
                    effective_min -= 0.025
                    break

            if score >= effective_min:
                result = item.copy()
                result["search_score"] = round(score, 4)
                scored.append(result)

        scored.sort(key=lambda x: x["search_score"], reverse=True)
        top = scored[:MAX_RESULTS]

        if not top:
            return []

        for i in range(1, len(top)):
            gap = top[i - 1]["search_score"] - top[i]["search_score"]
            if gap >= GAP_CUTOFF:
                top = top[:i]
                break

        top = [r for r in top if r["search_score"] >= MIN_SCORE]

        return top

search_engine = SemanticSearchEngine()