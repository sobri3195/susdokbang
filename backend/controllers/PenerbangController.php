<?php
declare(strict_types=1);

final class PenerbangController
{
    public function __construct(private PenerbangRepository $repository)
    {
    }

    public function index(): void
    {
        Response::json(['data' => $this->repository->all($_GET['search'] ?? null)]);
    }

    public function show(string $id): void
    {
        $pilot = $this->repository->find($id);
        if (!$pilot) {
            Response::json(['message' => 'Penerbang tidak ditemukan'], 404);
            return;
        }
        Response::json(['data' => $pilot]);
    }

    public function store(): void
    {
        $payload = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
        Response::json(['data' => $this->repository->create($payload)], 201);
    }

    public function update(string $id): void
    {
        $payload = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
        $pilot = $this->repository->update($id, $payload);
        Response::json(['data' => $pilot]);
    }

    public function destroy(string $id): void
    {
        Response::json(['deleted' => $this->repository->delete($id)]);
    }
}
