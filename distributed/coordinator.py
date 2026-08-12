from __future__ import annotations

import os
import signal
import socket
import time
import uuid
from statistics import mean
from typing import Any

from common import JOB_QUEUE, RESULT_KEY_PREFIX, RESULT_QUEUE, SUBTASK_QUEUE, WORKER_HASH, decode, encode, now_ms, redis_client


COORDINATOR_ID = os.getenv("COORDINATOR_ID", f"coordinator-{socket.gethostname()}")
DEFAULT_BOOTSTRAPS = int(os.getenv("CSAKT_BOOTSTRAPS", "1000"))
CHUNK_SIZE = int(os.getenv("CSAKT_CHUNK_SIZE", "100"))
RESULT_TIMEOUT_SECONDS = int(os.getenv("CSAKT_RESULT_TIMEOUT_SECONDS", "120"))
FEDERATED_NODE_IDS = [node.strip() for node in os.getenv("CSAKT_FEDERATED_NODES", "node-skadron-3,node-skadron-31,node-skadron-8,node-wing-1").split(",") if node.strip()]
shutdown = False


def request_shutdown(signum: int, _frame: Any) -> None:
    global shutdown
    shutdown = True
    print(f"[{COORDINATOR_ID}] received signal {signum}; stopping after current job", flush=True)


def heartbeat(status: str, current_task: str = "idle") -> None:
    redis_client().hset(
        WORKER_HASH,
        COORDINATOR_ID,
        encode(
            {
                "worker_id": COORDINATOR_ID,
                "hostname": socket.gethostname(),
                "role": "coordinator",
                "status": status,
                "current_task": current_task,
                "heartbeat_ms": now_ms(),
                "queue": RESULT_QUEUE,
            }
        ),
    )


def normalize_job(raw_job: dict[str, Any]) -> dict[str, Any]:
    job_id = str(raw_job.get("job_id") or f"JOB-{uuid.uuid4().hex[:12].upper()}")
    bootstraps = int(raw_job.get("bootstraps", DEFAULT_BOOTSTRAPS))
    chunk_size = int(raw_job.get("chunk_size", CHUNK_SIZE))
    return {
        "job_id": job_id,
        "type": str(raw_job.get("type", "bootstrap_validation")),
        "bootstraps": bootstraps,
        "chunk_size": chunk_size,
        "model": raw_job.get("model", "cox_kelaikan_v1"),
        "created_by": raw_job.get("created_by", "php-gateway"),
        "nodes": raw_job.get("nodes"),
    }


def split_bootstrap_job(job: dict[str, Any]) -> list[dict[str, Any]]:
    total = int(job["bootstraps"])
    chunk_size = int(job["chunk_size"])
    subtasks = []
    for index, start in enumerate(range(0, total, chunk_size), start=1):
        end = min(start + chunk_size, total)
        subtasks.append(
            {
                "job_id": job["job_id"],
                "subtask_id": f"{job['job_id']}-ST-{index:03d}",
                "type": "bootstrap_chunk",
                "model": job["model"],
                "resamples": end - start,
                "range_start": start + 1,
                "range_end": end,
                "attempt": 1,
            }
        )
    return subtasks


def split_federated_job(job: dict[str, Any]) -> list[dict[str, Any]]:
    nodes = job.get("nodes") or FEDERATED_NODE_IDS
    return [
        {
            "job_id": job["job_id"],
            "subtask_id": f"{job['job_id']}-FED-{index:03d}",
            "type": "federated_stats",
            "node_id": node_id,
            "attempt": 1,
        }
        for index, node_id in enumerate(nodes, start=1)
    ]


def matrix_sum(matrices: list[list[list[float]]]) -> list[list[float]]:
    if not matrices:
        return []
    rows = len(matrices[0])
    cols = len(matrices[0][0])
    return [[round(sum(matrix[row][col] for matrix in matrices), 4) for col in range(cols)] for row in range(rows)]


def vector_sum(vectors: list[list[float]]) -> list[float]:
    if not vectors:
        return []
    return [round(sum(vector[index] for vector in vectors), 4) for index in range(len(vectors[0]))]


