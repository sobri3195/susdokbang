from __future__ import annotations

import csv
import sys


BASELINE_SECONDS = 312.0
WORKER_RUNS = {
    1: 312.0,
    2: 166.0,
    4: 91.0,
    8: 58.0,
}


def rows() -> list[dict[str, float]]:
    data = []
    for workers, seconds in WORKER_RUNS.items():
        speedup = BASELINE_SECONDS / seconds
        data.append(
            {
                "workers": float(workers),
                "seconds": seconds,
                "speedup": round(speedup, 2),
                "efficiency": round(speedup / workers, 2),
            }
        )
    return data


def main() -> None:
    writer = csv.DictWriter(sys.stdout, fieldnames=["workers", "seconds", "speedup", "efficiency"])
    writer.writeheader()
    for row in rows():
        writer.writerow(row)


if __name__ == "__main__":
    main()
