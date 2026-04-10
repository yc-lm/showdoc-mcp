# ShowDoc MCP

MCP 服务器，用于从私有部署的 ShowDoc 服务获取文档内容。

## 功能

- 通过 ShowDoc URL 获取文档内容
- 支持环境变量配置认证 Token
- 自动解析文档标题和内容
- 输出文档元信息（创建时间、更新时间等）

## 安装

```bash
npm install
npm run build
```

## 配置

### 1. MCP 服务器配置

在 Claude Code 的 `.claude.json` 中添加：

```json
{
  "mcpServers": {
    "showdoc": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/showdoc-mcp",
      "env": {
        "SHOWDOC_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

> 注意：`cwd` 需要改为你的实际项目路径。Windows 路径使用正斜杠 `/` 或双反斜杠 `\\`。

### 2. 认证 Token 配置

有两种方式配置 `user_token`：

**方式一：环境变量（推荐）**

设置环境变量 `SHOWDOC_TOKEN`：

```bash
# Windows
set SHOWDOC_TOKEN=your_api_token_here

# Linux/macOS
export SHOWDOC_TOKEN=your_api_token_here
```

或在 Claude Code 的 MCP 配置中添加环境变量：

```json
{
  "mcpServers": {
    "showdoc": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/showdoc-mcp",
      "env": {
        "SHOWDOC_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

**方式二：调用时传参**

每次调用工具时传入 `user_token` 参数。

### 3. 如何获取 user_token

在 ShowDoc 系统中：
1. 登录 ShowDoc
2. 进入「个人设置」页面
3. 找到「API密钥」或「user_token」字段

## 使用

### 工具名称

`get_showdoc_content`

### 参数

| 参数 | 必选 | 说明 |
|------|------|------|
| `url` | 是 | ShowDoc 文档链接，格式：`http://服务器地址/doc/web/#/目录ID/page_id` |
| `user_token` | 否 | 用户认证 Token，未传时使用环境变量 `SHOWDOC_TOKEN` |

### 示例

```
url: http://your-server.com/doc/web/#/3/2587
```

如果已配置环境变量，无需传入 `user_token`：

```
url: http://your-server.com/doc/web/#/目录ID/page_id
user_token: （可选，已通过环境变量配置）
```

### 返回格式

返回的文档内容包含：

```
# 文档标题

文档正文内容...

---
**元信息**
- Page ID: 2587
- 创建时间: 2023-04-11 14:13:51
- 更新时间: 2025-01-20 10:30:00
```

## 开发

```bash
# 构建
npm run build

# 启动（用于调试）
npm run start
```

## 技术栈

- TypeScript
- @modelcontextprotocol/sdk
- node-fetch

## License

MIT
