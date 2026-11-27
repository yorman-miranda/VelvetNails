import { describe, expect, it } from 'vitest';
import { formatearHora } from './formato-hora';

describe('formatearHora', () => {
  it('formats morning and afternoon hours in 12-hour notation', () => {
    expect(formatearHora(8)).toBe('8:00 a. m.');
    expect(formatearHora(12)).toBe('12:00 p. m.');
    expect(formatearHora(13)).toBe('1:00 p. m.');
    expect(formatearHora(17)).toBe('5:00 p. m.');
  });
});
