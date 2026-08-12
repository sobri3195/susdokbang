<?php
declare(strict_types=1);

final class ImportNormalizer
{
    public function normalizeRows(array $rawRows, array $mapping, string $entity): array
    {
        $rows = [];
        foreach ($rawRows as $index => $rawRow) {
            $values = [];
            $issues = [];
            foreach ($mapping as $map) {
                $target = (string) ($map['target_field'] ?? $map['targetField'] ?? 'abaikan');
                if ($target === 'abaikan') {
                    continue;
                }
                $source = (string) ($map['source_column'] ?? $map['sourceColumn'] ?? '');
                $rawValue = $rawRow[$source] ?? $rawRow[$target] ?? '';
                $values[$target] = $this->normalizeValue($target, $rawValue);
                $issue = $this->validateValue($target, $values[$target], (string) $rawValue);
                if ($issue) {
                    $issues[] = $issue;
                }
            }

            if (($values['nrp'] ?? '') === '') {
                $issues[] = ['field' => 'nrp', 'raw_value' => '', 'reason' => 'NRP kosong sehingga baris tidak bisa dicocokkan.'];
            }

            $rows[] = [
                'id' => 'row-' . ($index + 1),
                'row_number' => $index + 1,
                'entity' => $entity,
                'status' => $this->rowStatus($issues),
                'values' => $values,
                'issues' => $issues,
            ];
        }
        return $rows;
    }

    public function normalizeValue(string $field, mixed $value): mixed
    {
        $text = trim((string) $value);
        return match ($field) {
            'tanggal', 'tanggal_masuk' => $this->normalizeDate($text),
            'tekanan_darah' => preg_replace('/\s+/', '', $text),
            'nrp' => preg_replace('/\s+/', '', $text),
            'bmi', 'kolesterol', 'gula_darah', 'vo2max', 'stress_index', 'atensi', 'stabilitas_emosi', 'durasi_jam', 'total_jam' => $this->normalizeNumber($text),
            'malam', 'instruktur' => preg_match('/^(ya|y|true|1|malam|night)$/i', $text) ? 1 : 0,
            'status' => $this->normalizeStatus($text),
            default => trim($text),
        };
    }

    private function normalizeDate(string $value): string
    {
        if ($value === '') {
            return '';
        }
        if (is_numeric($value) && (float) $value > 20000) {
            return gmdate('Y-m-d', ((int) $value - 25569) * 86400);
        }
        $months = [
            'januari' => 'January', 'februari' => 'February', 'maret' => 'March', 'april' => 'April',
            'mei' => 'May', 'juni' => 'June', 'juli' => 'July', 'agustus' => 'August',
            'september' => 'September', 'oktober' => 'October', 'november' => 'November', 'desember' => 'December',
        ];
        $normalized = str_ireplace(array_keys($months), array_values($months), strtolower($value));
        $timestamp = strtotime($normalized);
        return $timestamp ? date('Y-m-d', $timestamp) : '';
    }

    private function normalizeNumber(string $value): float
    {
        $value = str_replace(',', '.', $value);
        preg_match('/-?\d+(?:\.\d+)?/', $value, $matches);
        return isset($matches[0]) ? (float) $matches[0] : 0.0;
    }

    private function normalizeStatus(string $value): string
    {
        $lower = strtolower($value);
        if (str_contains($lower, 'tidak')) {
            return 'Tidak Laik';
        }
        if (str_contains($lower, 'terbatas')) {
            return 'Terbatas';
        }
        if (str_contains($lower, 'observ')) {
            return 'Observasi';
        }
        return 'Laik';
    }

    private function validateValue(string $field, mixed $value, string $rawValue): ?array
    {
        if (in_array($field, ['tanggal', 'tanggal_masuk'], true) && $value === '') {
            return ['field' => $field, 'raw_value' => $rawValue, 'reason' => 'Tanggal tidak dapat diparse.'];
        }
        if ($field === 'bmi' && ((float) $value < 10 || (float) $value > 80)) {
            return ['field' => $field, 'raw_value' => $rawValue, 'reason' => 'BMI di luar rentang wajar.'];
        }
        if ($field === 'tekanan_darah' && $rawValue !== '' && !preg_match('/^\d{2,3}\s*\/\s*\d{2,3}$/', $rawValue)) {
            return ['field' => $field, 'raw_value' => $rawValue, 'reason' => 'Format tekanan darah tidak valid.'];
        }
        return null;
    }

    private function rowStatus(array $issues): string
    {
        foreach ($issues as $issue) {
            if (in_array($issue['field'], ['nrp', 'tanggal'], true)) {
                return 'error';
            }
        }
        return count($issues) > 0 ? 'warning' : 'valid';
    }
}
