<?php
declare(strict_types=1);

final class ImportRepository
{
    public function __construct(private mysqli $db)
    {
    }

    public function createJob(string $id, string $filename, string $filetype, string $status, int $totalRows = 0): array
    {
        $userId = 'demo-user';
        $stmt = $this->db->prepare(
            'INSERT INTO import_jobs (id, user_id, filename, filetype, status, total_rows, inserted, updated, skipped, failed)
             VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0)'
        );
        $stmt->bind_param('sssssi', $id, $userId, $filename, $filetype, $status, $totalRows);
        $stmt->execute();
        return $this->findJob($id);
    }

    public function updateJobSummary(string $id, string $status, int $totalRows, int $inserted, int $updated, int $skipped, int $failed): array
    {
        $stmt = $this->db->prepare(
            'UPDATE import_jobs SET status=?, total_rows=?, inserted=?, updated=?, skipped=?, failed=? WHERE id=?'
        );
        $stmt->bind_param('siiiiis', $status, $totalRows, $inserted, $updated, $skipped, $failed, $id);
        $stmt->execute();
        return $this->findJob($id);
    }

    public function findJob(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM import_jobs WHERE id = ? LIMIT 1');
        $stmt->bind_param('s', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc() ?: [];
    }

    public function history(): array
    {
        $stmt = $this->db->prepare('SELECT * FROM import_jobs ORDER BY created_at DESC LIMIT 100');
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function replaceRowErrors(string $importId, array $errors): void
    {
        $delete = $this->db->prepare('DELETE FROM import_row_errors WHERE import_id = ?');
        $delete->bind_param('s', $importId);
        $delete->execute();

        $stmt = $this->db->prepare(
            'INSERT INTO import_row_errors (import_id, row_number, field, raw_value, reason) VALUES (?, ?, ?, ?, ?)'
        );

        foreach ($errors as $error) {
            $rowNumber = (int) $error['row_number'];
            $field = (string) $error['field'];
            $rawValue = (string) $error['raw_value'];
            $reason = (string) $error['reason'];
            $stmt->bind_param('sisss', $importId, $rowNumber, $field, $rawValue, $reason);
            $stmt->execute();
        }
    }

    public function rowErrors(string $importId): array
    {
        $stmt = $this->db->prepare('SELECT row_number, field, raw_value, reason FROM import_row_errors WHERE import_id = ? ORDER BY row_number ASC');
        $stmt->bind_param('s', $importId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function saveMappingTemplate(string $name, string $targetEntity, array $mapping, string $createdBy = 'demo-user'): array
    {
        $id = 'TPL-' . bin2hex(random_bytes(6));
        $json = json_encode($mapping, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $stmt = $this->db->prepare(
            'INSERT INTO mapping_templates (id, nama, entitas_target, mapping_json, created_by) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('sssss', $id, $name, $targetEntity, $json, $createdBy);
        $stmt->execute();
        return ['id' => $id, 'nama' => $name, 'entitas_target' => $targetEntity, 'mapping' => $mapping];
    }

    public function templates(): array
    {
        $stmt = $this->db->prepare('SELECT * FROM mapping_templates ORDER BY created_at DESC');
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function commitRows(array $rows): array
    {
        $inserted = 0;
        $updated = 0;
        $skipped = 0;
        $failed = 0;

        $this->db->begin_transaction();
        try {
            foreach ($rows as $row) {
                if (($row['status'] ?? '') === 'error') {
                    $failed++;
                    continue;
                }

                $entity = $row['entity'] ?? '';
                $values = $row['values'] ?? [];
                if ($entity === 'penerbang') {
                    $result = $this->upsertPenerbang($values);
                } elseif ($entity === 'mcu') {
                    $result = $this->upsertMcu($values);
                } elseif ($entity === 'psikotes') {
                    $result = $this->upsertPsikotes($values);
                } elseif ($entity === 'jam_terbang') {
                    $result = $this->upsertJamTerbang($values);
                } else {
                    $failed++;
                    continue;
                }

                if ($result === 'inserted') {
                    $inserted++;
                } elseif ($result === 'updated') {
                    $updated++;
                } else {
                    $skipped++;
                }
            }
            $this->db->commit();
        } catch (Throwable $exception) {
            $this->db->rollback();
            throw $exception;
        }

        return compact('inserted', 'updated', 'skipped', 'failed');
    }

    private function penerbangIdByNrp(string $nrp): ?string
    {
        $stmt = $this->db->prepare('SELECT id FROM penerbang WHERE nrp = ? LIMIT 1');
        $stmt->bind_param('s', $nrp);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        return $row['id'] ?? null;
    }

    private function upsertPenerbang(array $values): string
    {
        $nrp = (string) ($values['nrp'] ?? '');
        if ($nrp === '') {
            return 'failed';
        }
        $id = $this->penerbangIdByNrp($nrp) ?: 'P-' . $nrp;
        $existing = $this->penerbangIdByNrp($nrp);
        $nama = (string) ($values['nama'] ?? 'Penerbang Baru');
        $pangkat = (string) ($values['pangkat'] ?? '-');
        $skadron = (string) ($values['skadron'] ?? '-');
        $usia = (int) ($values['usia'] ?? 0);
        $kategori = (string) ($values['kategori_pesawat'] ?? 'Latih');
        $status = (string) ($values['status'] ?? 'Laik');
        $totalJam = (float) ($values['total_jam'] ?? 0);
        $tanggalMasuk = (string) ($values['tanggal_masuk'] ?? date('Y-m-d'));
        $riskScore = (int) ($values['risk_score'] ?? 0);

        if ($existing) {
            $stmt = $this->db->prepare('UPDATE penerbang SET nama=?, pangkat=?, skadron=?, usia=?, kategori_pesawat=?, status=?, total_jam=?, tanggal_masuk=?, risk_score=? WHERE nrp=?');
            $stmt->bind_param('sssissdsis', $nama, $pangkat, $skadron, $usia, $kategori, $status, $totalJam, $tanggalMasuk, $riskScore, $nrp);
            $stmt->execute();
            return 'updated';
        }

        $stmt = $this->db->prepare('INSERT INTO penerbang (id, nrp, nama, pangkat, skadron, usia, kategori_pesawat, status, total_jam, tanggal_masuk, risk_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('sssssissdsi', $id, $nrp, $nama, $pangkat, $skadron, $usia, $kategori, $status, $totalJam, $tanggalMasuk, $riskScore);
        $stmt->execute();
        return 'inserted';
    }

    private function upsertMcu(array $values): string
    {
        $pilotId = $this->penerbangIdByNrp((string) ($values['nrp'] ?? ''));
        if (!$pilotId) {
            return 'failed';
        }
        $tanggal = (string) ($values['tanggal'] ?? date('Y-m-d'));
        $id = 'MCU-' . $pilotId . '-' . $tanggal;
        $bmi = (float) ($values['bmi'] ?? 0);
        $td = (string) ($values['tekanan_darah'] ?? '');
        $kolesterol = (int) ($values['kolesterol'] ?? 0);
        $gula = (int) ($values['gula_darah'] ?? 0);
        $vo2max = (int) ($values['vo2max'] ?? 0);
        $catatan = (string) ($values['catatan'] ?? 'Import cerdas');
        $status = (string) ($values['status'] ?? 'Laik');

        $stmt = $this->db->prepare('INSERT INTO mcu_records (id, penerbang_id, tanggal, bmi, tekanan_darah, kolesterol, gula_darah, vo2max, catatan, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE bmi=VALUES(bmi), tekanan_darah=VALUES(tekanan_darah), kolesterol=VALUES(kolesterol), gula_darah=VALUES(gula_darah), vo2max=VALUES(vo2max), catatan=VALUES(catatan), status=VALUES(status)');
        $stmt->bind_param('sssdsiisss', $id, $pilotId, $tanggal, $bmi, $td, $kolesterol, $gula, $vo2max, $catatan, $status);
        $stmt->execute();
        return $stmt->affected_rows === 1 ? 'inserted' : 'updated';
    }

    private function upsertPsikotes(array $values): string
    {
        $pilotId = $this->penerbangIdByNrp((string) ($values['nrp'] ?? ''));
        if (!$pilotId) {
            return 'failed';
        }
        $tanggal = (string) ($values['tanggal'] ?? date('Y-m-d'));
        $id = 'PSI-' . $pilotId . '-' . $tanggal;
        $emosi = (int) ($values['stabilitas_emosi'] ?? 0);
        $atensi = (int) ($values['atensi'] ?? 0);
        $stress = (int) ($values['stress_index'] ?? 0);
        $load = (int) ($values['cognitive_load'] ?? 0);
        $rekomendasi = (string) ($values['rekomendasi'] ?? 'Import cerdas');
        $stmt = $this->db->prepare('INSERT INTO psikotes_records (id, penerbang_id, tanggal, stabilitas_emosi, atensi, stress_index, cognitive_load, rekomendasi) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE stabilitas_emosi=VALUES(stabilitas_emosi), atensi=VALUES(atensi), stress_index=VALUES(stress_index), cognitive_load=VALUES(cognitive_load), rekomendasi=VALUES(rekomendasi)');
        $stmt->bind_param('sssiiiis', $id, $pilotId, $tanggal, $emosi, $atensi, $stress, $load, $rekomendasi);
        $stmt->execute();
        return $stmt->affected_rows === 1 ? 'inserted' : 'updated';
    }

    private function upsertJamTerbang(array $values): string
    {
        $pilotId = $this->penerbangIdByNrp((string) ($values['nrp'] ?? ''));
        if (!$pilotId) {
            return 'failed';
        }
        $tanggal = (string) ($values['tanggal'] ?? date('Y-m-d'));
        $jenis = (string) ($values['jenis_pesawat'] ?? '-');
        $id = 'JT-' . $pilotId . '-' . $tanggal . '-' . preg_replace('/[^A-Z0-9]/i', '', $jenis);
        $misi = (string) ($values['misi'] ?? 'Import cerdas');
        $durasi = (float) ($values['durasi_jam'] ?? 0);
        $malam = (int) ($values['malam'] ?? 0);
        $instruktur = (int) ($values['instruktur'] ?? 0);
        $stmt = $this->db->prepare('INSERT INTO jam_terbang_records (id, penerbang_id, tanggal, jenis_pesawat, misi, durasi_jam, malam, instruktur) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE misi=VALUES(misi), durasi_jam=VALUES(durasi_jam), malam=VALUES(malam), instruktur=VALUES(instruktur)');
        $stmt->bind_param('sssssdii', $id, $pilotId, $tanggal, $jenis, $misi, $durasi, $malam, $instruktur);
        $stmt->execute();
        return $stmt->affected_rows === 1 ? 'inserted' : 'updated';
    }
}
