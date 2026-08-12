<?php
declare(strict_types=1);

final class ValidationController
{
    public function __construct(
        private ValidationRepository $repository,
        private ValidationEngineClient $engine
    ) {
    }

    public function run(): void
    {
        $payload = json_decode(file_get_contents('php://input') ?: '{}', true, 512, JSON_THROW_ON_ERROR);
        $modelSpec = $payload['model_spec'] ?? [
            'time_column' => 'bulan_observasi',
            'event_column' => 'event_kelaikan',
            'covariates' => ['usia_gt_40', 'bmi_gt_27', 'kolesterol_gt_220', 'stress_tinggi', 'vo2max_baik', 'jam_terbang_stabil'],
        ];
        $jobId = 'VAL-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3));
        $job = $this->repository->createJob($jobId, $modelSpec);
        $dataset = $this->datasetFromDb();

        $result = $this->engine->runFullValidation($dataset, $modelSpec);
        $job = $this->repository->completeJob($jobId, $result['summary']);

        foreach ($result['sections'] as $jenis => $section) {
            $level = $jenis === 'ph' ? ($result['summary']['ph_status'] ?? 'warning') : 'pass';
            $this->repository->saveResult($jobId, $jenis, $section, $this->conclusion($jenis, $result['summary']), $level);
        }

        Response::ok(['job_id' => $jobId, 'job' => $job, 'result' => $result], 201);
    }

    public function show(string $jobId): void
    {
        $job = $this->repository->findJob($jobId);
        if (!$job) {
            Response::fail('Job validasi tidak ditemukan.', 404);
            return;
        }
        Response::ok(['job' => $job, 'results' => $this->repository->findResults($jobId)]);
    }

    public function history(): void
    {
        Response::ok(['items' => $this->repository->history()]);
    }

    public function export(string $jobId): void
    {
        $job = $this->repository->findJob($jobId);
        $results = $this->repository->findResults($jobId);
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="csakt-validasi-cox-' . $jobId . '.csv"');
        $out = fopen('php://output', 'w');
        fputcsv($out, ['job_id', 'status', 'ph_status', 'epv', 'c_index']);
        fputcsv($out, [$jobId, $job['status'] ?? '', $job['ph_status'] ?? '', $job['epv_value'] ?? '', $job['c_index'] ?? '']);
        fputcsv($out, []);
        fputcsv($out, ['jenis', 'level', 'kesimpulan']);
        foreach ($results as $row) {
            fputcsv($out, [$row['jenis'], $row['level'], $row['kesimpulan']]);
        }
        fclose($out);
    }

    private function datasetFromDb(): array
    {
        $stmt = $this->repositoryDb()->prepare(
            'SELECT p.id, p.nrp, p.usia, p.total_jam, p.risk_score, p.status
             FROM penerbang p
             ORDER BY p.id ASC'
        );
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    private function repositoryDb(): mysqli
    {
        $ref = new ReflectionClass($this->repository);
        $prop = $ref->getProperty('db');
        $prop->setAccessible(true);
        return $prop->getValue($this->repository);
    }

    private function conclusion(string $jenis, array $summary): string
    {
        return match ($jenis) {
            'ph' => 'Uji PH global p=' . number_format((float) ($summary['global_schoenfeld_p'] ?? 0), 3) . ' dengan status ' . ($summary['ph_status'] ?? 'warning') . '.',
            'fit' => 'C-index=' . number_format((float) ($summary['c_index'] ?? 0), 2) . ' dan EPV=' . number_format((float) ($summary['epv'] ?? 0), 1) . '.',
            'missing' => 'Missing total sekitar ' . number_format((float) ($summary['missing_percent'] ?? 0), 1) . '%.',
            default => 'Hasil validasi tersimpan dari engine statistik.',
        };
    }
}
