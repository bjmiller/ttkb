import { describe, expect, it } from 'bun:test';

/* eslint-disable no-magic-numbers */

import {
  applyAppendInputToState,
  applyBackspaceToState,
  applyDeleteCharForwardToState,
  moveCursorLeftByOne,
  moveCursorRightByOne,
  moveCursorToStartOfLine,
  moveCursorToEndOfLine,
  moveCursorWordLeftByOne,
  moveCursorWordRightByOne,
  deleteWordBackwardFromCursor,
  deleteToLineStartFromCursor,
  deleteToLineEndFromCursor,
  createTextInputState,
  createDateInputState,
  isDateInput
} from '../inputEditing';

describe('createTextInputState', () => {
  it('creates state with value and cursor at end', () => {
    const value = 'test';
    const state = createTextInputState('filter', value);
    expect(state.kind).toBe('filter');
    expect(state.value).toBe(value);
    expect(state.cursorPosition).toBe(value.length);
  });

  it('creates state with addPriority', () => {
    const state = createTextInputState('add-description', 'task', 'A');
    expect(state.addPriority).toBe('A');
  });
});

describe('createDateInputState', () => {
  it('creates state for creation date', () => {
    const state = createDateInputState(false, 'creation', '2024-01-01');
    expect(state.kind).toBe('edit-date');
    expect(state.completed).toBe(false);
    expect(state.activeDateField).toBe('creation');
    expect(state.value).toBe('2024-01-01');
    expect(state.creationDate).toBe('2024-01-01');
  });

  it('creates state for completion date', () => {
    const state = createDateInputState(true, 'completion', undefined, '2024-01-02');
    expect(state.completed).toBe(true);
    expect(state.activeDateField).toBe('completion');
    expect(state.value).toBe('2024-01-02');
    expect(state.completionDate).toBe('2024-01-02');
  });

  it('creates state with empty value when no date provided', () => {
    const state = createDateInputState(false, 'creation');
    expect(state.value).toBe('');
    expect(state.cursorPosition).toBe(0);
  });
});

describe('isDateInput', () => {
  it('returns true for date input state', () => {
    const state = createDateInputState(true, 'completion', undefined, '2024-01-02');
    expect(isDateInput(state)).toBe(true);
  });

  it('returns false for text input state', () => {
    const state = createTextInputState('filter', 'test');
    expect(isDateInput(state)).toBe(false);
  });
});

describe('appendInput', () => {
  it('inserts text at cursor position', () => {
    const value = 'test';
    const state = createTextInputState('filter', value, undefined);
    const result = applyAppendInputToState(state, 'ing');
    expect(result.value).toBe('testing');
    expect(result.cursorPosition).toBe(value.length + 3);
  });

  it('handles cursor at start', () => {
    const state = { kind: 'filter' as const, value: 'test', cursorPosition: 0 };
    const result = applyAppendInputToState(state, 'X');
    expect(result.value).toBe('Xtest');
    expect(result.cursorPosition).toBe(1);
  });

  it('handles cursor at end', () => {
    const value = 'test';
    const state = createTextInputState('filter', value, undefined);
    const result = applyAppendInputToState(state, '!');
    expect(result.value).toBe('test!');
    expect(result.cursorPosition).toBe(value.length + 1);
  });

  it('handles empty value', () => {
    const state = createTextInputState('filter', '', undefined);
    const result = applyAppendInputToState(state, 'x');
    expect(result.value).toBe('x');
    expect(result.cursorPosition).toBe(1);
  });

  it('handles date input state', () => {
    const initialDate = '2024-01-01';
    const state = createDateInputState(false, 'creation', initialDate);
    const result = applyAppendInputToState(state, '5');
    expect(isDateInput(result)).toBe(true);
    if (isDateInput(result)) {
      expect(result.value).toBe('2024-01-015');
      expect(result.cursorPosition).toBe(initialDate.length + 1);
      expect(result.creationDate).toBe('2024-01-015');
    }
  });
});

