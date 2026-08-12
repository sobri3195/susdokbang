<?php
declare(strict_types=1);

final class DistributedController
{
    public function __construct(
        private DistributedJobRepository $repository,
        private RedisQueueClient $queue
    ) {
    }

    public function submitJob(): void
    {
        $payload = json_decode(file_get_contents('php://input') ?: '{}', true, 512, JSON_THROW_ON_ERROR);
        $type = (string) ($payload['type'] ?? 'bootstrap_validation');
        $resamples = (int) ($payload['bootstraps'] ?? $payload['resamples'] ?? 1000);
        $chunkSize = (int) ($payload['chunk_size'] ?? 100);
        $nodes = $payload['nodes'] ?? ['node-skadron-3', 'node-skadron-31', 'node-skadron-8', 'node-wing-1'];
        $totalSubtasks = $type === 'federated_aggregation'
            ? max(1, count(is_array($nodes) ? $nodes : []))
            : max(1, (int) ceil($resamples / max(1, $chunkSize)));

        $job = $this->repository->createJob($type, $payload, $totalSubtasks);
        for ($i = 0; $i < $totalSubtasks; $i++) {
            $this->repository->addSubtask($job['id'], 'unassigned', $type . '_chunk');
        }

        $queueResult = $this->queue->push([
            'job_id' => $job['id'],
            'type' => $type,
            'bootstraps' => $resamples,
            'resamples' => $resamples,
            'chunk_size' => $chunkSize,
            'nodes' => $nodes,
            'created_at' => gmdate('c'),
        ]);

        Response::ok(['job_id' => $job['id'], 'job' => $this->repository->findJob($job['id']), 'queue' => $queueResult], 201);
    }

    public function showJob(string $jobId): void
    {
        $job = $this->repository->findJob($jobId);
        if (!$job) {
            Response::fail('Job tidak ditemukan.', 404);
            return;
        }
        Response::ok(['job' => $job]);
    }

    public function jobResult(string $jobId): void
    {
        $redisResult = $this->queue->result($jobId);
        if ($redisResult) {
            $this->repository->saveResult($jobId, $redisResult);
            Response::ok(['job_id' => $jobId, 'source' => 'redis', 'result' => $redisResult]);
            return;
        }

        $result = $this->repository->jobResult($jobId);
        if (!$result) {
            Response::fail('Job tidak ditemukan.', 404);
            return;
        }
        Response::ok($result);
    }

    public function clusterStatus(): void
    {
        $redisWorkers = $this->queue->workers();
        $workers = count($redisWorkers) > 0 ? $redisWorkers : $this->repository->workers();
        $jobs = $this->repository->recentJobs();
        $activeWorkers = count(array_filter($workers, fn ($worker) => in_array($worker['status'], ['online', 'busy'], true)));
        $queueStats = $this->queue->stats();
        $queueLength = $queueStats
            ? (int) $queueStats['job_queue_length'] + (int) $queueStats['subtask_queue_length']
            : array_sum(array_map(fn ($job) => max(0, (int) $job['total_subtasks'] - (int) $job['completed_subtasks']), $jobs));

        Response::ok([
            'workers' => $workers,
            'jobs' => $jobs,
            'metrics' => [
                'active_workers' => $activeWorkers,
                'queue_length' => $queueLength,
                'dead_letter_count' => $queueStats['dead_letter_count'] ?? 1,
                'throughput' => 3.8,
                'p95_latency_ms' => 920,
                'redis' => $queueStats,
            ],
        ]);
    }
}
