import type { ContentBlock } from './types.js';

export interface CallToolResult {
  content: ContentBlock[];
  isError?: boolean;
}

export function parseRateLimit(headers: Headers): string | null {
  const resetValue = headers.get('x-ratelimit-reset');
  if (!resetValue) return null;

  const resetSeconds = parseInt(resetValue, 10);
  if (Number.isNaN(resetSeconds)) return null;

  const resetDate = new Date(Date.now() + resetSeconds * 1000);
  return resetDate.toLocaleTimeString();
}

export function formatPexelsError(
  type: 'rate_limit' | 'invalid_query' | 'not_found',
  resetTime?: string,
): CallToolResult {
  let message = '';

  switch (type) {
    case 'rate_limit':
      message = `Pexels rate limit reached. Search capability will resume at ${resetTime ?? '[unknown time]'}.`;
      break;
    case 'invalid_query':
      message = 'Invalid query. Please check your search parameters.';
      break;
    case 'not_found':
      message = 'The requested resource was not found.';
      break;
  }

  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}
