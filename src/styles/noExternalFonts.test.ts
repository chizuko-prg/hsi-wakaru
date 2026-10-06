/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** 書体はアプリ内に同梱したものだけを使う。外部の配信元を読み込まない。 */
function read(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), 'utf8');
}

const html = read('../../index.html');
const indexCss = read('../index.css');
const fontsCss = read('./fonts.css');
const globalCss = read('./global.css');
const tokensCss = read('./tokens.css');

describe('外部フォントを読み込まない', () => {
  const sources = { html, indexCss, fontsCss, globalCss, tokensCss };

  it('Google Fonts への参照がない', () => {
    for (const [name, source] of Object.entries(sources)) {
      expect(source, name).not.toContain('fonts.googleapis.com');
      expect(source, name).not.toContain('fonts.gstatic.com');
    }
  });

  it('@font-face の取得元は同梱ファイルだけ', () => {
    const urls = [...fontsCss.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url.startsWith('../assets/fonts/'), url).toBe(true);
    }
  });

  it('日本語UIの書体にWebフォントを指定しない（システムフォント）', () => {
    const ui = tokensCss.match(/--font-ui:[^;]+;/)?.[0] ?? '';
    expect(ui).not.toContain('Zen Kaku');
    expect(ui).toContain('system-ui');
  });
});
