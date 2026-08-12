<?php
declare(strict_types=1);

final class Response
{
    public static function json(mixed $payload, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }

    public static function ok(mixed $data = null, int $status = 200): void
    {
        self::json(['success' => true, 'data' => $data, 'error' => null], $status);
    }

    public static function fail(string $message, int $status = 400, mixed $data = null): void
    {
        self::json(['success' => false, 'data' => $data, 'error' => ['message' => $message]], $status);
    }
}
