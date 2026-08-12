from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from typing import Any

import redis


JOB_QUEUE = os.getenv("CSAKT_JOB_QUEUE", "csakt:jobs")
SUBTASK_QUEUE = os.getenv("CSAKT_SUBTASK_QUEUE", "csakt:subtasks")
RESULT_QUEUE = os.getenv("CSAKT_RESULT_QUEUE", "csakt:results")
DEADLETTER_QUEUE = os.getenv("CSAKT_DEADLETTER_QUEUE", "csakt:deadletter")
WORKER_HASH = os.getenv("CSAKT_WORKER_HASH", "csakt:workers")
RESULT_KEY_PREFIX = os.getenv("CSAKT_RESULT_KEY_PREFIX", "csakt:job:")
MAX_ATTEMPTS = int(os.getenv("CSAKT_MAX_ATTEMPTS", "3"))


def redis_client() -> redis.Redis:
    return redis.Redis(
        host=os.getenv("REDIS_HOST", "127.0.0.1"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        db=int(os.getenv("REDIS_DB", "0")),
        password=os.getenv("REDIS_PASSWORD") or None,
        decode_responses=True,
        socket_timeout=5,
    )


def now_ms() -> int:
    return int(time.time() * 1000)


def encode(payload: dict[str, Any]) -> str:
    return json.dumps(payload, separators=(",", ":"), sort_keys=True)


def decode(raw: str | bytes) -> dict[str, Any]:
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8")
    return json.loads(raw)


@dataclass(frozen=True)
class BootstrapResult:
    subtask_id: str
    job_id: str
    worker_id: str
    attempt: int
    c_index: float
    optimism: float
    elapsed_ms: int

    def as_payload(self) -> dict[str, Any]:
        return {
            "subtask_id": self.subtask_id,
            "job_id": self.job_id,
            "worker_id": self.worker_id,
            "attempt": self.attempt,
            "c_index": round(self.c_index, 4),
            "optimism": round(self.optimism, 4),
            "elapsed_ms": self.elapsed_ms,
        }
