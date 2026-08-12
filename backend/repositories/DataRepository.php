<?php
declare(strict_types=1);

final class DataRepository
{
    private const TABLES = [
        'mcu' => 'mcu_records',
        'psikotes' => 'psikotes_records',
        'jam-terbang' => 'jam_terbang_records',
    ];

    public function __construct(private mysqli $db)
    {
    }

    public function all(string $module): array
    {
        $table = $this->table($module);
        $stmt = $this->db->prepare("SELECT * FROM {$table} ORDER BY tanggal DESC LIMIT 500");
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function delete(string $module, string $id): bool
    {
        $table = $this->table($module);
        $stmt = $this->db->prepare("DELETE FROM {$table} WHERE id = ?");
        $stmt->bind_param('s', $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }

    public function create(string $module, array $data): array
    {
        return match ($module) {
            'mcu' => $this->createMcu($data),
            'psikotes' => $this->createPsikotes($data),
            'jam-terbang' => $this->createJamTerbang($data),
            default => throw new InvalidArgumentException('Modul data tidak valid'),
        };
    }

    public function update(string $module, string $id, array $data): array
    {
        return match ($module) {
            'mcu' => $this->updateMcu($id, $data),
            'psikotes' => $this->updatePsikotes($id, $data),
            'jam-terbang' => $this->updateJamTerbang($id, $data),
            default => throw new InvalidArgumentException('Modul data tidak valid'),
        };
    }

    private function table(string $module): string
    {
        if (!array_key_exists($module, self::TABLES)) {
            throw new InvalidArgumentException('Modul data tidak valid');
        }
        return self::TABLES[$module];
    }

    private function findById(string $module, string $id): array
    {
        $table = $this->table($module);
        $stmt = $this->db->prepare("SELECT * FROM {$table} WHERE id = ? LIMIT 1");
        $stmt->bind_param('s', $id);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc() ?: [];
    }

    private function createMcu(array $data): array
    {
        $stmt = $this->db->prepare(
            'INSERT INTO mcu_records (id, penerbang_id, tanggal, bmi, tekanan_darah, kolesterol, gula_darah, vo2max, catatan, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('sssdsiisss', $data['id'], $data['penerbang_id'], $data['tanggal'], $data['bmi'], $data['tekanan_darah'], $data['kolesterol'], $data['gula_darah'], $data['vo2max'], $data['catatan'], $data['status']);
        $stmt->execute();
        return $this->findById('mcu', $data['id']);
    }

    private function updateMcu(string $id, array $data): array
    {
        $stmt = $this->db->prepare(
            'UPDATE mcu_records SET penerbang_id=?, tanggal=?, bmi=?, tekanan_darah=?, kolesterol=?, gula_darah=?, vo2max=?, catatan=?, status=? WHERE id=?'
        );
        $stmt->bind_param('ssdsiiisss', $data['penerbang_id'], $data['tanggal'], $data['bmi'], $data['tekanan_darah'], $data['kolesterol'], $data['gula_darah'], $data['vo2max'], $data['catatan'], $data['status'], $id);
        $stmt->execute();
        return $this->findById('mcu', $id);
    }

    private function createPsikotes(array $data): array
    {
        $stmt = $this->db->prepare(
            'INSERT INTO psikotes_records (id, penerbang_id, tanggal, stabilitas_emosi, atensi, stress_index, cognitive_load, rekomendasi)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('sssiiiis', $data['id'], $data['penerbang_id'], $data['tanggal'], $data['stabilitas_emosi'], $data['atensi'], $data['stress_index'], $data['cognitive_load'], $data['rekomendasi']);
        $stmt->execute();
        return $this->findById('psikotes', $data['id']);
    }

    private function updatePsikotes(string $id, array $data): array
    {
        $stmt = $this->db->prepare(
            'UPDATE psikotes_records SET penerbang_id=?, tanggal=?, stabilitas_emosi=?, atensi=?, stress_index=?, cognitive_load=?, rekomendasi=? WHERE id=?'
        );
        $stmt->bind_param('ssiiiiss', $data['penerbang_id'], $data['tanggal'], $data['stabilitas_emosi'], $data['atensi'], $data['stress_index'], $data['cognitive_load'], $data['rekomendasi'], $id);
        $stmt->execute();
        return $this->findById('psikotes', $id);
    }

    private function createJamTerbang(array $data): array
    {
        $stmt = $this->db->prepare(
            'INSERT INTO jam_terbang_records (id, penerbang_id, tanggal, jenis_pesawat, misi, durasi_jam, malam, instruktur)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('sssssdii', $data['id'], $data['penerbang_id'], $data['tanggal'], $data['jenis_pesawat'], $data['misi'], $data['durasi_jam'], $data['malam'], $data['instruktur']);
        $stmt->execute();
        return $this->findById('jam-terbang', $data['id']);
    }

    private function updateJamTerbang(string $id, array $data): array
    {
        $stmt = $this->db->prepare(
            'UPDATE jam_terbang_records SET penerbang_id=?, tanggal=?, jenis_pesawat=?, misi=?, durasi_jam=?, malam=?, instruktur=? WHERE id=?'
        );
        $stmt->bind_param('ssssdiis', $data['penerbang_id'], $data['tanggal'], $data['jenis_pesawat'], $data['misi'], $data['durasi_jam'], $data['malam'], $data['instruktur'], $id);
        $stmt->execute();
        return $this->findById('jam-terbang', $id);
    }
}
