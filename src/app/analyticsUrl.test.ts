import { describe, expect, it } from 'vitest';
import { stripQueryAndHash } from './analyticsUrl';

const view = (url: string) => ({ type: 'pageview' as const, url });

describe('stripQueryAndHash', () => {
  it('keeps a plain URL as is', () => {
    expect(stripQueryAndHash(view('https://example.vercel.app/restaurants')).url).toBe(
      'https://example.vercel.app/restaurants',
    );
  });

  it('keeps the root path', () => {
    expect(stripQueryAndHash(view('https://example.vercel.app/')).url).toBe(
      'https://example.vercel.app/',
    );
  });

  it('removes the query string', () => {
    expect(stripQueryAndHash(view('https://example.vercel.app/?test=123')).url).toBe(
      'https://example.vercel.app/',
    );
  });

  it('removes the hash', () => {
    expect(stripQueryAndHash(view('https://example.vercel.app/#about')).url).toBe(
      'https://example.vercel.app/',
    );
    expect(stripQueryAndHash(view('https://example.vercel.app/#/lesson/lesson1')).url).toBe(
      'https://example.vercel.app/',
    );
  });

  it('removes both query and hash', () => {
    expect(
      stripQueryAndHash(view('https://example.vercel.app/restaurants?tags=drink#foo')).url,
    ).toBe('https://example.vercel.app/restaurants');
  });

  it('removes a query that appears after a hash', () => {
    expect(stripQueryAndHash(view('https://example.vercel.app/#/about?x=1')).url).toBe(
      'https://example.vercel.app/',
    );
  });

  it('never returns null and keeps the other event fields', () => {
    const result = stripQueryAndHash({ type: 'event' as const, url: 'https://e.vercel.app/a?b=1' });
    expect(result).not.toBeNull();
    expect(result).toEqual({ type: 'event', url: 'https://e.vercel.app/a' });
  });
});
