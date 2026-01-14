import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { subMinutes, subHours, subDays, subYears } from 'date-fns';
import { formatMessageTimestamp, formatDateSeparator, formatTimestampForA11y } from './relative-time';

// Mock the current time for consistent testing
const MOCK_NOW = new Date('2026-01-13T15:30:00Z');

describe('formatMessageTimestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats just now (< 1 minute)', () => {
    const date = new Date('2026-01-13T15:30:00Z'); // exact same time
    expect(formatMessageTimestamp(date)).toBe('Just now');

    const date2 = subMinutes(MOCK_NOW, 0);
    expect(formatMessageTimestamp(date2)).toBe('Just now');
  });

  it('formats recent minutes (< 1 hour)', () => {
    const date1 = subMinutes(MOCK_NOW, 1);
    expect(formatMessageTimestamp(date1)).toBe('1m ago');

    const date5 = subMinutes(MOCK_NOW, 5);
    expect(formatMessageTimestamp(date5)).toBe('5m ago');

    const date30 = subMinutes(MOCK_NOW, 30);
    expect(formatMessageTimestamp(date30)).toBe('30m ago');

    const date59 = subMinutes(MOCK_NOW, 59);
    expect(formatMessageTimestamp(date59)).toBe('59m ago');
  });

  it('formats recent hours (< 12 hours today)', () => {
    const date1 = subHours(MOCK_NOW, 1);
    expect(formatMessageTimestamp(date1)).toBe('1h ago');

    const date2 = subHours(MOCK_NOW, 2);
    expect(formatMessageTimestamp(date2)).toBe('2h ago');

    const date8 = subHours(MOCK_NOW, 8);
    expect(formatMessageTimestamp(date8)).toBe('8h ago');

    // Note: 11 hours ago might cross into yesterday depending on timezone
    // so we just verify it's either format
    const date11 = subHours(MOCK_NOW, 11);
    const result11 = formatMessageTimestamp(date11);
    expect(result11).toMatch(/(11h ago|Yesterday at)/);
  });

  it('formats time for older today (>= 12 hours)', () => {
    // 2:15 AM on the same day (13+ hours ago)
    const date = new Date('2026-01-13T02:15:00Z');
    const result = formatMessageTimestamp(date);
    expect(result).toMatch(/\d{1,2}:\d{2} [AP]M/); // Matches "2:15 AM" format
  });

  it('formats yesterday', () => {
    const date = subDays(MOCK_NOW, 1);
    const result = formatMessageTimestamp(date);
    expect(result).toContain('Yesterday at');
    expect(result).toMatch(/Yesterday at \d{1,2}:\d{2} [AP]M/);
  });

  it('formats this week (day name)', () => {
    const date = subDays(MOCK_NOW, 3); // 3 days ago
    const result = formatMessageTimestamp(date);
    // Should show day of week like "Sat at 3:30 PM"
    expect(result).toMatch(/[A-Z][a-z]{2} at \d{1,2}:\d{2} [AP]M/);
  });

  it('formats this year (month and day)', () => {
    // Use a date that's in the same year - 8 days ago from Jan 13 = Jan 5, 2026
    const date = subDays(MOCK_NOW, 8);
    const result = formatMessageTimestamp(date);
    // Should show day name since it's within 7 days... wait, 8 days is beyond that
    // Actually, for dates > 7 days in the same year, it should show "Jan 5 at 3:30 PM"
    expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2} at \d{1,2}:\d{2} [AP]M/);
  });

  it('formats past years (full date)', () => {
    const date = subYears(MOCK_NOW, 1);
    const result = formatMessageTimestamp(date);
    // Should show "Jan 13, 2025"
    expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2}, \d{4}/);
  });

  it('handles string dates', () => {
    const isoString = '2026-01-13T15:25:00Z'; // 5 minutes ago
    const result = formatMessageTimestamp(isoString);
    expect(result).toBe('5m ago');
  });

  it('handles invalid dates', () => {
    expect(formatMessageTimestamp('invalid')).toBe('Invalid date');
    expect(formatMessageTimestamp(new Date('invalid'))).toBe('Invalid date');
  });
});

