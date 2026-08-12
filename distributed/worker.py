from __future__ import annotations

import hashlib
import os
import random
import signal
import socket
import time
from typing import Any

from common import (
    BootstrapResult,
    DEADLETTER_QUEUE,
    MAX_ATTEMPTS,
    RESULT_QUEUE,
    SUBTASK_QUEUE,
    WORKER_HASH,
    decode,
    encode,
    now_ms,
    redis_client,
)


WORKER_ID = os.getenv("WORKER_ID", f"worker-{socket.gethostname()}")
FAIL_ONCE_SUBTASK = os.getenv("FAIL_ONCE_SUBTASK", "")
POLL_TIMEOUT_SECONDS = int(os.getenv("CSAKT_POLL_TIMEOUT_SECONDS", "5"))
shutdown = False
failed_once: set[str] = set()


def request_shutdown(signum: int, _frame: Any) -> None:
    global shutdown
    shutdown = True
    print(f"[{WORKER_ID}] received signal {signum}; draining current loop", flush=True)


def heartbeat(status: str, current_task: str = "idle") -> None:
    client = redis_client()
    client.hset(
        WORKER_HASH,
        WORKER_ID,
        encode(
            {
                "worker_id": WORKER_ID,
                "hostname": socket.gethostname(),
                "role": "worker",
                "status": status,
                "current_task": current_task,
                "heartbeat_ms": now_ms(),
                "queue": SUBTASK_QUEUE,
            }
        ),
    )


def deterministic_metric(seed_material: str, lower: float, upper: float) -> float:
    digest = hashlib.sha256(seed_material.encode("utf-8")).hexdigest()
    unit = int(digest[:8], 16) / 0xFFFFFFFF
    return lower + (upper - lower) * unit


def run_bootstrap_chunk(subtask: dict[str, Any]) -> BootstrapResult:
    started_ms = now_ms()
    subtask_id = str(subtask["subtask_id"])
    attempt = int(subtask.get("attempt", 1))

    if FAIL_ONCE_SUBTASK == subtask_id and subtask_id not in failed_once:
        failed_once.add(subtask_id)
        raise TimeoutError(f"intentional fault injection for {subtask_id}")

    resamples = int(subtask.get("resamples", 100))
    delay = min(1.8, 0.08 + resamples / 1000)
    time.sleep(delay)

    seed = f"{subtask['job_id']}:{subtask_id}:{WORKER_ID}:{attempt}"
    return BootstrapResult(
        subtask_id=subtask_id,
        job_id=str(subtask["job_id"]),
        worker_id=WORKER_ID,
        attempt=attempt,
        c_index=deterministic_metric(seed + ":cindex", 0.716, 0.812),
        optimism=deterministic_metric(seed + ":optimism", 0.018, 0.047),
        elapsed_ms=now_ms() - started_ms,
    )


FEDERATED_SITE_STATS = {
    "node-skadron-3": {
        "skadron": "Skadron Udara 3",
        "local_rows": 184,
        "events": 14,
        "x_tx": [[184.0, 7312.0, 4972.4], [7312.0, 296880.0, 198155.0], [4972.4, 198155.0, 139420.0]],
        "x_ty": [14.0, 604.0, 412.5],
    },
    "node-skadron-31": {
        "skadron": "Skadron Udara 31",
        "local_rows": 206,
        "events": 17,
        "x_tx": [[206.0, 8015.0, 5630.2], [8015.0, 318210.0, 221901.0], [5630.2, 221901.0, 157650.0]],
        "x_ty": [17.0, 706.0, 486.8],
    },
    "node-skadron-8": {
        "skadron": "Skadron Udara 8",
        "local_rows": 96,
        "events": 9,
        "x_tx": [[96.0, 4142.0, 2786.5], [4142.0, 181320.0, 119802.0], [2786.5, 119802.0, 80911.0]],
        "x_ty": [9.0, 398.0, 271.4],
    },
    "node-wing-1": {
        "skadron": "Wing Udara 1",
        "local_rows": 122,
        "events": 5,
        "x_tx": [[122.0, 5710.0, 3371.8], [5710.0, 271430.0, 160040.0], [3371.8, 160040.0, 97112.0]],
        "x_ty": [5.0, 244.0, 148.9],
    },
}


def run_federated_stats(subtask: dict[str, Any]) -> dict[str, Any]:
    started_ms = now_ms()
    node_id = str(subtask["node_id"])
    site = FEDERATED_SITE_STATS[node_id]
    time.sleep(0.15)
    return {
        "type": "federated_stats",
        "subtask_id": subtask["subtask_id"],
        "job_id": subtask["job_id"],
        "worker_id": WORKER_ID,
        "attempt": int(subtask.get("attempt", 1)),
        "node_id": node_id,
        "skadron": site["skadron"],
        "local_rows": site["local_rows"],
        "events": site["events"],
        "sufficient_stats": {
            "x_tx": site["x_tx"],
            "x_ty": site["x_ty"],
            "event_count": site["events"],
        },
        "raw_data_shared": False,
        "elapsed_ms": now_ms() - started_ms,
    }


def process_subtask(subtask: dict[str, Any]) -> dict[str, Any]:
    task_type = str(subtask.get("type", "bootstrap_chunk"))
    if task_type == "federated_stats":
        return run_federated_stats(subtask)
    result = run_bootstrap_chunk(subtask).as_payload()
    result["type"] = "bootstrap_chunk"
    return result


def requeue_or_deadletter(subtask: dict[str, Any], reason: str) -> None:
    client = redis_client()
    attempt = int(subtask.get("attempt", 1)) + 1
    subtask["attempt"] = attempt
    subtask["last_error"] = reason
    subtask["last_worker_id"] = WORKER_ID

    if attempt <= MAX_ATTEMPTS:
        print(f"[{WORKER_ID}] retry {subtask['subtask_id']} attempt={attempt}: {reason}", flush=True)
        client.rpush(SUBTASK_QUEUE, encode(subtask))
        return

    print(f"[{WORKER_ID}] dead-letter {subtask['subtask_id']}: {reason}", flush=True)
    client.rpush(DEADLETTER_QUEUE, encode(subtask))


def main() -> None:
    signal.signal(signal.SIGTERM, request_shutdown)
    signal.signal(signal.SIGINT, request_shutdown)
    heartbeat("online")
    print(f"[{WORKER_ID}] listening on {SUBTASK_QUEUE}", flush=True)

    client = redis_client()
    while not shutdown:
        heartbeat("online")
        item = client.blpop(SUBTASK_QUEUE, timeout=POLL_TIMEOUT_SECONDS)
        if item is None:
            continue

        _, raw = item
        subtask = decode(raw)
        subtask_id = str(subtask["subtask_id"])
        heartbeat("busy", f"bootstrap {subtask_id}")

        try:
            result = process_subtask(subtask)
            client.rpush(RESULT_QUEUE, encode(result))
            metric = result.get("c_index", result.get("node_id", "ok"))
            print(f"[{WORKER_ID}] completed {subtask_id} metric={metric}", flush=True)
        except Exception as exc:
            requeue_or_deadletter(subtask, str(exc))
            time.sleep(0.25 + random.random() * 0.15)
        finally:
            heartbeat("online")

    heartbeat("offline")


if __name__ == "__main__":
    main()
