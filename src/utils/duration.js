import { MAX_DURATIONS_MIN } from '../data/content.js';

/**
 * Turns the duration chips the host ticked (any of 90 / 120 / 150) into the movie lengths they mean,
 * as ranges of minutes, e.g. [{ from: 0, to: 90 }, { from: 120, to: 150 }]. No chips = no limit = [].
 *
 *   one chip              up to that time                    90 -> 0-90,   120 -> 0-120
 *   several chips         every chip is its own window:      90 = 0-90,  120 = 90-120,  150 = 120-150
 *                         touching windows are merged:       90+120 -> 0-120,   120+150 -> 90-150,
 *                                                            90+120+150 -> 0-150,   90+150 -> 0-90 and 120-150
 */
export function getDurationRanges(selected) {
  const picked = MAX_DURATIONS_MIN.filter((minutes) => selected.includes(minutes));
  if (picked.length === 0) return [];
  if (picked.length === 1) return [{ from: 0, to: picked[0] }];

  const ranges = [];
  for (const minutes of picked) {
    const index = MAX_DURATIONS_MIN.indexOf(minutes);
    const from = index === 0 ? 0 : MAX_DURATIONS_MIN[index - 1];
    const last = ranges[ranges.length - 1];
    if (last && last.to === from) last.to = minutes;
    else ranges.push({ from, to: minutes });
  }
  return ranges;
}
