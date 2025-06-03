#!/bin/bash

# 修仙世界游戏 - 超快速安装脚本
# 使用方法: curl -fsSL https://your-domain.com/quick-install.sh | bash

set -e

echo "🏮 修仙世界游戏 - 超快速安装 🏮"
echo "=============================="
echo ""

# 下载并运行完整安装脚本
echo "📥 下载安装脚本..."
curl -fsSL https://raw.githubusercontent.com/your-username/cultivation-game/main/install.sh -o /tmp/cultivation-install.sh

echo "🚀 开始安装..."
chmod +x /tmp/cultivation-install.sh
bash /tmp/cultivation-install.sh

# 清理临时文件
rm -f /tmp/cultivation-install.sh

echo ""
echo "✨ 快速安装完成！"
