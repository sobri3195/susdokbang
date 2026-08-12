<?php
declare(strict_types=1);

final class PenerbangRepository
{
    public function __construct(private mysqli $db)
    {
    }

    public function all(?string $search = null): array
    {
        if ($search) {
            $term = '%' . $search . '%';
            $stmt = $this->db->prepare('SELECT * FROM penerbang WHERE nama LIKE ? OR nrp LIKE ? OR skadron LIKE ? ORDER BY nama ASC');
            $stmt->bind_param('sss', $term, $term, $term);
        } else {
            $stmt = $this->db->prepare('SELECT * FROM penerbang ORDER BY nama ASC');
        }

        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function find(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM penerbang WHERE id = ? LIMIT 1');
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        return $row ?: null;
    }

    public function create(array $data): array
    {
        $stmt = $this->db->prepare(
            'INSERT INTO penerbang (id, nrp, nama, pangkat, skadron, usia, kategori_pesawat, status, total_jam, tanggal_masuk, risk_score)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param(
            'sssssissdsi',
            $data['id'],
            $data['nrp'],
            $data['nama'],
            $data['pangkat'],
            $data['skadron'],
            $data['usia'],
            $data['kategori_pesawat'],
            $data['status'],
            $data['total_jam'],
            $data['tanggal_masuk'],
            $data['risk_score']
        );
        $stmt->execute();
        return $this->find($data['id']);
    }

    public function update(string $id, array $data): ?array
    {
        $stmt = $this->db->prepare(
            'UPDATE penerbang SET nrp=?, nama=?, pangkat=?, skadron=?, usia=?, kategori_pesawat=?, status=?, total_jam=?, tanggal_masuk=?, risk_score=? WHERE id=?'
        );
        $stmt->bind_param(
            'ssssissdsis',
            $data['nrp'],
            $data['nama'],
            $data['pangkat'],
            $data['skadron'],
            $data['usia'],
            $data['kategori_pesawat'],
            $data['status'],
            $data['total_jam'],
            $data['tanggal_masuk'],
            $data['risk_score'],
            $id
        );
        $stmt->execute();
        return $this->find($id);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM penerbang WHERE id = ?');
        $stmt->bind_param('s', $id);
        $stmt->execute();
        return $stmt->affected_rows > 0;
    }
}
