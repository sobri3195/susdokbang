<?php
declare(strict_types=1);

final class DistributedJobRepository
{
    public function __construct(private mysqli $db)
    {
    }

    public function createJob(string $type, array $payload, int $totalSubtasks): array
    {
        $id = 'JOB-' . strtoupper(substr($type, 0, 4)) . '-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3));
        $payloadJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $stmt = $this->db->prepare(
            'INSERT INTO jobs (id, type, payload_json, status, total_subtasks, completed_subtasks, failed_subtasks, progress, result_json)
             VALUES (?, ?, ?, "queued", ?, 0, 0, 0, "{}")'
        );
        $stmt->bind_param('sssi', $id, $type, $payloadJson, $totalSubtasks);
        $stmt->execute();
        return $this->findJob($id);
    }

    public function addSubtask(string $jobId, string $workerId, string $taskType, int $attempt = 1): void
    {
        $id = 'ST-' . bin2hex(random_bytes(6));
        $stmt = $this->db->prepare(
            'INSERT INTO subtasks (id, job_id, worker_id, status, task_type, attempt, hasil_json)
             VALUES (?, ?, ?, "queued", ?, ?, "{}")'
        );
        $stmt->bind_param('ssssi', $id, $jobId, $workerId, $taskType, $attempt);
        $stmt->execute();
    }

    public function findJob(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM jobs WHERE id = ? LIMIT 1');
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $job = $stmt->get_result()->fetch_assoc() ?: [];
        if (!$job) {
            return [];
        }
        $job['subtasks'] = $this->subtasks($id);
        return $job;
    }

    public function jobResult(string $id): array
    {
        $job = $this->findJob($id);
        if (!$job) {
            return [];
        }
        return [
            'job_id' => $id,
            'status' => $job['status'],
            'result' => json_decode($job['result_json'] ?? '{}', true),
            'subtasks' => $job['subtasks'],
        ];
    }

    public function saveResult(string $id, array $result): void
    {
        $status = (($result['status'] ?? '') === 'completed') ? 'completed' : 'running';
        $completed = (int) ($result['completed_subtasks'] ?? 0);
        $total = max(1, (int) ($result['expected_subtasks'] ?? $completed));
        $progress = min(100, round(($completed / $total) * 100, 2));
        $resultJson = json_encode($result, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

        $stmt = $this->db->prepare(
            'UPDATE jobs
             SET status = ?, completed_subtasks = ?, total_subtasks = ?, progress = ?, result_json = ?, updated_at = NOW()
             WHERE id = ?'
        );
        $stmt->bind_param('siidss', $status, $completed, $total, $progress, $resultJson, $id);
        $stmt->execute();
    }

    public function subtasks(string $jobId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM subtasks WHERE job_id = ? ORDER BY mulai ASC, id ASC');
        $stmt->bind_param('s', $jobId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function workers(): array
    {
        $stmt = $this->db->prepare('SELECT * FROM workers ORDER BY role ASC, id ASC');
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function recentJobs(): array
    {
        $stmt = $this->db->prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 20');
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function heartbeat(string $workerId, string $hostname, string $role, string $status): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO workers (id, hostname, role, status, last_heartbeat)
             VALUES (?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE hostname=VALUES(hostname), role=VALUES(role), status=VALUES(status), last_heartbeat=NOW()'
        );
        $stmt->bind_param('ssss', $workerId, $hostname, $role, $status);
        $stmt->execute();
    }
}
