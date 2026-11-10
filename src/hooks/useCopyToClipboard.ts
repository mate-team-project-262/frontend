import { useCallback, useEffect, useRef, useState } from 'react';

const RESET_AFTER_MS = 2000;

/** Old-school copy for pages without the Clipboard API (e.g. plain http on a local network). */
function copyWithTextarea(text: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Copy failed');
}

export type CopyStatus = 'idle' | 'copied' | 'failed';

/** status goes back to 'idle' after 2 seconds */
export function useCopyToClipboard() {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(text);
      else copyWithTextarea(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), RESET_AFTER_MS);
  }, []);

  return { status, copy };
}
