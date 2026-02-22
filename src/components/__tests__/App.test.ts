import { describe, expect, it } from 'bun:test';

import type { CommandBarState } from '../../hooks/useCommandBar';
import { shouldClearFilterOnCancel } from '../../hooks/useTableCommands';

describe('shouldClearFilterOnCancel', () => {
  it('returns false when no filter is active', () => {
    const state: CommandBarState = { mode: 'idle' };
    expect(shouldClearFilterOnCancel({ hasFilter: false, state })).toBe(false);
  });

  it('returns true when filter is active in idle mode', () => {
    const state: CommandBarState = { mode: 'idle' };
    expect(shouldClearFilterOnCancel({ hasFilter: true, state })).toBe(true);
  });

  it('returns true when filter is active and filter input is open', () => {
    const state: CommandBarState = {
      mode: 'input',
      kind: 'filter',
      prompt: 'Filter tasks (Enter to apply, Esc to clear): ',
      value: ''
    };

    expect(shouldClearFilterOnCancel({ hasFilter: true, state })).toBe(true);
  });

  it('returns false for non-filter input modes', () => {
    const state: CommandBarState = {
      mode: 'input',
      kind: 'edit-description',
      prompt: 'Edit task description: ',
      value: 'task'
    };

    expect(shouldClearFilterOnCancel({ hasFilter: true, state })).toBe(false);
  });

  it('returns false for confirm mode', () => {
    const state: CommandBarState = { mode: 'confirm', prompt: 'Quit?', kind: 'quit' };
    expect(shouldClearFilterOnCancel({ hasFilter: true, state })).toBe(false);
  });
});
