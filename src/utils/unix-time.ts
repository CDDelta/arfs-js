/** Formats the provided timestamp for the `Unix-Time` tag on an ArFS transaction. */
export function formatTxUnixTime(timestamp: Date): string {
  return (timestamp.valueOf() / 1000).toString();
}

export function parseUnixTimeTagToDate(tagValue?: string): Date | null {
  return tagValue ? new Date(parseInt(tagValue) * 1000) : null;
}
