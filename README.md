# ShowDoc MCP

MCP服务器，用于从私有部署的ShowDoc服务获取文档内容。

## 安装

```bash
npm install
npm run build
```

## 配置

在 Claude Code 的 `.claude/settings.json` 中添加：

```json
{
  "mcpServers": {
    "showdoc": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/showdoc-mcp"
    }
  }
}
```

## 使用

工具名称：`get_showdoc_content`

参数：
- `url`: ShowDoc文档链接，格式 `http://服务器/doc/web/#/目录ID/page_id`
- `user_token`: 用户认证token

示例：
```
url: http://your-server.com/doc/web/#/3/2587
user_token: your_api_token_here
```