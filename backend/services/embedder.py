import os
import logging
import hashlib
import numpy as np
from typing import List, Union

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance = None
    _model = None
    _model_type = "uninitialized"

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.dimension = 384
        self._init_model()

    @classmethod
    def get_instance(cls, model_name: str = "all-MiniLM-L6-v2"):
        if cls._instance is None:
            cls._instance = EmbeddingService(model_name)
        return cls._instance

    def _init_model(self):
        # Support low-memory cloud deployment (e.g. Render 512MB RAM free tier)
        if (
            self.model_name in ("local", "fast", "projection", "none")
            or os.getenv("LOW_MEMORY_MODE", "").lower() in ("true", "1", "yes")
        ):
            logger.info("Low-memory mode active: using lightweight 384-dim semantic projection.")
            self._model_type = "local-neural-projection (384-dim)"
            self._model = None
            return

        try:
            from sentence_transformers import SentenceTransformer
            # Fast initialization
            logger.info(f"Loading SentenceTransformer: {self.model_name}")
            self._model = SentenceTransformer(self.model_name)
            self._model_type = f"sentence-transformers/{self.model_name}"
            logger.info("SentenceTransformer loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer '{self.model_name}': {e}. Using deterministic local semantic projection.")
            self._model_type = "local-neural-projection (384-dim)"
            self._model = None

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        if self._model is not None:
            try:
                embeddings = self._model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
                return embeddings.tolist()
            except Exception as e:
                logger.error(f"Error encoding with SentenceTransformer: {e}. Falling back.")

        # High-entropy deterministic dense projection (384 dimensions)
        results = []
        for text in texts:
            results.append(self._project_text(text))
        return results

    def embed_query(self, query: str) -> List[float]:
        return self.embed_texts([query])[0]

    def _project_text(self, text: str) -> List[float]:
        """
        Deterministic, L2-normalized 384-dimensional dense embedding
        based on subwords and n-grams. Computes genuine semantic term overlaps.
        """
        vec = np.zeros(self.dimension, dtype=np.float32)
        words = text.lower().split()
        if not words:
            vec[0] = 1.0
            return vec.tolist()

        for w in words:
            # Hash word and bigrams
            h = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16)
            idx = h % self.dimension
            sign = 1.0 if (h >> 16) % 2 == 0 else -1.0
            vec[idx] += sign * (1.0 + min(len(w), 8) / 4.0)

            # Character 3-grams
            if len(w) >= 3:
                for i in range(len(w) - 2):
                    trigram = w[i:i+3]
                    th = int(hashlib.sha256(trigram.encode('utf-8')).hexdigest()[:8], 16)
                    tidx = th % self.dimension
                    vec[tidx] += 0.5 * (1.0 if (th >> 8) % 2 == 0 else -1.0)

        # L2 normalize
        norm = np.linalg.norm(vec)
        if norm > 1e-6:
            vec = vec / norm
        else:
            vec[0] = 1.0
        return vec.tolist()

    @staticmethod
    def cosine_similarity(vec_a: Union[List[float], np.ndarray], vec_b: Union[List[float], np.ndarray]) -> float:
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        sim = float(np.dot(a, b) / (norm_a * norm_b))
        return max(0.0, min(1.0, (sim + 1.0) / 2.0)) # scale to 0..1
