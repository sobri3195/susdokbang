<?php
declare(strict_types=1);

final class ImportController
{
    public function __construct(
        private ImportRepository $repository,
        private ImportParserService $parser,
        private ImportNormalizer $normalizer,
        private array $config
    ) {
    }

    public function upload(): void
    {
        if (!isset($_FILES['files'])) {
            Response::fail('File wajib diunggah.', 422);
            return;
        }

        $uploadRoot = dirname(__DIR__) . '/storage/imports';
        if (!is_dir($uploadRoot)) {
            mkdir($uploadRoot, 0775, true);
        }

        $files = $this->normalizeFiles($_FILES['files']);
        $detected = [];
        $job = null;

        foreach ($files as $file) {
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($extension, ['xls', 'xlsx', 'docx'], true)) {
                Response::fail('Tipe file tidak didukung: ' . $extension, 422);
                return;
            }
            if ((int) $file['size'] > 25 * 1024 * 1024) {
                Response::fail('Ukuran file melebihi batas 25 MB.', 422);
                return;
            }

            $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($file['name'])) ?? 'import-file';
            $importId = 'IMP-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3));
            $target = $uploadRoot . '/' . $importId . '-' . $safeName;
            move_uploaded_file($file['tmp_name'], $target);

            $parsed = $this->parser->parse($target, $safeName, $extension);
            $rowsDetected = array_sum(array_map(fn ($table) => (int) ($table['rows_detected'] ?? 0), $parsed['tables']));
            $job = $this->repository->createJob($importId, $safeName, $extension, 'parsed', $rowsDetected);
            $detected = array_merge($detected, $parsed['tables']);
        }

        Response::ok(['import_id' => $job['id'] ?? null, 'job' => $job, 'detected_tables' => $detected], 201);
    }

    public function preview(string $importId): void
    {
        $job = $this->repository->findJob($importId);
        if (!$job) {
            Response::fail('Import ID tidak ditemukan.', 404);
            return;
        }
        Response::ok(['job' => $job, 'message' => 'Preview tersedia dari hasil parsing upload.']);
    }

    public function mapping(string $importId): void
    {
        $payload = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
        if (!empty($payload['save_template'])) {
            $template = $this->repository->saveMappingTemplate(
                (string) ($payload['template_name'] ?? 'Template import'),
                (string) ($payload['entity'] ?? 'mcu'),
                $payload['mapping'] ?? []
            );
            Response::ok(['import_id' => $importId, 'template' => $template]);
            return;
        }
        Response::ok(['import_id' => $importId, 'mapping' => $payload['mapping'] ?? []]);
    }

    public function validate(string $importId): void
    {
        $payload = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
        $entity = (string) ($payload['entity'] ?? 'mcu');
        $mapping = $payload['mapping'] ?? [];
        $rawRows = $payload['rows'] ?? $this->demoRows();
        $rows = $this->normalizer->normalizeRows($rawRows, $mapping, $entity);
        $errors = [];
        foreach ($rows as $row) {
            foreach ($row['issues'] as $issue) {
                $errors[] = [
                    'row_number' => $row['row_number'],
                    'field' => $issue['field'],
                    'raw_value' => $issue['raw_value'],
                    'reason' => $issue['reason'],
                ];
            }
        }
        $this->repository->replaceRowErrors($importId, $errors);
        $summary = [
            'valid' => count(array_filter($rows, fn ($row) => $row['status'] === 'valid')),
            'warning' => count(array_filter($rows, fn ($row) => $row['status'] === 'warning')),
            'error' => count(array_filter($rows, fn ($row) => $row['status'] === 'error')),
        ];
        Response::ok(['summary' => $summary, 'rows' => $rows]);
    }

    public function commit(string $importId): void
    {
        $payload = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
        $rows = $payload['rows'] ?? [];
        $summary = $this->repository->commitRows($rows);
        $job = $this->repository->updateJobSummary(
            $importId,
            'committed',
            count($rows),
            $summary['inserted'],
            $summary['updated'],
            $summary['skipped'],
            $summary['failed']
        );
        Response::ok(['job' => $job, 'summary' => $summary]);
    }

    public function errorsCsv(string $importId): void
    {
        $errors = $this->repository->rowErrors($importId);
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="csakt-import-errors-' . $importId . '.csv"');
        $out = fopen('php://output', 'w');
        fputcsv($out, ['row_number', 'field', 'raw_value', 'reason']);
        foreach ($errors as $error) {
            fputcsv($out, $error);
        }
        fclose($out);
    }

    public function history(): void
    {
        Response::ok(['items' => $this->repository->history()]);
    }

    public function templates(): void
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $payload = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
            Response::ok($this->repository->saveMappingTemplate($payload['nama'], $payload['entitas_target'], $payload['mapping_json'] ?? []), 201);
            return;
        }
        Response::ok(['items' => $this->repository->templates()]);
    }

    private function normalizeFiles(array $files): array
    {
        $normalized = [];
        $count = is_array($files['name']) ? count($files['name']) : 1;
        for ($i = 0; $i < $count; $i++) {
            $normalized[] = [
                'name' => is_array($files['name']) ? $files['name'][$i] : $files['name'],
                'type' => is_array($files['type']) ? $files['type'][$i] : $files['type'],
                'tmp_name' => is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'],
                'error' => is_array($files['error']) ? $files['error'][$i] : $files['error'],
                'size' => is_array($files['size']) ? $files['size'][$i] : $files['size'],
            ];
        }
        return $normalized;
    }

    private function demoRows(): array
    {
        return [
            ['NRP / Nama' => '529701 - Mayor Pnb Aditya W.', 'Tgl MCU' => '12 Maret 2016', 'TD' => '120/80', 'Kolestrol' => '178 mg/dL', 'BMI' => '23,8', 'nrp' => '529701'],
            ['NRP / Nama' => '', 'Tgl MCU' => 'not a date', 'TD' => '120-80', 'Kolestrol' => 'abc', 'BMI' => '300', 'nrp' => ''],
        ];
    }
}
