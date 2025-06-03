<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$action = end($pathParts);

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'messages':
                getMessages();
                break;
            case 'online':
                getOnlineUsers();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    case 'POST':
        switch ($action) {
            case 'send':
                sendMessage();
                break;
            case 'clear':
                clearMessages();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    default:
        errorResponse('不支持的请求方法', 405);
}

function getMessages() {
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    $offset = max((int)($_GET['offset'] ?? 0), 0);
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare('
            SELECT cm.id, cm.username, cm.message, cm.message_type, cm.created_at,
                   u.is_admin
            FROM chat_messages cm
            LEFT JOIN users u ON cm.user_id = u.id
            ORDER BY cm.created_at DESC
            LIMIT ? OFFSET ?
        ');
        $stmt->execute([$limit, $offset]);
        $messages = $stmt->fetchAll();
        
        // 反转数组，使最新消息在底部
        $messages = array_reverse($messages);
        
        // 格式化消息
        foreach ($messages as &$message) {
            $message['is_admin'] = (bool)$message['is_admin'];
            $message['created_at'] = date('H:i:s', strtotime($message['created_at']));
        }
        
        jsonResponse([
            'success' => true,
            'messages' => $messages
        ]);
        
    } catch (PDOException $e) {
        errorResponse('获取消息失败', 500);
    }
}

function sendMessage() {
    $user = getCurrentUser();
    if (!$user) {
        errorResponse('未登录', 401);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $message = trim($input['message'] ?? '');
    
    if (empty($message)) {
        errorResponse('消息内容不能为空');
    }
    
    if (strlen($message) > 500) {
        errorResponse('消息长度不能超过500字符');
    }
    
    // 简单的内容过滤
    $bannedWords = ['fuck', 'shit', 'damn', '操', '草', '妈的', '傻逼'];
    foreach ($bannedWords as $word) {
        if (stripos($message, $word) !== false) {
            errorResponse('消息包含不当内容');
        }
    }
    
    try {
        $db = getDB();
        
        // 检查用户是否被封禁
        $stmt = $db->prepare('SELECT is_banned FROM users WHERE id = ?');
        $stmt->execute([$user['user_id']]);
        $userData = $stmt->fetch();
        
        if ($userData['is_banned']) {
            errorResponse('账号已被封禁，无法发送消息', 403);
        }
        
        // 检查发言频率限制（防刷屏）
        $stmt = $db->prepare('
            SELECT COUNT(*) as count FROM chat_messages 
            WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
        ');
        $stmt->execute([$user['user_id']]);
        $recentCount = $stmt->fetch()['count'];
        
        if ($recentCount >= 5) {
            errorResponse('发言过于频繁，请稍后再试');
        }
        
        // 插入消息
        $messageType = $user['is_admin'] ? 'admin' : 'user';
        $stmt = $db->prepare('
            INSERT INTO chat_messages (user_id, username, message, message_type) 
            VALUES (?, ?, ?, ?)
        ');
        $stmt->execute([$user['user_id'], $user['username'], $message, $messageType]);
        
        $messageId = $db->lastInsertId();
        
        // 更新在线状态
        $stmt = $db->prepare('
            INSERT INTO online_users (user_id) VALUES (?) 
            ON DUPLICATE KEY UPDATE last_activity = NOW()
        ');
        $stmt->execute([$user['user_id']]);
        
        jsonResponse([
            'success' => true,
            'message_id' => $messageId,
            'message' => '消息发送成功'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('发送消息失败', 500);
    }
}

function clearMessages() {
    $user = getCurrentUser();
    if (!$user || !$user['is_admin']) {
        errorResponse('权限不足', 403);
    }
    
    try {
        $db = getDB();
        
        // 清空聊天记录
        $stmt = $db->prepare('DELETE FROM chat_messages');
        $stmt->execute();
        
        // 发送系统消息
        $stmt = $db->prepare('
            INSERT INTO chat_messages (username, message, message_type) 
            VALUES ("系统", "聊天记录已被管理员清空", "system")
        ');
        $stmt->execute();
        
        jsonResponse([
            'success' => true,
            'message' => '聊天记录清空成功'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('清空聊天记录失败', 500);
    }
}

function getOnlineUsers() {
    try {
        $db = getDB();
        
        $stmt = $db->prepare('
            SELECT u.username, u.is_admin, ou.last_activity
            FROM online_users ou
            JOIN users u ON ou.user_id = u.id
            WHERE ou.last_activity > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            ORDER BY ou.last_activity DESC
        ');
        $stmt->execute();
        $onlineUsers = $stmt->fetchAll();
        
        foreach ($onlineUsers as &$user) {
            $user['is_admin'] = (bool)$user['is_admin'];
            $user['last_activity'] = date('H:i:s', strtotime($user['last_activity']));
        }
        
        jsonResponse([
            'success' => true,
            'online_users' => $onlineUsers,
            'count' => count($onlineUsers)
        ]);
        
    } catch (PDOException $e) {
        errorResponse('获取在线用户失败', 500);
    }
}
?>