def aggregate_results(job: dict[str, Any], expected_subtasks: int) -> dict[str, Any]:
    client = redis_client()
    results: list[dict[str, Any]] = []
    deadline = time.time() + RESULT_TIMEOUT_SECONDS

    while time.time() < deadline and len(results) < expected_subtasks and not shutdown:
        heartbeat("busy", f"reduce {job['job_id']} {len(results)}/{expected_subtasks}")
        item = client.blpop(RESULT_QUEUE, timeout=3)
        if item is None:
            continue

        _, raw = item
        result = decode(raw)
        if result.get("job_id") != job["job_id"]:
            client.rpush(RESULT_QUEUE, encode(result))
            time.sleep(0.2)
            continue
        results.append(result)

    completed = len(results)
    status = "completed" if completed == expected_subtasks else "partial"
    federated_results = [item for item in results if item.get("type") == "federated_stats"]
    if federated_results:
        sufficient = [item["sufficient_stats"] for item in federated_results]
        return {
            "job_id": job["job_id"],
            "status": status,
            "expected_subtasks": expected_subtasks,
            "completed_subtasks": completed,
            "total_rows": sum(int(item["local_rows"]) for item in federated_results),
            "total_events": sum(int(item["events"]) for item in federated_results),
            "raw_data_shared": any(bool(item.get("raw_data_shared")) for item in federated_results),
            "federated_nodes": [
                {
                    "node_id": item["node_id"],
                    "skadron": item["skadron"],
                    "local_rows": item["local_rows"],
                    "events": item["events"],
                    "worker_id": item["worker_id"],
                }
                for item in federated_results
            ],
            "global_sufficient_stats": {
                "x_tx": matrix_sum([item["x_tx"] for item in sufficient]),
                "x_ty": vector_sum([item["x_ty"] for item in sufficient]),
                "event_count": sum(int(item["event_count"]) for item in sufficient),
            },
            "finished_ms": now_ms(),
        }

    c_indices = [float(item["c_index"]) for item in results]
    optimism_values = [float(item["optimism"]) for item in results]
    corrected = mean(c_indices) - mean(optimism_values) if results else None

    return {
        "job_id": job["job_id"],
        "status": status,
        "expected_subtasks": expected_subtasks,
        "completed_subtasks": completed,
        "c_index_mean": round(mean(c_indices), 4) if c_indices else None,
        "optimism_mean": round(mean(optimism_values), 4) if optimism_values else None,
        "corrected_c_index": round(corrected, 4) if corrected is not None else None,
        "workers": sorted({str(item["worker_id"]) for item in results}),
        "results": results,
        "finished_ms": now_ms(),
    }


def handle_job(raw_job: dict[str, Any]) -> None:
    client = redis_client()
    job = normalize_job(raw_job)
    heartbeat("busy", f"split {job['job_id']}")
    subtasks = split_federated_job(job) if job["type"] == "federated_aggregation" else split_bootstrap_job(job)
    print(f"[{COORDINATOR_ID}] split {job['job_id']} into {len(subtasks)} subtasks", flush=True)

    for subtask in subtasks:
        client.rpush(SUBTASK_QUEUE, encode(subtask))

    result = aggregate_results(job, len(subtasks))
    client.setex(f"{RESULT_KEY_PREFIX}{job['job_id']}:result", 86400, encode(result))
    print(
        f"[{COORDINATOR_ID}] reduced {job['job_id']} status={result['status']} corrected_c_index={result['corrected_c_index']}",
        flush=True,
    )


def main() -> None:
    signal.signal(signal.SIGTERM, request_shutdown)
    signal.signal(signal.SIGINT, request_shutdown)
    heartbeat("online")
    print(f"[{COORDINATOR_ID}] listening on {JOB_QUEUE}", flush=True)

    client = redis_client()
    while not shutdown:
        heartbeat("online")
        item = client.blpop(JOB_QUEUE, timeout=5)
        if item is None:
            continue
        _, raw = item
        handle_job(decode(raw))

    heartbeat("offline")


if __name__ == "__main__":
    main()
