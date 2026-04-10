# ShowDoc MCP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个MCP服务器工具，从私有部署的ShowDoc获取文档内容

**Architecture:** 单文件MCP服务器，包含URL解析、API调用、工具定义三个核心模块，通过stdio传输与Claude Code通信

**Tech Stack:** Node.js + TypeScript + @modelcontextprotocol/sdk

---

## 文件结构

```
showdoc-mcp/
├── package.json           # 项目配置，依赖声明
├── tsconfig.json          # TypeScript编译配置
├── src/
│   └── index.ts           # MCP服务入口（所有功能在此文件）
├── dist/                  # 编译输出（自动生成）
└── README.md              # 使用说明
```

---

### Task 1: 初始化项目

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `README.md`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "showdoc-mcp",
  "version": "1.0.0",
  "description": "MCP server for ShowDoc document retrieval",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "keywords": ["mcp", "showdoc"],
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: 创建 README.md**

```markdown
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
      "cwd": "E:\\project\\showdoc-mcp"
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
url: http://121.36.86.253/doc/web/#/3/2587
user_token: 83decdf3ad04176e9fe476608c83fc278b7236d3048afec6208d52d1a90b3e31
```
```

- [ ] **Step 4: 创建 src 目录**

运行命令：
```bash
mkdir src
```

- [ ] **Step 5: 安装依赖**

运行命令：
```bash
npm install
```

Expected: 依赖安装成功，生成 node_modules 目录

---

### Task 2: 实现URL解析功能

**Files:**
- Create: `src/index.ts`（部分实现，包含URL解析）

- [ ] **Step 1: 编写URL解析函数**

在 `src/index.ts` 中添加：

```typescript
/**
 * 解析ShowDoc URL，提取服务器地址和page_id
 * URL格式: http://服务器地址/doc/web/#/目录ID/page_id
 */
function parseShowDocUrl(url: string): { serverUrl: string; pageId: string } | null {
  try {
    // 检查URL是否包含 # 符号
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) {
      return null;
    }

    // 提取服务器地址：# 之前去掉 /doc/web/
    const baseUrl = url.substring(0, hashIndex);
    const serverUrl = baseUrl.replace('/doc/web/', '');

    // 提取page_id：# 后面第二段数字
    const hashPart = url.substring(hashIndex + 1);
    const segments = hashPart.split('/');
    if (segments.length < 2) {
      return null;
    }

    const pageId = segments[segments.length - 1];
    if (!/^\d+$/.test(pageId)) {
      return null;
    }

    return { serverUrl, pageId };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: 测试URL解析**

添加测试代码（临时，用于验证）：

```typescript
// 测试URL解析（开发时验证，生产环境删除）
const testUrl = 'http://121.36.86.253/doc/web/#/3/2587';
const parsed = parseShowDocUrl(testUrl);
console.log('Parsed result:', parsed);
// Expected: { serverUrl: 'http://121.36.86.253', pageId: '2587' }
```

- [ ] **Step 3: 编译并验证**

运行命令：
```bash
npm run build
node dist/index.js
```

Expected: 输出 `{ serverUrl: 'http://121.36.86.253', pageId: '2587' }`

---

### Task 3: 实现API调用功能

**Files:**
- Modify: `src/index.ts`（添加API调用函数）

- [ ] **Step 1: 添加API调用函数**

```typescript
/**
 * 调用ShowDoc API获取文档内容
 */
async function fetchShowDocContent(
  serverUrl: string,
  pageId: string,
  userToken: string
): Promise<{ title: string; content: string; meta?: any }> {
  const apiUrl = `${serverUrl}/doc/server/index.php?s=/api/page/info`;

  const formData = new URLSearchParams();
  formData.append('page_id', pageId);
  formData.append('user_token', userToken);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as any;

  // 检查API返回状态
  if (data.error_code !== 0) {
    throw new Error(`ShowDoc API error: ${data.error_message || 'Unknown error'}`);
  }

  return {
    title: data.data?.page_title || 'Untitled',
    content: data.data?.page_content || '',
    meta: {
      pageId: data.data?.page_id,
      createTime: data.data?.addtime,
      updateTime: data.data?.updatetime,
    },
  };
}
```

- [ ] **Step 2: 添加fetch polyfill（Node.js需要）**

在文件顶部添加：

```typescript
// Node.js fetch polyfill
import fetch from 'node-fetch';
// 如果node-fetch不可用，使用全局fetch（Node 18+）
```

更新 package.json 依赖：

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "node-fetch": "^2.7.0"
  }
}
```

- [ ] **Step 3: 安装node-fetch**

运行命令：
```bash
npm install node-fetch@2
```

- [ ] **Step 4: 测试API调用**

添加测试代码：

```typescript
// 测试API调用（开发时验证）
const testServerUrl = 'http://121.36.86.253';
const testPageId = '2587';
const testToken = '83decdf3ad04176e9fe476608c83fc278b7236d3048afec6208d52d1a90b3e31';

