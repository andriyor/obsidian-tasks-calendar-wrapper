/** Where the month calendar shows a task, see issue #73. */
import { dayKey, type DayKey } from "./dates";
import type { ResolvedTask } from "./resolve";
import { TaskStatus } from "./status";

/**
 * The one day a task is shown on in the calendar: the day it was done, or else its due, scheduled, start or created
 * date. Tasks without a date of their own are not shown; the forward option's "today" is only for the timeline.
 */
export function calendarDay({ status, dates }: ResolvedTask): DayKey | undefined {
	const done = status === TaskStatus.done ? dates.completion : undefined;
	const date = done ?? dates.due ?? dates.scheduled ?? dates.start ?? dates.created ?? dates.completion;
	return date && dayKey(date);
}
