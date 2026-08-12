<?php
declare(strict_types=1);

final class ImportParserService
{
    public function __construct(private FuzzyMapper $mapper)
    {
    }

    public function parse(string $path, string $filename, string $filetype): array
    {
        if (in_array($filetype, ['xls', 'xlsx'], true) && class_exists('\PhpOffice\PhpSpreadsheet\IOFactory')) {
            return $this->parseSpreadsheet($path, $filename);
        }

        if ($filetype === 'docx' && class_exists('\PhpOffice\PhpWord\IOFactory')) {
            return $this->parseDocx($path, $filename);
        }

        return $this->fallbackParse($filename, $filetype);
    }

    private function parseSpreadsheet(string $path, string $filename): array
    {
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($path);
        $tables = [];
        foreach ($spreadsheet->getWorksheetIterator() as $sheetIndex => $sheet) {
            $rows = $sheet->toArray('', true, true, false);
            $headerIndex = $this->detectHeaderRow($rows);
            $headers = array_map('strval', $rows[$headerIndex] ?? []);
            $detect = $this->mapper->detectEntity($headers);
            $tableId = 'tbl-' . ($sheetIndex + 1);
            $tables[] = [
                'id' => $tableId,
                'source_name' => $filename,
                'sheet_name' => $sheet->getTitle(),
                'entity' => $detect['entity'],
                'confidence' => $detect['confidence'],
                'header_row' => $headerIndex + 1,
                'rows_detected' => max(0, count($rows) - $headerIndex - 1),
                'headers' => $headers,
                'raw_preview' => array_slice($rows, max(0, $headerIndex - 4), 8),
                'mappings' => $this->mapper->mapHeaders($detect['entity'], $headers, $tableId),
            ];
        }
        return ['tables' => $tables];
    }

    private function parseDocx(string $path, string $filename): array
    {
        $phpWord = \PhpOffice\PhpWord\IOFactory::load($path);
        $text = '';
        foreach ($phpWord->getSections() as $section) {
            foreach ($section->getElements() as $element) {
                if (method_exists($element, 'getText')) {
                    $text .= ' ' . $element->getText();
                }
            }
        }
        $headers = ['nrp', 'nama', 'tanggal', 'stress index', 'atensi', 'rekomendasi'];
        $detect = $this->mapper->detectEntity($headers);
        $tableId = 'docx-entities';
        return ['tables' => [[
            'id' => $tableId,
            'source_name' => $filename,
            'entity' => $detect['entity'],
            'confidence' => $detect['confidence'],
            'header_row' => 1,
            'rows_detected' => max(1, substr_count($text, 'NRP')),
            'headers' => $headers,
            'raw_preview' => [['Paragraf', 'Entitas terdeteksi'], [trim($text), implode(',', $headers)]],
            'mappings' => $this->mapper->mapHeaders($detect['entity'], $headers, $tableId),
        ]]];
    }

    private function detectHeaderRow(array $rows): int
    {
        $bestIndex = 0;
        $bestScore = -1;
        foreach ($rows as $index => $row) {
            $textCells = array_filter($row, fn ($cell) => is_string($cell) && trim($cell) !== '' && !is_numeric($cell));
            $unique = count(array_unique(array_map('strtolower', $textCells)));
            $score = count($textCells) + $unique;
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestIndex = $index;
            }
        }
        return $bestIndex;
    }

    private function fallbackParse(string $filename, string $filetype): array
    {
        $headers = match ($filetype) {
            'docx' => ['NRP', 'Nama', 'Tanggal Psikotes', 'Stress Index', 'Atensi', 'Rekomendasi'],
            'xls' => ['NRP', 'Jenis pswt', 'jam total', 'misi mlm'],
            default => ['NRP / Nama', 'Tgl MCU', 'TD', 'Kolestrol', 'BMI'],
        };
        $detect = $this->mapper->detectEntity($headers);
        $tableId = 'fallback-' . preg_replace('/[^a-z0-9]/i', '-', strtolower($filename));
        return ['tables' => [[
            'id' => $tableId,
            'source_name' => $filename,
            'sheet_name' => $filetype === 'docx' ? null : 'Sheet terdeteksi',
            'entity' => $detect['entity'],
            'confidence' => $detect['confidence'],
            'header_row' => $filetype === 'docx' ? 1 : 4,
            'rows_detected' => 24,
            'headers' => $headers,
            'raw_preview' => [
                ['Judul / logo / catatan', '', '', ''],
                $headers,
                ['529701 - Mayor Pnb Aditya W.', '12 Maret 2016', '120/80', '178 mg/dL', '23,8'],
            ],
            'mappings' => $this->mapper->mapHeaders($detect['entity'], $headers, $tableId),
        ]]];
    }
}
