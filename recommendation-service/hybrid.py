from collections import defaultdict


class HybridMerger:
    def merge(
        self,
        cbf_scores: list[dict],
        cf_scores:  list[dict],
        alpha: float = 0.4,     # CBF weight; CF weight = 1 - alpha
    ) -> list[dict]:
        combined: dict[int, dict] = defaultdict(lambda: {"score": 0.0, "reason": "", "material_id": None})

        for item in cbf_scores:
            mid = item["material_id"]
            combined[mid]["material_id"]  = mid
            combined[mid]["score"]       += alpha * item["score"]
            combined[mid]["reason"]       = item.get("reason", "")

        for item in cf_scores:
            mid = item["material_id"]
            combined[mid]["material_id"]  = mid
            combined[mid]["score"]       += (1 - alpha) * item["score"]
            if not combined[mid]["reason"]:
                combined[mid]["reason"] = item.get("reason", "")

        return list(combined.values())