fetchShowDocContent(testServerUrl, testPageId, testToken)
  .then(result => console.log('API result:', result))
  .catch(err => console.error('API error:', err.message));
```

- [ ] **Step 5: 编译并验证**

运行命令：
```bash
npm run build
node dist/index.js
```

Expected: 输出文档内容或错误信息

---

### Task 4: 实现MCP服务器

**Files:**
- Modify: `src/index.ts`（完整MCP实现）

- [ ] **Step 1: 添加MCP SDK导入和初始化**

替换文件顶部内容：

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Node.js fetch
import fetch from 'node-fetch';
```

- [ ] **Step 2: 创建MCP服务器实例**

```typescript
// 创建MCP服务器
const server = new Server(
  {
    name: 'showdoc-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
```

- [ ] **Step 3: 注册工具列表**

```typescript
// 处理工具列表请求
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_showdoc_content',
        description: '从ShowDoc链接获取文档内容',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'ShowDoc文档链接，格式: http://服务器地址/doc/web/#/目录ID/page_id',
            },
            user_token: {
              type: 'string',
              description: '用户认证token',
            },
          },
          required: ['url', 'user_token'],
        },
      },
    ],
  };
});
```

- [ ] **Step 4: 实现工具调用处理**

```typescript
// 处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== 'get_showdoc_content') {
    throw new Error(`Unknown tool: ${name}`);
  }

  const { url, user_token } = args as { url: string; user_token: string };

  // 解析URL
  const parsed = parseShowDocUrl(url);
  if (!parsed) {
    return {
      content: [
        {
          type: 'text',
          text: `错误：URL格式不正确。正确格式: http://服务器地址/doc/web/#/目录ID/page_id`,
        },
      ],
      isError: true,
    };
  }

  // 获取文档内容
  try {
    const result = await fetchShowDocContent(parsed.serverUrl, parsed.pageId, user_token);

    const output = `# ${result.title}\n\n${result.content}\n\n---\n**元信息**\n- Page ID: ${result.meta?.pageId || 'N/A'}\n- 创建时间: ${result.meta?.createTime || 'N/A'}\n- 更新时间: ${result.meta?.updateTime || 'N/A'}`;

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `错误：获取文档失败 - ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});
```

- [ ] **Step 5: 启动服务器**

```typescript
// 启动MCP服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ShowDoc MCP server started'); // 使用console.error避免干扰stdio
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
```

- [ ] **Step 6: 移除测试代码**

删除之前添加的测试代码（parseShowDocUrl测试和fetchShowDocContent测试）

- [ ] **Step 7: 编译最终版本**

运行命令：
```bash
npm run build
```

Expected: 编译成功，生成 dist/index.js

---

### Task 5: 配置Claude Code并测试

**Files:**
- Create: `.claude/settings.json`

- [ ] **Step 1: 创建.claude目录**

运行命令：
```bash
mkdir -p .claude
```

- [ ] **Step 2: 创建settings.json配置**

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

- [ ] **Step 3: 重启Claude Code**

重启Claude Code以加载新配置

- [ ] **Step 4: 测试工具调用**

在Claude Code中测试：

```
使用 get_showdoc_content 工具获取文档：
url: http://121.36.86.253/doc/web/#/3/2587
user_token: 83decdf3ad04176e9fe476608c83fc278b7236d3048afec6208d52d1a90b3e31
```

Expected: 成功返回文档内容

---

## 自审检查

**1. Spec覆盖检查：**
- URL解析逻辑 → Task 2 ✓
- API调用 → Task 3 ✓
- MCP工具定义 → Task 4 ✓
- 错误处理 → Task 4（工具调用处理中） ✓
- Claude Code配置 → Task 5 ✓

**2. Placeholder扫描：** 无 TBD/TODO 等占位符 ✓

**3. 类型一致性检查：**
- `parseShowDocUrl` 返回 `{ serverUrl: string; pageId: string } | null` → Task 3 和 Task 4 使用一致 ✓
- `fetchShowDocContent` 返回 `{ title: string; content: string; meta?: any }` → Task 4 使用一致 ✓