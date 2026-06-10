import { useEffect } from 'react';

/** Wire Cmd/Ctrl-Z, Cmd/Ctrl-Shift-Z, Cmd/Ctrl-Y to undo/redo. */
export function useKeyboardShortcuts({ undo, redo }: { undo: () => void; redo: () => void }): void {
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);
}
