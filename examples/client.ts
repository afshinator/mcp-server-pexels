/**
 * Minimal MCP SDK client example for mcp-server-pexels.
 *
 * Run:
 *   npm run build
 *   npx tsx examples/client.ts
 *
 * This demonstrates tools/list + tools/call using the official
 * @modelcontextprotocol/sdk Client + StdioClientTransport.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILD_ENTRY = resolve(__dirname, '..', 'build', 'index.js');

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [BUILD_ENTRY],
    env: { ...process.env },
  });

  const client = new Client(
    { name: 'pexels-example-client', version: '1.0.0' },
    { capabilities: {} },
  );

  await client.connect(transport);
  console.log('Connected to mcp-server-pexels\n');

  // 1. List available tools
  const { tools } = await client.listTools();
  console.log('Available tools:');
  for (const tool of tools) {
    console.log(`  - ${tool.name}: ${tool.title ?? tool.description ?? '(no description)'}`);
  }
  console.log();

  // 2. Call pexels_search_photos
  //    (Requires PEXELS_API_KEY to be set in the environment)
  if (!process.env.PEXELS_API_KEY) {
    console.log('PEXELS_API_KEY not set — skipping search call.');
    console.log('Set the env var and re-run to see search results.');
  } else {
    const result = await client.callTool({
      name: 'pexels_search_photos',
      arguments: { query: 'nature', per_page: 3 },
    });

    console.log('Search result:');
    for (const block of result.content) {
      if (block.type === 'text') {
        console.log(block.text);
      } else if (block.type === 'resource_link') {
        console.log(`  → media: ${block.uri} (${block.mimeType})`);
      }
    }
  }

  await client.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
