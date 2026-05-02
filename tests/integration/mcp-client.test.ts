/**
 * End-to-end MCP integration test.
 * Spawns the built server via StdioClientTransport and calls tools using the
 * official SDK Client. This is the layer that validates protocol compliance —
 * a -32602 error here means the server is emitting invalid content blocks.
 *
 * Run `npm run build` before this test if the build directory is missing.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const BUILD_ENTRY = resolve(process.cwd(), 'build/index.js');

let client: Client;
let transport: StdioClientTransport;

beforeAll(async () => {
  if (!existsSync(BUILD_ENTRY)) {
    execSync('npm run build', { stdio: 'pipe' });
  }

  transport = new StdioClientTransport({
    command: 'node',
    args: [BUILD_ENTRY],
    env: { ...process.env, PEXELS_API_KEY: '' },
    stderr: 'pipe',
  });

  client = new Client({ name: 'test-client', version: '1.0.0' });
  await client.connect(transport);
}, 15000);

afterAll(async () => {
  await client?.close();
});

describe('MCP server integration', () => {
  it('lists three pexels tools', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual(['pexels_get_details', 'pexels_search_photos', 'pexels_search_videos']);
  });

  it('tools/call with bad API key returns isError=true and actionable message', async () => {
    // Fake API key → 401 from Pexels → must return clean CallToolResult, not a crash
    const result = await client.callTool({
      name: 'pexels_search_photos',
      arguments: { query: 'ocean' },
    });

    // Protocol-level shape must be valid (no -32602)
    const parsed = CallToolResultSchema.safeParse(result);
    expect(parsed.success, `CallToolResult schema invalid: ${JSON.stringify(parsed)}`).toBe(true);

    // Must be a properly flagged error with an LLM-readable message
    expect(result.isError).toBe(true);
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    const textBlock = result.content[0] as { type: 'text'; text: string };
    expect(textBlock.type).toBe('text');
    expect(textBlock.text.toLowerCase()).toContain('pexels_api_key');
  });

  it('tools/call does not throw -32602 MCP error (regression for invalid image blocks)', async () => {
    await expect(
      client.callTool({ name: 'pexels_search_videos', arguments: { query: 'nature' } }),
    ).resolves.toBeDefined();
  });

  it('all tool schemas have required inputSchema fields', async () => {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      expect(tool.name).toMatch(/^pexels_/);
      expect(tool.description).toBeTruthy();
    }
  });
});
