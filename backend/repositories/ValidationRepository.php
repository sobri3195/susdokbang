<?php
declare(strict_types=1);

final class ValidationRepository
{
    public function __construct(private mysqli $db)
    {
    }

    public function createJob(string $id, array $modelSpec): array
    {
        $userId = 'demo-user';
        $json = json_encode($modelSpec, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $stmt = $this->db->prepare(
            'INSERT INTO validation_jobs (id, user_id, model_spec_json, status, ph_status, epv_value, c_index)
             VALUES (?, ?, ?, "running", "warning", 0, 0)'
        );
        $stmt->bind_param('sss', $id, $userId, $json);
        $stmt->execute();
        return $this->findJob($id);
    }

    public function completeJob(string $id, array $summary): array
    {
        $status = 'completed';
        $phStatus = (string) ($summary['ph_status'] ?? 'warning');
        $epv = (float) ($summary['epv'] ?? 0);
        $cIndex = (float) ($summary['c_index'] ?? 0);
        $stmt = $this->db->prepare('UPDATE validation_jobs SET status=?, ph_status=?, epv_value=?, c_index=? WHERE id=?');
        $stmt->bind_param('ssdds', $status, $phStatus, $epv, $cIndex, $id);
        $stmt->execute();
        return $this->findJob($id);
    }

    public function saveResult(string $jobId, string $jenis, array $hasil, string $kesimpulan, string $level): void
    {
        $id = 'VR-' . bin2hex(random_bytes(8));
        $json = json_encode($hasil, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $stmt = $this->db->prepare(
            'INSERT INTO validation_results (id, job_id, jenis, hasil_json, kesimpulan, level) VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('ssssss', $id, $jobId, $jenis, $json, $kesimpulan, $level);
        $stmt->execute();
    }

    public function findJob(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM validation_jobs WHERE id = ? LIMIT 1');
        $stmt->bind_param('s', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc() ?: [];
    }

    public function findResults(string $jobId): array
    {
        $stmt = $this->db->prepare('SELECT jenis, hasil_json, kesimpulan, level FROM validation_results WHERE job_id = ? ORDER BY jenis ASC');
        $stmt->bind_param('s', $jobId);
        $stmt->execute();
        return array_map(function (array $row): array {
            $row['hasil'] = json_decode($row['hasil_json'], true);
            unset($row['hasil_json']);
            return $row;
        }, $stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    }

    public function history(): array
    {
        $stmt = $this->db->prepare('SELECT * FROM validation_jobs ORDER BY created_at DESC LIMIT 100');
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }
}
