import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerPhotoSearch } from './tools/photo-search.js';
import { registerVideoSearch } from './tools/video-search.js';
import { registerGetDetails } from './tools/get-details.js';

if (!process.env.PEXELS_API_KEY) {
  console.error('WARNING: PEXELS_API_KEY not set. Server will fail on first API call.');
}

const server = new McpServer(
  { name: 'mcp-server-pexels', version: '1.0.0' },
  {
    capabilities: { logging: {} },
    instructions:
      'This server provides access to the Pexels library of high-quality stock photos and videos. Every result includes mandatory photographer attribution — always display it. Each tool response contains two content blocks per result: (1) a text block with metadata and a markdown image link, and (2) an image block with a url field pointing to the medium-resolution thumbnail. If the image block does not render in your client, use the markdown image link in the text block. Pexels rate limit is 200 requests/hour; the server caches results to preserve quota. Use force_refresh parameter to bypass cache.',
  },
);

registerPhotoSearch(server);
registerVideoSearch(server);
registerGetDetails(server);

const transport = new StdioServerTransport();

console.error('MCP Server for Pexels starting...');

server.connect(transport).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});