type InputMode = 'add-priority' | 'add-description' | 'priority' | 'filter' | 'edit-description' | 'edit-date';

export type TextInputState = {
  kind: InputMode;
  value: string;
  cursorPosition: number;
  addPriority?: string;
};

type DateField = 'creation' | 'completion';

export type DateInputState = {
  kind: 'edit-date';
  value: string;
  cursorPosition: number;
  completed: boolean;
  activeDateField: DateField;
  creationDate?: string;
  completionDate?: string;
};

export type InputState = TextInputState | DateInputState;

export const isDateInput = (state: InputState): state is DateInputState => {
  return state.kind === 'edit-date';
};

export const applyDateInputValue = (current: DateInputState, value: string): DateInputState => {
  if (current.activeDateField === 'creation') {
    if (value.length === 0) {
      const { creationDate: _creationDate, ...rest } = current;
      return { ...rest, value };
    }
    return { ...current, value, creationDate: value };
  }

  if (value.length === 0) {
    const { completionDate: _completionDate, ...rest } = current;
    return { ...rest, value };
  }
  return { ...current, value, completionDate: value };
};

export const applyAppendInputToState = (current: InputState, input: string): InputState => {
  const cursorPosition = current.cursorPosition;
  const nextValue = current.value.slice(0, cursorPosition) + input + current.value.slice(cursorPosition);
  const nextCursorPosition = cursorPosition + input.length;

  if (isDateInput(current)) {
    return {
      ...applyDateInputValue(current, nextValue),
      cursorPosition: nextCursorPosition
    };
  }

  return {
    ...current,
    value: nextValue,
    cursorPosition: nextCursorPosition
  };
};

export const applyBackspaceToState = (current: InputState): InputState => {
  if (current.cursorPosition === 0) {
    return current;
  }

  const cursorPosition = current.cursorPosition;
  const nextValue = current.value.slice(0, cursorPosition - 1) + current.value.slice(cursorPosition);
  const nextCursorPosition = cursorPosition - 1;

  if (isDateInput(current)) {
    return {
      ...applyDateInputValue(current, nextValue),
      cursorPosition: nextCursorPosition
    };
  }

  return {
    ...current,
    value: nextValue,
    cursorPosition: nextCursorPosition
  };
};

export const applyDeleteCharForwardToState = (current: InputState): InputState => {
  if (current.cursorPosition >= current.value.length) {
    return current;
  }

  const cursorPosition = current.cursorPosition;
  const nextValue = current.value.slice(0, cursorPosition) + current.value.slice(cursorPosition + 1);

  if (isDateInput(current)) {
    return applyDateInputValue(current, nextValue);
  }

  return {
    ...current,
    value: nextValue
  };
};

export const moveCursorLeftByOne = (current: InputState): InputState => {
  return {
    ...current,
    cursorPosition: Math.max(0, current.cursorPosition - 1)
  };
};

export const moveCursorRightByOne = (current: InputState): InputState => {
  return {
    ...current,
    cursorPosition: Math.min(current.value.length, current.cursorPosition + 1)
  };
};

export const moveCursorToStartOfLine = (current: InputState): InputState => {
  return {
    ...current,
    cursorPosition: 0
  };
};

export const moveCursorToEndOfLine = (current: InputState): InputState => {
  return {
    ...current,
    cursorPosition: current.value.length
  };
};

export const moveCursorWordLeftByOne = (current: InputState): InputState => {
  if (current.cursorPosition === 0) {
    return current;
  }

  const text = current.value;
  let position = current.cursorPosition;

  position--;
  while (position > 0 && text[position] === ' ') {
    position--;
  }
  while (position > 0 && text[position - 1] !== ' ') {
    position--;
  }

  return {
    ...current,
    cursorPosition: position
  };
};

export const moveCursorWordRightByOne = (current: InputState): InputState => {
  if (current.cursorPosition >= current.value.length) {
    return current;
  }

  const text = current.value;
  let position = current.cursorPosition;

  while (position < text.length && text[position] === ' ') {
    position++;
  }
  while (position < text.length && text[position] !== ' ') {
    position++;
  }
  while (position < text.length && text[position] === ' ') {
    position++;
  }

  return {
    ...current,
    cursorPosition: position
  };
};

export const deleteWordBackwardFromCursor = (current: InputState): InputState => {
  if (current.cursorPosition === 0) {
    return current;
  }

  const text = current.value;
  let start = current.cursorPosition;

  start--;
  while (start > 0 && text[start] === ' ') {
    start--;
  }
  while (start > 0 && text[start - 1] !== ' ') {
    start--;
  }

  const nextValue = text.slice(0, start) + text.slice(current.cursorPosition);

  if (isDateInput(current)) {
    return {
      ...applyDateInputValue(current, nextValue),
      cursorPosition: start
    };
  }

  return {
    ...current,
    value: nextValue,
    cursorPosition: start
  };
};

export const deleteToLineStartFromCursor = (current: InputState): InputState => {
  if (current.cursorPosition === 0) {
    return current;
  }

  const nextValue = current.value.slice(current.cursorPosition);

  if (isDateInput(current)) {
    return {
      ...applyDateInputValue(current, nextValue),
      cursorPosition: 0
    };
  }

  return {
    ...current,
    value: nextValue,
    cursorPosition: 0
  };
};

export const deleteToLineEndFromCursor = (current: InputState): InputState => {
  if (current.cursorPosition >= current.value.length) {
    return current;
  }

  const nextValue = current.value.slice(0, current.cursorPosition);

  if (isDateInput(current)) {
    return {
      ...applyDateInputValue(current, nextValue),
      cursorPosition: nextValue.length
    };
  }

  return {
    ...current,
    value: nextValue,
    cursorPosition: nextValue.length
  };
};

export const createTextInputState = (
  kind: TextInputState['kind'],
  value: string,
  addPriority?: string
): TextInputState => {
  return {
    kind,
    value,
    cursorPosition: value.length,
    ...(addPriority != null ? { addPriority } : {})
  };
};

export const createDateInputState = (
  completed: boolean,
  activeDateField: DateField,
  creationDate?: string,
  completionDate?: string
): DateInputState => {
  const currentDate = activeDateField === 'completion' ? completionDate : creationDate;
  const value = currentDate ?? '';

  return {
    kind: 'edit-date',
    value,
    cursorPosition: value.length,
    completed,
    activeDateField,
    ...(creationDate !== undefined ? { creationDate } : {}),
    ...(completionDate !== undefined ? { completionDate } : {})
  };
};