describe('formatDateSeparator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats today', () => {
    const date = new Date('2026-01-13T10:00:00Z');
    expect(formatDateSeparator(date)).toBe('Today');

    expect(formatDateSeparator(MOCK_NOW)).toBe('Today');
  });

  it('formats yesterday', () => {
    const date = subDays(MOCK_NOW, 1);
    expect(formatDateSeparator(date)).toBe('Yesterday');
  });

  it('formats this week (day name)', () => {
    const date = subDays(MOCK_NOW, 3); // 3 days ago
    const result = formatDateSeparator(date);
    // Should be a day of the week
    expect(result).toMatch(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/);
  });

  it('formats this year (month and day)', () => {
    // Use a date within the same year (e.g., 20 days ago from Jan 13 = Dec 24, 2025)
    // Actually this crosses year boundary too. Let me use 10 days which is still Jan 2026
    const date = new Date('2026-01-03T10:00:00Z'); // Earlier in January 2026
    const result = formatDateSeparator(date);
    // Should show "January 3" since it's same year, > 7 days
    expect(result).toMatch(/^[A-Z][a-z]+ \d{1,2}$/);
    expect(result).toContain('January');
  });

  it('formats past years (full date)', () => {
    const date = subYears(MOCK_NOW, 1); // January 13, 2025
    const result = formatDateSeparator(date);
    // Should show "January 13, 2025"
    expect(result).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
    expect(result).toContain('2025');
  });

  it('handles string dates', () => {
    const isoString = '2026-01-13T12:00:00Z';
    const result = formatDateSeparator(isoString);
    expect(result).toBe('Today');
  });

  it('handles invalid dates', () => {
    expect(formatDateSeparator('invalid')).toBe('Invalid date');
    expect(formatDateSeparator(new Date('invalid'))).toBe('Invalid date');
  });
});

describe('formatTimestampForA11y', () => {
  it('formats in full absolute format', () => {
    const date = new Date('2026-01-13T15:30:00Z');
    const result = formatTimestampForA11y(date);

    // Should match "Tuesday, January 13, 2026 at 3:30 PM"
    expect(result).toMatch(/^[A-Z][a-z]+, [A-Z][a-z]+ \d{1,2}, \d{4} at \d{1,2}:\d{2} [AP]M$/);
    expect(result).toContain('2026');
    expect(result).toContain('January');
  });

  it('handles string dates', () => {
    const isoString = '2026-01-13T15:30:00Z';
    const result = formatTimestampForA11y(isoString);
    expect(result).toMatch(/^[A-Z][a-z]+, [A-Z][a-z]+ \d{1,2}, \d{4} at \d{1,2}:\d{2} [AP]M$/);
  });

  it('handles invalid dates', () => {
    expect(formatTimestampForA11y('invalid')).toBe('Invalid date');
    expect(formatTimestampForA11y(new Date('invalid'))).toBe('Invalid date');
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles boundary between minute and hour formatting', () => {
    // 59 minutes should be "59m ago"
    const date59 = subMinutes(MOCK_NOW, 59);
    expect(formatMessageTimestamp(date59)).toBe('59m ago');

    // 60 minutes (1 hour) should be "1h ago"
    const date60 = subMinutes(MOCK_NOW, 60);
    expect(formatMessageTimestamp(date60)).toBe('1h ago');
  });

  it('handles boundary between hour and time format', () => {
    // 11 hours might cross day boundary depending on timezone
    const date11 = subHours(MOCK_NOW, 11);
    const result11 = formatMessageTimestamp(date11);
    expect(result11).toMatch(/(11h ago|Yesterday at|\d{1,2}:\d{2} [AP]M)/);

    // 12 hours should show time or yesterday
    const date12 = subHours(MOCK_NOW, 12);
    const result12 = formatMessageTimestamp(date12);
    expect(result12).toMatch(/(\d{1,2}:\d{2} [AP]M|Yesterday at)/);
  });

  it('handles dates at midnight', () => {
    const midnight = new Date('2026-01-13T00:00:00Z');
    const result = formatMessageTimestamp(midnight);
    // Depending on timezone, midnight UTC might be yesterday local time
    // So we accept either yesterday or a time format
    expect(result).toMatch(/(12:00 AM|Yesterday at|\d{1,2}:\d{2} [AP]M)/);
  });

  it('handles dates far in the future (invalid use case)', () => {
    const future = new Date('2027-01-13T15:30:00Z');
    // This should handle gracefully - differenceInMinutes will be negative
    const result = formatMessageTimestamp(future);
    // Should still return a valid format (just now or past years format)
    expect(result).toBeTruthy();
  });
});
