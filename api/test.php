<?php
// 直接API测试文件
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

echo json_encode([
    'success' => true,
    'message' => 'API测试成功！',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'php_version' => PHP_VERSION,
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Not set',
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Not set',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'Not set',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Not set'
    ]
]);
?>