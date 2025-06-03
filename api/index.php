<?php
require_once 'config.php';

// 获取请求路径
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// 移除 'api' 部分
if ($pathParts[0] === 'api') {
    array_shift($pathParts);
}

$module = $pathParts[0] ?? '';

// 路由到对应的模块
switch ($module) {
    case 'auth':
        require_once 'auth.php';
        break;
    case 'game':
        require_once 'game.php';
        break;
    case 'chat':
        require_once 'chat.php';
        break;
    case 'admin':
        require_once 'admin.php';
        break;
    case 'cultivation':
        require_once 'cultivation.php';
        break;
    case 'quests':
        require_once 'quests.php';
        break;
    case 'test':
        testAPI();
        break;
    default:
        errorResponse('API模块不存在', 404);
}

function testAPI() {
    jsonResponse([
        'success' => true,
        'message' => '修仙游戏API服务正常运行',
        'version' => '1.0.0',
        'timestamp' => date('Y-m-d H:i:s'),
        'endpoints' => [
            'auth' => [
                'POST /api/auth/register' => '用户注册',
                'POST /api/auth/login' => '用户登录',
                'POST /api/auth/logout' => '用户登出',
                'GET /api/auth/profile' => '获取用户信息',
                'GET /api/auth/verify' => '验证Token'
            ],
            'game' => [
                'GET /api/game/data' => '获取游戏数据',
                'POST /api/game/save' => '保存游戏数据',
                'GET /api/game/leaderboard' => '获取排行榜',
                'GET /api/game/stats' => '获取游戏统计',
                'POST /api/game/action' => '记录游戏行为'
            ],
            'chat' => [
                'GET /api/chat/messages' => '获取聊天消息',
                'POST /api/chat/send' => '发送消息',
                'POST /api/chat/clear' => '清空聊天记录（管理员）',
                'GET /api/chat/online' => '获取在线用户'
            ],
            'admin' => [
                'GET /api/admin/users' => '获取用户列表',
                'POST /api/admin/ban' => '封禁用户',
                'POST /api/admin/unban' => '解封用户',
                'POST /api/admin/announcement' => '发布公告',
                'GET /api/admin/stats' => '获取管理统计',
                'GET /api/admin/logs' => '获取游戏日志',
                'DELETE /api/admin/user' => '删除用户'
            ]
        ]
    ]);
}