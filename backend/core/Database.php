<?php
declare(strict_types=1);

final class Database
{
    private mysqli $connection;

    public function __construct(array $config)
    {
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        $db = $config['db'];
        $this->connection = new mysqli($db['host'], $db['user'], $db['password'], $db['name'], $db['port']);
        $this->connection->set_charset('utf8mb4');
    }

    public function connection(): mysqli
    {
        return $this->connection;
    }
}
