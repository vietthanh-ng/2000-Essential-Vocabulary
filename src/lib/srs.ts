import { ReviewGrade } from "@/types";

export interface SRSResult {
  repetition: number;
  interval: number; // in days
  easeFactor: number;
  nextReviewDate: string; // YYYY-MM-DD
}

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 *
 * @param grade: 0 to 5 (0-1 = Again, 2-3 = Hard, 4 = Good, 5 = Easy)
 * @param currentRepetition: number of consecutive successful repetitions
 * @param currentInterval: previous interval in days
 * @param currentEaseFactor: ease factor (starts at 2.5, min 1.3)
 */
export function calculateNextSRS(
  grade: ReviewGrade,
  currentRepetition: number = 0,
  currentInterval: number = 0,
  currentEaseFactor: number = 2.5
): SRSResult {
  let repetition = currentRepetition;
  let interval = currentInterval;
  let easeFactor = currentEaseFactor;

  // Grade mapping:
  // 0, 1 = Again (Chưa nhớ, lặp lại từ đầu)
  // 2, 3 = Hard (Nhớ khó khăn, tăng khoảng cách nhẹ)
  // 4    = Good (Nhớ tốt, theo chuẩn SM-2)
  // 5    = Easy (Rất dễ, tăng nhanh khoảng cách)

  if (grade <= 1) {
    // Complete lapse: reset repetitions to 0
    repetition = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (grade <= 3) {
    // Hard recall: slow growth
    repetition = Math.max(1, repetition);
    interval = Math.max(1, Math.round(interval * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (grade === 4) {
    // Good recall: Standard SM-2 progression
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 3;
    } else if (repetition === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
    // EF' = EF + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02));
    easeFactor = Math.max(1.3, easeFactor);
  } else if (grade === 5) {
    // Easy recall: Boosted interval
    if (repetition === 0) {
      interval = 3;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor * 1.3);
    }
    repetition += 1;
    easeFactor = easeFactor + 0.15;
  }

  // Calculate next review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  const nextReviewDate = nextDate.toISOString().split("T")[0];

  return {
    repetition,
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    nextReviewDate,
  };
}

export function formatIntervalText(days: number): string {
  if (days <= 1) return "1 ngày";
  if (days < 30) return `${days} ngày`;
  if (days < 365) {
    const months = (days / 30).toFixed(1);
    return `${months} tháng`;
  }
  const years = (days / 365).toFixed(1);
  return `${years} năm`;
}
