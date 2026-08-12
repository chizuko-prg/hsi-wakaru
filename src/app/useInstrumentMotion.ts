/**
 * 計器の動きの長さを切り替える。
 *
 * 操作している最中は短く（指の動きから遅れない）、
 * 手を離したあとやこちらから動かすときはゆっくり見せる。
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type InstrumentMotion = 'calm' | 'fast';

export function useInstrumentMotion(): {
  motion: InstrumentMotion;
  markInteracting: () => void;
} {
  const [motion, setMotion] = useState<InstrumentMotion>('calm');
  const settleTimer = useRef<number | null>(null);

  const markInteracting = useCallback(() => {
    setMotion('fast');
    if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setMotion('calm'), 260);
  }, []);

  useEffect(() => {
    return () => {
      if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    };
  }, []);

  return { motion, markInteracting };
}
