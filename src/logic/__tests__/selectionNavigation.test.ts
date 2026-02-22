/* oxlint-disable no-magic-numbers */
import { describe, expect, it } from 'bun:test';

import { getWrappedHorizontalColumnIndex, getWrappedVerticalIndex } from '../selectionNavigation';

describe('selectionNavigation', () => {
  describe('getWrappedVerticalIndex', () => {
    it('wraps upward from first row to last row', () => {
      expect(getWrappedVerticalIndex(0, 4, -1)).toBe(3);
    });

    it('wraps downward from last row to first row', () => {
      expect(getWrappedVerticalIndex(3, 4, 1)).toBe(0);
    });

    it('returns current index when column has no rows', () => {
      expect(getWrappedVerticalIndex(2, 0, 1)).toBe(2);
    });
  });

  describe('getWrappedHorizontalColumnIndex', () => {
    it('wraps right from last column to first non-empty column', () => {
      expect(getWrappedHorizontalColumnIndex(2, 1, [3, 0, 1])).toBe(0);
    });

    it('wraps left from first column to last non-empty column', () => {
      expect(getWrappedHorizontalColumnIndex(0, -1, [2, 0, 1])).toBe(2);
    });

    it('skips empty columns while moving right', () => {
      expect(getWrappedHorizontalColumnIndex(0, 1, [2, 0, 0, 5])).toBe(3);
    });

    it('returns undefined when every column is empty', () => {
      expect(getWrappedHorizontalColumnIndex(1, 1, [0, 0, 0])).toBeUndefined();
    });
  });
});
