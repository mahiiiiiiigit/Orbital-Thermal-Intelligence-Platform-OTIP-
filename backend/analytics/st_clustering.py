from datetime import datetime

from backend.analytics.spatial import distance_metres


def cluster_hotspots(hotspots, radius_metres=1_000, time_window_days=60):
    unassigned_indexes = set(range(len(hotspots)))
    clusters = []

    while unassigned_indexes:
        seed_index = unassigned_indexes.pop()
        cluster_indexes = {seed_index}
        expanded = True

        # Keep expanding while another nearby record can join this cluster.
        while expanded:
            expanded = False

            for candidate_index in list(unassigned_indexes):
                candidate = hotspots[candidate_index]

                for member_index in cluster_indexes:
                    member = hotspots[member_index]

                    distance = distance_metres(candidate, member)

                    candidate_time = datetime.fromisoformat(candidate["timestamp"])
                    member_time = datetime.fromisoformat(member["timestamp"])
                    time_difference_days = abs(
                        (candidate_time - member_time).days
                    )

                    close_in_space = distance <= radius_metres
                    close_in_time = time_difference_days <= time_window_days

                    if close_in_space and close_in_time:
                        cluster_indexes.add(candidate_index)
                        unassigned_indexes.remove(candidate_index)
                        expanded = True
                        break

        # Ignore tiny groups: they may be noise rather than a real source.
        if len(cluster_indexes) < 3:
            continue

        records = [hotspots[index] for index in cluster_indexes]

        clusters.append(
            {
                "cluster_id": f"st-cluster-{len(clusters) + 1}",
                "detection_count": len(records),
                "center_latitude": round(
                    sum(record["latitude"] for record in records) / len(records),
                    5,
                ),
                "center_longitude": round(
                    sum(record["longitude"] for record in records) / len(records),
                    5,
                ),
                "first_seen": min(record["timestamp"] for record in records),
                "last_seen": max(record["timestamp"] for record in records),
                "classification": records[0]["classification"],
            }
        )

    return clusters