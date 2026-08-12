<?php
declare(strict_types=1);

return [
    'db' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'user' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASSWORD') ?: '',
        'name' => getenv('DB_NAME') ?: 'csakt',
        'port' => (int) (getenv('DB_PORT') ?: 3306),
    ],
    'cors_origin' => getenv('CORS_ORIGIN') ?: 'http://127.0.0.1:5173',
    'validation_engine_url' => getenv('VALIDATION_ENGINE_URL') ?: 'http://127.0.0.1:8091',
    'redis' => [
        'host' => getenv('REDIS_HOST') ?: '127.0.0.1',
        'port' => (int) (getenv('REDIS_PORT') ?: 6379),
        'queue' => getenv('REDIS_QUEUE') ?: 'csakt:jobs',
        'result_prefix' => getenv('REDIS_RESULT_PREFIX') ?: 'csakt:job:',
        'subtask_queue' => getenv('REDIS_SUBTASK_QUEUE') ?: 'csakt:subtasks',
        'result_queue' => getenv('REDIS_RESULT_QUEUE') ?: 'csakt:results',
        'deadletter_queue' => getenv('REDIS_DEADLETTER_QUEUE') ?: 'csakt:deadletter',
        'worker_hash' => getenv('REDIS_WORKER_HASH') ?: 'csakt:workers',
    ],
];
