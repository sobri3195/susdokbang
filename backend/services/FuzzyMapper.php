<?php
declare(strict_types=1);

final class FuzzyMapper
{
    private const SYNONYMS = [
        'penerbang' => [
            'nrp' => ['nrp', 'no register', 'id penerbang', 'nomor'],
            'nama' => ['nama', 'nama penerbang', 'personel'],
            'pangkat' => ['pangkat', 'rank'],
            'skadron' => ['satuan', 'skadron', 'unit'],
            'kategori_pesawat' => ['jenis pesawat', 'kategori pesawat', 'pswt'],
        ],
        'mcu' => [
            'tanggal' => ['tgl mcu', 'tanggal pemeriksaan', 'tgl_periksa', 'tanggal mcu'],
            'tekanan_darah' => ['td', 'tekanan darah', 'tensi'],
            'bmi' => ['bmi', 'imt'],
            'kolesterol' => ['kolesterol', 'kolestrol', 'cholesterol'],
            'gula_darah' => ['gula darah', 'gds', 'glukosa'],
            'vo2max' => ['vo2max', 'vo2 max', 'kebugaran'],
        ],
        'psikotes' => [
            'stress_index' => ['stress index', 'stres', 'tingkat stres'],
            'atensi' => ['atensi', 'attention', 'konsentrasi'],
            'stabilitas_emosi' => ['stabilitas emosi', 'emosi'],
            'rekomendasi' => ['rekomendasi', 'saran psikolog', 'catatan psikolog'],
        ],
        'jam_terbang' => [
            'tanggal' => ['tanggal', 'periode', 'tgl terbang'],
            'jenis_pesawat' => ['jenis pswt', 'jenis pesawat', 'aircraft'],
            'durasi_jam' => ['jam total', 'durasi', 'jam terbang', 'flight hour'],
            'malam' => ['misi mlm', 'malam', 'night'],
            'misi' => ['misi', 'jenis misi', 'mission'],
        ],
    ];

    public function detectEntity(array $headers): array
    {
        $scores = [];
        foreach (array_keys(self::SYNONYMS) as $entity) {
            $scores[$entity] = 0;
            foreach ($headers as $header) {
                $match = $this->bestField($entity, (string) $header);
                $scores[$entity] += $match['confidence'];
            }
        }
        arsort($scores);
        $entity = (string) array_key_first($scores);
        $confidence = min(99, (int) round(($scores[$entity] / max(1, count($headers)))));
        return ['entity' => $entity, 'confidence' => $confidence];
    }

    public function mapHeaders(string $entity, array $headers, string $tableId): array
    {
        $mappings = [];
        foreach ($headers as $index => $header) {
            $match = $this->bestField($entity, (string) $header);
            $mappings[] = [
                'id' => $tableId . '-map-' . $index,
                'table_id' => $tableId,
                'source_column' => $header,
                'target_field' => $match['field'],
                'confidence' => $match['confidence'],
                'required' => in_array($match['field'], ['nrp', 'tanggal'], true),
            ];
        }
        return $mappings;
    }

    private function bestField(string $entity, string $header): array
    {
        $normalized = $this->normalizeHeader($header);
        $best = ['field' => 'abaikan', 'confidence' => 0];
        foreach (self::SYNONYMS[$entity] ?? [] as $field => $synonyms) {
            foreach ($synonyms as $synonym) {
                similar_text($normalized, $this->normalizeHeader($synonym), $percent);
                $levenshtein = levenshtein($normalized, $this->normalizeHeader($synonym));
                $score = max((int) round($percent), 100 - min(100, $levenshtein * 12));
                if ($score > $best['confidence']) {
                    $best = ['field' => $field, 'confidence' => $score];
                }
            }
        }
        return $best['confidence'] >= 45 ? $best : ['field' => 'abaikan', 'confidence' => $best['confidence']];
    }

    private function normalizeHeader(string $value): string
    {
        $value = strtolower(trim($value));
        $value = str_replace(['_', '-', '/', '.'], ' ', $value);
        $value = preg_replace('/[^a-z0-9\s]/', '', $value) ?? $value;
        return preg_replace('/\s+/', ' ', $value) ?? $value;
    }
}
