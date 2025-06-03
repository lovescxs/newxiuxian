<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));
$action = end($pathParts);

// 验证管理员权限
$user = getCurrentUser();
if (!$user || !$user['is_admin']) {
    errorResponse('权限不足', 403);
}

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'users':
                getAllUsers();
                break;
            case 'stats':
                getAdminStats();
                break;
            case 'logs':
                getGameLogs();
                break;
            case 'announcements':
                getAnnouncements();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    case 'POST':
        switch ($action) {
            case 'ban':
                banUser();
                break;
            case 'unban':
                unbanUser();
                break;
            case 'announcement':
                createAnnouncement();
                break;
            case 'reset-password':
                resetUserPassword();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    case 'DELETE':
        switch ($action) {
            case 'user':
                deleteUser();
                break;
            case 'announcement':
                deleteAnnouncement();
                break;
            default:
                errorResponse('未知的操作', 404);
        }
        break;
    default:
        errorResponse('不支持的请求方法', 405);
}

function getAllUsers() {
    $page = max((int)($_GET['page'] ?? 1), 1);
    $limit = min((int)($_GET['limit'] ?? 20), 100);
    $offset = ($page - 1) * $limit;
    $search = $_GET['search'] ?? '';
    
    try {
        $db = getDB();
        
        $whereClause = '';
        $params = [];
        
        if (!empty($search)) {
            $whereClause = 'WHERE u.username LIKE ?';
            $params[] = "%{$search}%";
        }
        
        // 获取用户列表
        $stmt = $db->prepare("
            SELECT u.id, u.username, u.email, u.is_admin, u.is_banned, u.created_at, u.last_login,
                   pd.level, pd.experience, pd.gold, pd.spirit_stones, pd.realm
            FROM users u
            LEFT JOIN player_data pd ON u.id = pd.user_id
            {$whereClause}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([...$params, $limit, $offset]);
        $users = $stmt->fetchAll();
        
        // 获取总数
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM users u {$whereClause}");
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // 格式化数据
        foreach ($users as &$user) {
            $user['is_admin'] = (bool)$user['is_admin'];
            $user['is_banned'] = (bool)$user['is_banned'];
            $user['created_at'] = date('Y-m-d H:i:s', strtotime($user['created_at']));
            $user['last_login'] = $user['last_login'] ? date('Y-m-d H:i:s', strtotime($user['last_login'])) : null;
        }
        
        jsonResponse([
            'success' => true,
            'users' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
        
    } catch (PDOException $e) {
        errorResponse('获取用户列表失败', 500);
    }
}

function banUser() {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? 0;
    $reason = trim($input['reason'] ?? '违反游戏规则');
    
    if (!$userId) {
        errorResponse('用户ID不能为空');
    }
    
    try {
        $db = getDB();
        
        // 检查用户是否存在
        $stmt = $db->prepare('SELECT username, is_admin FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $targetUser = $stmt->fetch();
        
        if (!$targetUser) {
            errorResponse('用户不存在');
        }
        
        if ($targetUser['is_admin']) {
            errorResponse('不能封禁管理员账户');
        }
        
        // 封禁用户
        $stmt = $db->prepare('UPDATE users SET is_banned = 1 WHERE id = ?');
        $stmt->execute([$userId]);
        
        // 移除在线状态
        $stmt = $db->prepare('DELETE FROM online_users WHERE user_id = ?');
        $stmt->execute([$userId]);
        
        // 发送系统消息
        $stmt = $db->prepare('
            INSERT INTO chat_messages (username, message, message_type) 
            VALUES ("系统", ?, "system")
        ');
        $stmt->execute(["用户 {$targetUser['username']} 已被封禁，原因：{$reason}"]);
        
        jsonResponse([
            'success' => true,
            'message' => '用户封禁成功'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('封禁用户失败', 500);
    }
}

function unbanUser() {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? 0;
    
    if (!$userId) {
        errorResponse('用户ID不能为空');
    }
    
    try {
        $db = getDB();
        
        // 检查用户是否存在
        $stmt = $db->prepare('SELECT username FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $targetUser = $stmt->fetch();
        
        if (!$targetUser) {
            errorResponse('用户不存在');
        }
        
        // 解封用户
        $stmt = $db->prepare('UPDATE users SET is_banned = 0 WHERE id = ?');
        $stmt->execute([$userId]);
        
        // 发送系统消息
        $stmt = $db->prepare('
            INSERT INTO chat_messages (username, message, message_type) 
            VALUES ("系统", ?, "system")
        ');
        $stmt->execute(["用户 {$targetUser['username']} 已被解封"]);
        
        jsonResponse([
            'success' => true,
            'message' => '用户解封成功'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('解封用户失败', 500);
    }
}

function createAnnouncement() {
    global $user;
    
    $input = json_decode(file_get_contents('php://input'), true);
    $title = trim($input['title'] ?? '');
    $content = trim($input['content'] ?? '');
    
    if (empty($title) || empty($content)) {
        errorResponse('标题和内容不能为空');
    }
    
    if (strlen($title) > 200) {
        errorResponse('标题长度不能超过200字符');
    }
    
    if (strlen($content) > 1000) {
        errorResponse('内容长度不能超过1000字符');
    }
    
    try {
        $db = getDB();
        
        // 创建公告
        $stmt = $db->prepare('
            INSERT INTO announcements (title, content, admin_id) 
            VALUES (?, ?, ?)
        ');
        $stmt->execute([$title, $content, $user['user_id']]);
        
        // 发送系统消息到聊天室
        $stmt = $db->prepare('
            INSERT INTO chat_messages (username, message, message_type) 
            VALUES ("系统公告", ?, "system")
        ');
        $stmt->execute(["【{$title}】{$content}"]);
        
        jsonResponse([
            'success' => true,
            'message' => '公告发布成功'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('发布公告失败', 500);
    }
}

function getAnnouncements() {
    $limit = min((int)($_GET['limit'] ?? 10), 50);
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare('
            SELECT a.id, a.title, a.content, a.created_at, a.is_active,
                   u.username as admin_name
            FROM announcements a
            JOIN users u ON a.admin_id = u.id
            ORDER BY a.created_at DESC
            LIMIT ?
        ');
        $stmt->execute([$limit]);
        $announcements = $stmt->fetchAll();
        
        foreach ($announcements as &$announcement) {
            $announcement['is_active'] = (bool)$announcement['is_active'];
            $announcement['created_at'] = date('Y-m-d H:i:s', strtotime($announcement['created_at']));
        }
        
        jsonResponse([
            'success' => true,
            'announcements' => $announcements
        ]);
        
    } catch (PDOException $e) {
        errorResponse('获取公告列表失败', 500);
    }
}

function getAdminStats() {
    try {
        $db = getDB();
        
        // 用户统计
        $stmt = $db->query('SELECT COUNT(*) as total FROM users');
        $totalUsers = $stmt->fetch()['total'];
        
        $stmt = $db->query('SELECT COUNT(*) as banned FROM users WHERE is_banned = 1');
        $bannedUsers = $stmt->fetch()['banned'];
        
        $stmt = $db->query('SELECT COUNT(*) as online FROM online_users WHERE last_activity > DATE_SUB(NOW(), INTERVAL 5 MINUTE)');
        $onlineUsers = $stmt->fetch()['online'];
        
        // 消息统计
        $stmt = $db->query('SELECT COUNT(*) as total FROM chat_messages');
        $totalMessages = $stmt->fetch()['total'];
        
        $stmt = $db->query('SELECT COUNT(*) as today FROM chat_messages WHERE DATE(created_at) = CURDATE()');
        $todayMessages = $stmt->fetch()['today'];
        
        // 游戏统计
        $stmt = $db->query('SELECT AVG(level) as avg_level, MAX(level) as max_level FROM player_data');
        $levelStats = $stmt->fetch();
        
        $stmt = $db->query('SELECT COUNT(*) as total FROM game_logs WHERE DATE(created_at) = CURDATE()');
        $todayActions = $stmt->fetch()['total'];
        
        jsonResponse([
            'success' => true,
            'stats' => [
                'users' => [
                    'total' => $totalUsers,
                    'banned' => $bannedUsers,
                    'online' => $onlineUsers,
                    'active' => $totalUsers - $bannedUsers
                ],
                'messages' => [
                    'total' => $totalMessages,
                    'today' => $todayMessages
                ],
                'game' => [
                    'avg_level' => round($levelStats['avg_level'], 1),
                    'max_level' => $levelStats['max_level'],
                    'today_actions' => $todayActions
                ]
            ]
        ]);
        
    } catch (PDOException $e) {
        errorResponse('获取统计数据失败', 500);
    }
}

function getGameLogs() {
    $limit = min((int)($_GET['limit'] ?? 50), 200);
    $userId = $_GET['user_id'] ?? null;
    $action = $_GET['action'] ?? null;
    
    try {
        $db = getDB();
        
        $whereClause = 'WHERE 1=1';
        $params = [];
        
        if ($userId) {
            $whereClause .= ' AND gl.user_id = ?';
            $params[] = $userId;
        }
        
        if ($action) {
            $whereClause .= ' AND gl.action LIKE ?';
            $params[] = "%{$action}%";
        }
        
        $stmt = $db->prepare("
            SELECT gl.id, gl.action, gl.details, gl.created_at,
                   u.username
            FROM game_logs gl
            JOIN users u ON gl.user_id = u.id
            {$whereClause}
            ORDER BY gl.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([...$params, $limit]);
        $logs = $stmt->fetchAll();
        
        foreach ($logs as &$log) {
            $log['details'] = json_decode($log['details'], true);
            $log['created_at'] = date('Y-m-d H:i:s', strtotime($log['created_at']));
        }
        
        jsonResponse([
            'success' => true,
            'logs' => $logs
        ]);
        
    } catch (PDOException $e) {
        errorResponse('获取游戏日志失败', 500);
    }
}

function deleteUser() {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? 0;
    
    if (!$userId) {
        errorResponse('用户ID不能为空');
    }
    
    try {
        $db = getDB();
        
        // 检查用户是否存在且不是管理员
        $stmt = $db->prepare('SELECT username, is_admin FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $targetUser = $stmt->fetch();
        
        if (!$targetUser) {
            errorResponse('用户不存在');
        }
        
        if ($targetUser['is_admin']) {
            errorResponse('不能删除管理员账户');
        }
        
        // 删除用户（级联删除相关数据）
        $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        
        jsonResponse([
            'success' => true,
            'message' => '用户删除成功'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('删除用户失败', 500);
    }
}

function deleteAnnouncement() {
    $input = json_decode(file_get_contents('php://input'), true);
    $announcementId = $input['announcement_id'] ?? 0;
    
    if (!$announcementId) {
        errorResponse('公告ID不能为空');
    }
    
    try {
        $db = getDB();
        
        // 检查公告是否存在
        $stmt = $db->prepare('SELECT id FROM chat_messages WHERE id = ? AND message_type = "announcement"');
        $stmt->execute([$announcementId]);
        $announcement = $stmt->fetch();
        
        if (!$announcement) {
            errorResponse('公告不存在');
        }
        
        // 删除公告
        $stmt = $db->prepare('DELETE FROM chat_messages WHERE id = ? AND message_type = "announcement"');
        $stmt->execute([$announcementId]);
        
        jsonResponse([
            'success' => true,
            'message' => '公告删除成功'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('删除公告失败', 500);
    }
}

function resetUserPassword() {
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? 0;
    $newPassword = $input['new_password'] ?? '';
    
    if (!$userId || !$newPassword) {
        errorResponse('用户ID和新密码不能为空');
    }
    
    if (strlen($newPassword) < 6) {
        errorResponse('密码长度至少6位');
    }
    
    try {
        $db = getDB();
        
        // 检查用户是否存在
        $stmt = $db->prepare('SELECT username FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $targetUser = $stmt->fetch();
        
        if (!$targetUser) {
            errorResponse('用户不存在');
        }
        
        // 重置密码
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $db->prepare('UPDATE users SET password = ? WHERE id = ?');
        $stmt->execute([$hashedPassword, $userId]);
        
        jsonResponse([
            'success' => true,
            'message' => '密码重置成功'
        ]);
        
    } catch (PDOException $e) {
        errorResponse('重置密码失败', 500);
    }
}
?>