describe('backspace', () => {
  it('deletes character before cursor', () => {
    const value = 'test';
    const state = createTextInputState('filter', value, undefined);
    const result = applyBackspaceToState(state);
    expect(result.value).toBe('tes');
    expect(result.cursorPosition).toBe(value.length - 1);
  });

  it('does nothing when cursor at start', () => {
    const state = { kind: 'filter' as const, value: 'test', cursorPosition: 0 };
    const result = applyBackspaceToState(state);
    expect(result).toBe(state);
  });

  it('handles date input state', () => {
    const initialDate = '2024-01-01';
    const state = createDateInputState(false, 'creation', initialDate);
    const result = applyBackspaceToState(state);
    expect(isDateInput(result)).toBe(true);
    if (isDateInput(result)) {
      expect(result.value).toBe('2024-01-0');
      expect(result.cursorPosition).toBe(initialDate.length - 1);
      expect(result.creationDate).toBe('2024-01-0');
    }
  });
});

describe('deleteCharForward', () => {
  it('deletes character at cursor position', () => {
    const state = { kind: 'filter' as const, value: 'test', cursorPosition: 3 };
    const result = applyDeleteCharForwardToState(state);
    expect(result.value).toBe('tes');
    expect(result.cursorPosition).toBe(3);
  });

  it('does nothing when cursor at end', () => {
    const value = 'test';
    const state = createTextInputState('filter', value, undefined);
    const result = applyDeleteCharForwardToState(state);
    expect(result).toBe(state);
  });

  it('deletes at start when cursor at 0', () => {
    const state = { kind: 'filter' as const, value: 'test', cursorPosition: 0 };
    const result = applyDeleteCharForwardToState(state);
    expect(result.value).toBe('est');
    expect(result.cursorPosition).toBe(0);
  });
});

describe('moveCursorLeft', () => {
  it('moves cursor left by one', () => {
    const value = 'test';
    const state = createTextInputState('filter', value, undefined);
    const result = moveCursorLeftByOne(state);
    expect(result.cursorPosition).toBe(value.length - 1);
  });

  it('does nothing when cursor at start', () => {
    const state = { kind: 'filter' as const, value: 'test', cursorPosition: 0 };
    const result = moveCursorLeftByOne(state);
    expect(result.cursorPosition).toBe(0);
  });
});

describe('moveCursorRight', () => {
  it('moves cursor right by one', () => {
    const state = { kind: 'filter' as const, value: 'test', cursorPosition: 2 };
    const result = moveCursorRightByOne(state);
    expect(result.cursorPosition).toBe(3);
  });

  it('does nothing when cursor at end', () => {
    const value = 'test';
    const state = createTextInputState('filter', value, undefined);
    const result = moveCursorRightByOne(state);
    expect(result.cursorPosition).toBe(value.length);
  });
});

describe('moveCursorToStart', () => {
  it('moves cursor to start of line', () => {
    const state = { kind: 'filter' as const, value: 'test', cursorPosition: 3 };
    const result = moveCursorToStartOfLine(state);
    expect(result.cursorPosition).toBe(0);
  });
});

describe('moveCursorToEnd', () => {
  it('moves cursor to end of line', () => {
    const state = { kind: 'filter' as const, value: 'test', cursorPosition: 2 };
    const result = moveCursorToEndOfLine(state);
    expect(result.cursorPosition).toBe(4);
  });
});

