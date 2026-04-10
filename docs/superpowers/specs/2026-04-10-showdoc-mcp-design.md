# ShowDoc MCP 设计文档

## 概述

实现一个自定义MCP服务器，用于从私有部署的ShowDoc服务获取文档内容。

## 工具定义

### 工具名称
`get_showdoc_content`

### 功能描述
从ShowDoc链接获取文档内容

### 输入参数
| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `url` | string | 是 | ShowDoc文档链接，格式：`http://服务器地址/doc/web/#/目录ID/page_id` |
| `user_token` | string | 是 | 用户认证token |

### 输出内容
- 文档标题
- 文档内容（Markdown格式）
- 文档元信息（page_id、创建时间等，如果API返回）

## 技术实现

### URL解析逻辑
从链接 `http://服务器地址/doc/web/#/目录ID/page_id` 中提取：
- **服务器地址**：`#` 之前的部分去掉 `/doc/web/`，用于拼接API地址
- **page_id**：`#` 后面第二段数字

例如：
- 输入链接：`http://121.36.86.253/doc/web/#/3/2587`
- 提取服务器：`http://121.36.86.253`
- 提取page_id：`2587`

### API调用
- **API地址**：`{服务器地址}/doc/server/index.php?s=/api/page/info`
- **请求方式**：POST
- **表单数据**：
  - `page_id`: 从URL解析得到
  - `user_token`: 用户提供的认证token

### 错误处理
| 错误场景 | 处理方式 |
|---------|---------|
| URL格式不匹配 | 返回错误提示，说明正确格式 |
| API请求失败 | 返回错误信息和HTTP状态码 |
| 认证失败 | 提示检查user_token是否正确 |

## 项目结构

### 技术栈
- Node.js + TypeScript
- MCP SDK：`@modelcontextprotocol/sdk`

### 文件结构
```
showdoc-mcp/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts          # MCP服务入口
├── dist/                  # 编译输出
└── README.md
```

## Claude Code配置

### 配置位置
项目目录 `.claude/settings.json` 或用户全局配置

### 配置示例
```json
{
  "mcpServers": {
    "showdoc": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "E:\\project\\showdoc-mcp"
    }
  }
}
```

### 开发调试
- 编译：`npm run build` 或 `tsc`
- 运行：`node dist/index.js`
- 测试：在Claude Code中调用工具验证

## 限制说明

- URL格式固定为 `http://服务器地址/doc/web/#/数字/page_id`
- 需要用户提供有效的 `user_token`
- 当前仅实现获取单个文档内容功能

## 未来扩展（可选）

后续如需扩展，可考虑添加：
- 配置管理工具：保存服务器地址和token，避免每次输入
- 文档目录列表工具：获取可访问文档列表
- 搜索文档工具：通过关键词搜索