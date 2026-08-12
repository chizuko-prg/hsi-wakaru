import { describe, expect, it } from 'vitest';
import { continuousAngle, formatBearing, normalize360, signedAngleDiff } from './angles';

describe('normalize360', () => {
  it('0..359 に収める', () => {
    expect(normalize360(0)).toBe(0);
    expect(normalize360(360)).toBe(0);
    expect(normalize360(370)).toBe(10);
    expect(normalize360(-10)).toBe(350);
    expect(normalize360(-370)).toBe(350);
  });
});

describe('signedAngleDiff', () => {
  it('最短方向の符号付き差を返す', () => {
    expect(signedAngleDiff(10, 0)).toBe(10);
    expect(signedAngleDiff(0, 10)).toBe(-10);
    expect(signedAngleDiff(10, 350)).toBe(20);
    expect(signedAngleDiff(350, 10)).toBe(-20);
  });

  it('真後ろは +180 に寄せる', () => {
    expect(signedAngleDiff(180, 0)).toBe(180);
    expect(signedAngleDiff(0, 180)).toBe(180);
  });
});

describe('formatBearing', () => {
  it('3桁で表す', () => {
    expect(formatBearing(5)).toBe('005');
    expect(formatBearing(90)).toBe('090');
    expect(formatBearing(359)).toBe('359');
  });

  it('北は 000 ではなく 360 と表す（航空の慣習）', () => {
    expect(formatBearing(0)).toBe('360');
    expect(formatBearing(360)).toBe('360');
    expect(formatBearing(720)).toBe('360');
  });
});

describe('continuousAngle', () => {
  it('359から0へ進むとき、逆回転せず1度だけ進める', () => {
    expect(continuousAngle(359, 0)).toBe(360);
  });

  it('0から359へ戻るとき、1度だけ戻す', () => {
    expect(continuousAngle(0, 359)).toBe(-1);
  });

  it('何周してもつながり続ける', () => {
    let value = 0;
    for (const deg of [90, 180, 270, 0, 90, 180, 270, 0]) {
      value = continuousAngle(value, deg);
    }
    // 2周ぶん進んだ位置にいる。
    expect(value).toBe(720);
  });

  it('同じ値を渡しても動かない（StrictMode の二重実行に耐える）', () => {
    const first = continuousAngle(359, 0);
    expect(continuousAngle(first, 0)).toBe(first);
  });
});
