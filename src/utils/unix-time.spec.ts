import { formatTxUnixTime } from '.';

describe('formatTxUnixTime()', () => {
  it('should return truncate timestamps decimals', () => {
    expect(formatTxUnixTime(new Date(1612424488.033 * 1000))).toBe(
      '1612424488',
    );
  });
});
