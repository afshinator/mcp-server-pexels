/**
 * Debug logging utility for mcp-server-pexels.
 *
 * All log output goes to stderr via console.error — stdout is reserved
 * for JSON-RPC messages and must never be used for logging.
 *
 * Enable with DEBUG=1 or LOG_LEVEL=debug in the environment.
 */

export function isDebugEnabled(): boolean {
  return process.env.DEBUG === '1' || process.env.LOG_LEVEL === 'debug';
}

export function logDebug(...args: unknown[]): void {
  if (isDebugEnabled()) {
    console.error('[pexels]', ...args);
  }
}
