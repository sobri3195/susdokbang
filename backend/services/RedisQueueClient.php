<?php
declare(strict_types=1);

final class RedisQueueClient
{
    public function __construct(
        private string $host,
        private int $port,
        private string $queueName = 'csakt:jobs',
        private string $resultKeyPrefix = 'csakt:job:',
        private string $subtaskQueue = 'csakt:subtasks',
        private string $resultQueue = 'csakt:results',
        private string $deadLetterQueue = 'csakt:deadletter',
        private string $workerHash = 'csakt:workers'
    )
    {
    }

    private function connection(): ?Redis
    {
        if (!class_exists('Redis')) {
            return null;
        }

        $redis = new Redis();
        $redis->connect($this->host, $this->port, 1.5);
        return $redis;
    }

    public function push(array $message): array
    {
        try {
            $redis = $this->connection();
            if (!$redis) {
                return ['queued' => false, 'reason' => 'Ekstensi Redis PHP belum aktif; job tersimpan di MySQL sebagai fallback.'];
            }
            $redis->rPush($this->queueName, json_encode($message, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
            return ['queued' => true, 'queue' => $this->queueName];
        } catch (Throwable $exception) {
            return ['queued' => false, 'reason' => $exception->getMessage()];
        }
    }

    public function result(string $jobId): ?array
    {
        try {
            $redis = $this->connection();
            if (!$redis) {
                return null;
            }
            $raw = $redis->get($this->resultKeyPrefix . $jobId . ':result');
            if (!$raw) {
                return null;
            }
            return json_decode((string) $raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            return null;
        }
    }

    public function stats(): ?array
    {
        try {
            $redis = $this->connection();
            if (!$redis) {
                return null;
            }
            return [
                'job_queue_length' => $redis->lLen($this->queueName),
                'subtask_queue_length' => $redis->lLen($this->subtaskQueue),
                'result_queue_length' => $redis->lLen($this->resultQueue),
                'dead_letter_count' => $redis->lLen($this->deadLetterQueue),
            ];
        } catch (Throwable) {
            return null;
        }
    }

    public function workers(): array
    {
        try {
            $redis = $this->connection();
            if (!$redis) {
                return [];
            }
            $workers = [];
            foreach ($redis->hGetAll($this->workerHash) ?: [] as $raw) {
                $decoded = json_decode((string) $raw, true);
                if (is_array($decoded)) {
                    $workers[] = [
                        'id' => $decoded['worker_id'] ?? '',
                        'hostname' => $decoded['hostname'] ?? '',
                        'role' => $decoded['role'] ?? 'worker',
                        'status' => $decoded['status'] ?? 'offline',
                        'current_task' => $decoded['current_task'] ?? 'idle',
                        'queue_name' => $decoded['queue'] ?? '',
                        'last_heartbeat' => isset($decoded['heartbeat_ms']) ? date('c', (int) ($decoded['heartbeat_ms'] / 1000)) : null,
                        'cpu_load' => 0,
                        'memory_mb' => 0,
                    ];
                }
            }
            return $workers;
        } catch (Throwable) {
            return [];
        }
    }
}
