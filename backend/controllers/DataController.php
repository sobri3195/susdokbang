<?php
declare(strict_types=1);

final class DataController
{
    public function __construct(private DataRepository $repository)
    {
    }

    public function index(string $module): void
    {
        Response::json(['data' => $this->repository->all($module)]);
    }

    public function store(string $module): void
    {
        $payload = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
        Response::json(['data' => $this->repository->create($module, $payload)], 201);
    }

    public function update(string $module, string $id): void
    {
        $payload = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
        Response::json(['data' => $this->repository->update($module, $id, $payload)]);
    }

    public function destroy(string $module, string $id): void
    {
        Response::json(['deleted' => $this->repository->delete($module, $id)]);
    }
}
