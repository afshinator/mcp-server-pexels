import type { CallToolResult } from './types.js';

export class MissingKeyError extends Error {
  constructor() {
    super('PEXELS_API_KEY environment variable is not set.');
    this.name = 'MissingKeyError';
  }
}

export class PexelsApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly headers: Headers,
  ) {
    super(`Pexels API error: ${status} ${statusText}`);
    this.name = 'PexelsApiError';
  }
}

export function parseRateLimit(headers: Headers): string | null {
  const resetValue = headers.get('x-ratelimit-reset');
  if (!resetValue) return null;

  const resetSeconds = parseInt(resetValue, 10);
  if (Number.isNaN(resetSeconds)) return null;

  const resetDate = new Date(Date.now() + resetSeconds * 1000);
  return resetDate.toLocaleTimeString();
}

export function formatApiError(error: unknown): CallToolResult {
  if (error instanceof PexelsApiError) {
    const { status, headers } = error;

    if (status === 401) {
      return {
        content: [{ type: 'text', text: 'Pexels API request unauthorized. Check that PEXELS_API_KEY is set correctly in your MCP client config.' }],
        isError: true,
      };
    }

    if (status === 429) {
      const resetTime = parseRateLimit(headers);
      const retryNote = resetTime ? ` Retry after ${resetTime}.` : '';
      return {
        content: [{ type: 'text', text: `Pexels rate limit reached.${retryNote}` }],
        isError: true,
      };
    }

    if (status === 404) {
      return {
        content: [{ type: 'text', text: 'The requested resource was not found on Pexels.' }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: `Pexels API is temporarily unavailable (HTTP ${status}). Try again shortly.` }],
      isError: true,
    };
  }

  if (error instanceof MissingKeyError) {
    return {
      content: [{ type: 'text', text: 'PEXELS_API_KEY is not set. Add it to your environment or MCP client config (e.g., claude_desktop_config.json).' }],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text', text: 'An unexpected error occurred while contacting Pexels.' }],
    isError: true,
  };
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
