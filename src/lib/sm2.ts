/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm
 * Computes optimal memory retention intervals for long-term IELTS vocabulary mastery.
 */

export interface SM2Result {
  repetition: number;
  interval: number; // in days
  easeFactor: number;
  nextReviewDate: string; // YYYY-MM-DD
}

/**
 * Calculates next review parameters based on the user's recall performance grade.
 *
 * @param grade - Recall score from 0 to 5:
 *   1 = Again (Blackout / Complete memory lapse)
 *   2 = Hard (Struggled, remembered with difficulty)
 *   3 = Good (Correct recall with reasonable effort)
 *   5 = Easy (Instant, effortless recall)
 * @param currentRepetition - Consecutive successful reviews (starts at 0)
 * @param currentInterval - Current interval in days (starts at 0)
 * @param currentEaseFactor - Memory ease multiplier (starts at 2.5, min 1.3)
 */
export function calculateSM2(
  grade: number,
  currentRepetition: number = 0,
  currentInterval: number = 0,
  currentEaseFactor: number = 2.5
): SM2Result {
  let repetition = currentRepetition;
  let interval = currentInterval;
  let easeFactor = currentEaseFactor;

  // Bound grade between 0 and 5
  const q = Math.max(0, Math.min(5, Math.round(grade)));

  if (q < 3) {
    // Recall failed: reset consecutive repetitions
    repetition = 0;
    interval = 1;
    // Ease factor penalty for forgotten words
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    // Successful recall
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = q === 5 ? 6 : 3;
    } else {
      interval = Math.round(interval * easeFactor);
      if (q === 5) {
        // Bonus interval boost for very easy items
        interval = Math.round(interval * 1.3);
      }
    }
    repetition += 1;

    // Classic SM-2 Ease Factor adjustment formula:
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
  }

  // Calculate next review ISO date (Today + interval in days)
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + Math.max(1, interval));
  const nextReviewDate = nextDate.toISOString().split("T")[0];

  return {
    repetition,
    interval: Math.max(1, interval),
    easeFactor: Number(easeFactor.toFixed(2)),
    nextReviewDate,
  };
}

export function formatIntervalLabel(days: number): string {
  if (days <= 1) return "1 ngày";
  if (days < 30) return `${days} ngày`;
  if (days < 365) {
    const months = (days / 30).toFixed(1);
    return `${months} tháng`;
  }
  const years = (days / 365).toFixed(1);
  return `${years} năm`;
}
