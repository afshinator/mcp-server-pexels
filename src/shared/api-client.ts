import type {
  PexelsPhoto,
  PexelsVideo,
  PexelsSearchResponse,
  PhotoSearchParams,
  VideoSearchParams,
} from './types.js';
import { MissingKeyError, PexelsApiError } from './errors.js';
import { logDebug } from './logger.js';

const API_BASE = 'https://api.pexels.com';

async function fetchPexels<T>(endpoint: string, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new MissingKeyError();
  }

  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  logDebug('api:', endpoint, 'params:', JSON.stringify(params));

  const response = await fetch(url.toString(), {
    headers: { Authorization: apiKey },
  });

  if (!response.ok) {
    logDebug('api error:', endpoint, response.status, response.statusText);
    throw new PexelsApiError(response.status, response.statusText, response.headers);
  }

  return response.json() as Promise<T>;
}

export async function fetchPhotoSearch(
  params: PhotoSearchParams,
): Promise<PexelsSearchResponse<PexelsPhoto>> {
  return fetchPexels<PexelsSearchResponse<PexelsPhoto>>('/v1/search', params as unknown as Record<string, string | number | boolean | undefined>);
}

export async function fetchVideoSearch(
  params: VideoSearchParams,
): Promise<PexelsSearchResponse<PexelsVideo>> {
  return fetchPexels<PexelsSearchResponse<PexelsVideo>>('/videos/search', params as unknown as Record<string, string | number | boolean | undefined>);
}

export async function fetchPhotoDetails(id: number): Promise<PexelsPhoto> {
  return fetchPexels<PexelsPhoto>(`/v1/photos/${id}`, {});
}

export async function fetchVideoDetails(id: number): Promise<PexelsVideo> {
  return fetchPexels<PexelsVideo>(`/videos/videos/${id}`, {});
}