describe('moveCursorWordLeft', () => {
  it('moves to start of previous word', () => {
    const state = { kind: 'filter' as const, value: 'hello world', cursorPosition: 9 };
    const result = moveCursorWordLeftByOne(state);
    expect(result.cursorPosition).toBe(6);
  });

  it('skips multiple spaces', () => {
    const value = 'hello   world';
    const state = { kind: 'filter' as const, value, cursorPosition: value.length - 2 };
    const result = moveCursorWordLeftByOne(state);
    expect(result.cursorPosition).toBe(8);
  });

  it('handles cursor at start', () => {
    const state = { kind: 'filter' as const, value: 'hello world', cursorPosition: 0 };
    const result = moveCursorWordLeftByOne(state);
    expect(result).toBe(state);
  });

  it('handles cursor in first word', () => {
    const state = { kind: 'filter' as const, value: 'hello world', cursorPosition: 3 };
    const result = moveCursorWordLeftByOne(state);
    expect(result.cursorPosition).toBe(0);
  });
});

describe('moveCursorWordRight', () => {
  it('moves to start of next word', () => {
    const state = { kind: 'filter' as const, value: 'hello world', cursorPosition: 4 };
    const result = moveCursorWordRightByOne(state);
    expect(result.cursorPosition).toBe(6);
  });

  it('skips multiple spaces', () => {
    const value = 'hello   world';
    const state = { kind: 'filter' as const, value, cursorPosition: 4 };
    const result = moveCursorWordRightByOne(state);
    expect(result.cursorPosition).toBe(8);
  });

  it('handles cursor at end', () => {
    const value = 'hello';
    const state = createTextInputState('filter', value, undefined);
    const result = moveCursorWordRightByOne(state);
    expect(result).toBe(state);
  });

  it('handles cursor after last word', () => {
    const value = 'hello world';
    const state = { kind: 'filter' as const, value, cursorPosition: value.length - 1 };
    const result = moveCursorWordRightByOne(state);
    expect(result.cursorPosition).toBe(value.length);
  });
});

describe('deleteWordBackward', () => {
  it('deletes to previous word start', () => {
    const value = 'hello world';
    const state = { kind: 'filter' as const, value, cursorPosition: value.length };
    const result = deleteWordBackwardFromCursor(state);
    expect(result.value).toBe('hello ');
    expect(result.cursorPosition).toBe(6);
  });

  it('skips spaces before word', () => {
    const value = 'hello   world';
    const state = { kind: 'filter' as const, value, cursorPosition: value.length };
    const result = deleteWordBackwardFromCursor(state);
    expect(result.value).toBe('hello   ');
    expect(result.cursorPosition).toBe(8);
  });

  it('does nothing at start', () => {
    const state = { kind: 'filter' as const, value: 'hello world', cursorPosition: 0 };
    const result = deleteWordBackwardFromCursor(state);
    expect(result).toBe(state);
  });

  it('deletes to start when in first word', () => {
    const state = { kind: 'filter' as const, value: 'hello world', cursorPosition: 3 };
    const result = deleteWordBackwardFromCursor(state);
    expect(result.value).toBe('lo world');
    expect(result.cursorPosition).toBe(0);
  });
});

describe('deleteToLineStart', () => {
  it('deletes to beginning of line', () => {
    const state = { kind: 'filter' as const, value: 'hello world', cursorPosition: 6 };
    const result = deleteToLineStartFromCursor(state);
    expect(result.value).toBe('world');
    expect(result.cursorPosition).toBe(0);
  });

  it('does nothing at start', () => {
    const state = { kind: 'filter' as const, value: 'hello world', cursorPosition: 0 };
    const result = deleteToLineStartFromCursor(state);
    expect(result).toBe(state);
  });
});

describe('deleteToLineEnd', () => {
  it('deletes to end of line', () => {
    const state = { kind: 'filter' as const, value: 'hello world', cursorPosition: 5 };
    const result = deleteToLineEndFromCursor(state);
    expect(result.value).toBe('hello');
    expect(result.cursorPosition).toBe(5);
  });

  it('does nothing at end', () => {
    const value = 'hello';
    const state = createTextInputState('filter', value, undefined);
    const result = deleteToLineEndFromCursor(state);
    expect(result).toBe(state);
  });
});
