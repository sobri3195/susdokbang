<?php
declare(strict_types=1);

$config = require __DIR__ . '/../config/config.php';

header('Access-Control-Allow-Origin: ' . $config['cors_origin']);
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require __DIR__ . '/../core/Database.php';
require __DIR__ . '/../core/Response.php';
if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
    require __DIR__ . '/../../vendor/autoload.php';
}
require __DIR__ . '/../repositories/PenerbangRepository.php';
require __DIR__ . '/../repositories/DataRepository.php';
require __DIR__ . '/../repositories/ImportRepository.php';
require __DIR__ . '/../repositories/ValidationRepository.php';
require __DIR__ . '/../repositories/DistributedJobRepository.php';
require __DIR__ . '/../services/FuzzyMapper.php';
require __DIR__ . '/../services/ImportNormalizer.php';
require __DIR__ . '/../services/ImportParserService.php';
require __DIR__ . '/../services/ValidationEngineClient.php';
require __DIR__ . '/../services/RedisQueueClient.php';
require __DIR__ . '/../controllers/PenerbangController.php';
require __DIR__ . '/../controllers/DataController.php';
require __DIR__ . '/../controllers/AnalyticsController.php';
require __DIR__ . '/../controllers/ImportController.php';
require __DIR__ . '/../controllers/ValidationController.php';
require __DIR__ . '/../controllers/DistributedController.php';

try {
    $db = (new Database($config))->connection();
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '', '/');
    $path = preg_replace('#^(backend/)?api/?#', '', $path);
    $parts = $path === '' ? [] : explode('/', $path);
    $method = $_SERVER['REQUEST_METHOD'];

    $penerbang = new PenerbangController(new PenerbangRepository($db));
    $data = new DataController(new DataRepository($db));
    $analytics = new AnalyticsController();
    $import = new ImportController(
        new ImportRepository($db),
        new ImportParserService(new FuzzyMapper()),
        new ImportNormalizer(),
        $config
    );
    $validation = new ValidationController(
        new ValidationRepository($db),
        new ValidationEngineClient($config['validation_engine_url'])
    );
    $distributed = new DistributedController(
        new DistributedJobRepository($db),
        new RedisQueueClient(
            $config['redis']['host'],
            $config['redis']['port'],
            $config['redis']['queue'],
            $config['redis']['result_prefix'],
            $config['redis']['subtask_queue'],
            $config['redis']['result_queue'],
            $config['redis']['deadletter_queue'],
            $config['redis']['worker_hash']
        )
    );

    if (($parts[0] ?? '') === 'penerbang') {
        $id = $parts[1] ?? null;
        match ($method) {
            'GET' => $id ? $penerbang->show($id) : $penerbang->index(),
            'POST' => $penerbang->store(),
            'PUT' => $id ? $penerbang->update($id) : Response::json(['message' => 'ID wajib diisi'], 422),
            'DELETE' => $id ? $penerbang->destroy($id) : Response::json(['message' => 'ID wajib diisi'], 422),
            default => Response::json(['message' => 'Method tidak didukung'], 405),
        };
        exit;
    }

    if (($parts[0] ?? '') === 'data') {
        $module = $parts[1] ?? '';
        $id = $parts[2] ?? null;
        match ($method) {
            'GET' => $data->index($module),
            'POST' => $data->store($module),
            'PUT' => $id ? $data->update($module, $id) : Response::json(['message' => 'ID wajib diisi'], 422),
            'DELETE' => $id ? $data->destroy($module, $id) : Response::json(['message' => 'ID wajib diisi'], 422),
            default => Response::json(['message' => 'Method tidak didukung'], 405),
        };
        exit;
    }

    if (($parts[0] ?? '') === 'import') {
        if (($parts[1] ?? '') === 'upload' && $method === 'POST') {
            $import->upload();
            exit;
        }
        if (($parts[1] ?? '') === 'history' && $method === 'GET') {
            $import->history();
            exit;
        }
        if (($parts[1] ?? '') === 'mapping-template') {
            $import->templates();
            exit;
        }

        $importId = $parts[1] ?? '';
        $action = $parts[2] ?? '';
        if ($importId !== '' && $action === 'preview' && $method === 'GET') {
            $import->preview($importId);
            exit;
        }
        if ($importId !== '' && $action === 'mapping' && $method === 'POST') {
            $import->mapping($importId);
            exit;
        }
        if ($importId !== '' && $action === 'validate' && $method === 'POST') {
            $import->validate($importId);
            exit;
        }
        if ($importId !== '' && $action === 'commit' && $method === 'POST') {
            $import->commit($importId);
            exit;
        }
        if ($importId !== '' && $action === 'errors.csv' && $method === 'GET') {
            $import->errorsCsv($importId);
            exit;
        }
    }

    if (($parts[0] ?? '') === 'validasi') {
        if (($parts[1] ?? '') === 'run' && $method === 'POST') {
            $validation->run();
            exit;
        }
        if (($parts[1] ?? '') === 'history' && $method === 'GET') {
            $validation->history();
            exit;
        }
        $jobId = $parts[1] ?? '';
        $action = $parts[2] ?? '';
        if ($jobId !== '' && $action === '' && $method === 'GET') {
            $validation->show($jobId);
            exit;
        }
        if ($jobId !== '' && $action === 'export' && $method === 'GET') {
            $validation->export($jobId);
            exit;
        }
    }

    if (($parts[0] ?? '') === 'jobs') {
        if (($parts[1] ?? '') === '' && $method === 'POST') {
            $distributed->submitJob();
            exit;
        }
        $jobId = $parts[1] ?? '';
        $action = $parts[2] ?? '';
        if ($jobId !== '' && $action === '' && $method === 'GET') {
            $distributed->showJob($jobId);
            exit;
        }
        if ($jobId !== '' && $action === 'result' && $method === 'GET') {
            $distributed->jobResult($jobId);
            exit;
        }
    }

    if (($parts[0] ?? '') === 'cluster' && ($parts[1] ?? '') === 'status' && $method === 'GET') {
        $distributed->clusterStatus();
        exit;
    }

    if (($parts[0] ?? '') === 'analitik' && ($parts[1] ?? '') === 'survival' && $method === 'GET') {
        $analytics->survival();
        exit;
    }

    Response::json(['message' => 'Endpoint tidak ditemukan'], 404);
} catch (Throwable $exception) {
    Response::json(['message' => $exception->getMessage()], 500);
}
