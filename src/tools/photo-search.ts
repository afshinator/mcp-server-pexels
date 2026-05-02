import type { ContentBlock, PexelsPhoto } from '../shared/types.js';
import { photoSearchSchema } from '../utils/validation.js';
import { fetchPhotoSearch } from '../shared/api-client.js';
import { getFromCache, setCache, makeCacheKey } from '../shared/cache.js';
import { formatPexelsError } from '../shared/errors.js';

export function formatPhotoResult(photo: PexelsPhoto): ContentBlock[] {
  const photographerHandle = photo.photographer
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');

  const text = `Photo by [${photo.photographer}](https://www.pexels.com/@${photographerHandle}) on Pexels

**ID:** ${photo.id}
**Dimensions:** ${photo.width}x${photo.height}
**Color:** ${photo.avg_color}
**Alt:** ${photo.alt || 'No description'}
**Link:** ${photo.url}
![Preview](${photo.src.medium})`;

  return [
    { type: 'text', text },
    { type: 'image', url: photo.src.medium },
  ];
}

export async function handlePhotoSearch(
  args: unknown,
): Promise<{ content: ContentBlock[]; isError?: boolean }> {
  const parsed = photoSearchSchema.safeParse(args);
  if (!parsed.success) {
    return formatPexelsError('invalid_query');
  }

  const forceRefresh = parsed.data.force_refresh ?? false;
  const params = {
    query: parsed.data.query,
    orientation: parsed.data.orientation,
    size: parsed.data.size,
    color: parsed.data.color,
    locale: parsed.data.locale,
    per_page: parsed.data.per_page || 5,
  };

  if (!forceRefresh) {
    const cacheKey = makeCacheKey(params);
    const cached = getFromCache<ContentBlock[]>(cacheKey);
    if (cached) {
      return { content: cached };
    }
  }

  try {
    const response = await fetchPhotoSearch(params);
    const photos = response.photos?.slice(0, params.per_page || 5) || [];
    const results = photos.flatMap(formatPhotoResult);

    if (!forceRefresh) {
      const cacheKey = makeCacheKey(params);
      setCache(cacheKey, results, 600);
    }

    return { content: results };
  } catch {
    return formatPexelsError('not_found');
  }
}

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerPhotoSearch(server: McpServer): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server.registerTool(
    'pexels_search_photos',
    {
      title: 'Search Pexels Photos',
      description: 'Search for stock photos by query with optional filters for orientation, size, color, and locale. Returns 3-5 results with mandatory photographer attribution.',
      inputSchema: photoSearchSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args: unknown) => handlePhotoSearch(args) as any,
  );
}