/**
 * ShowDoc MCP Server
 * 用于从ShowDoc获取文档内容
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Node.js fetch polyfill
import fetch from 'node-fetch';

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

// 处理工具调用请求
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== 'get_showdoc_content') {
    throw new Error(`Unknown tool: ${name}`);
  }

  // 验证输入参数
  if (!args || typeof args.url !== 'string' || typeof args.user_token !== 'string') {
    return {
      content: [{ type: 'text', text: '错误：缺少必要参数 url 或 user_token' }],
      isError: true,
    };
  }
  const { url, user_token } = args;

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

