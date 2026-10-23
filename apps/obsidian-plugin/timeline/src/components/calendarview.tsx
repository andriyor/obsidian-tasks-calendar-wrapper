import { moment } from "../../../utils/moment";
import * as React from "react";
import {
	calendarDay,
	dayKey,
	hasAnyTag,
	monthGrid,
	resolveTasks,
	TaskStatus,
	type DayKey,
	type ResolvedTask,
	type Task,
} from "@tasks-calendar-wrapper/core";
import { UserOption } from "../../../src/useroptions";
import { TaskItemEventHandlersContext } from "./context";

type CalendarViewProps = Readonly<{ userOptions: UserOption; tasks: readonly Task[] }>;
type CalendarViewState = {
	/** The month shown, as the key of its first day. */
	month: DayKey;
	/** The tags of the colour palette picked in the header; tasks with any of them are shown, all when none are. */
	picked: ReadonlySet<string>;
};

/** Link syntax shown as its text, e.g. [[Note|label]] as "label". */
const plainText = (text: string) =>
	text.replace(/\[\[([^\]|]*)\|?([^\]]*)\]\]/g, (_, target: string, label: string) => label || target);

/** A month grid of the tasks the timeline shows, each on the day calendarDay picks for it. */
export class CalendarView extends React.Component<CalendarViewProps, CalendarViewState> {
	static contextType = TaskItemEventHandlersContext;
	declare context: React.ContextType<typeof TaskItemEventHandlersContext>;
	state: CalendarViewState = { month: dayKey(moment().startOf("month")), picked: new Set() };
	private tasksByDay?: {
		readonly tasks: readonly Task[];
		readonly userOptions: UserOption;
		readonly byDay: Map<DayKey, ResolvedTask[]>;
	};

	private showMonth(offset: number | undefined) {
		const month = offset === undefined ? moment() : moment(this.state.month).add(offset, "month");
		this.setState({ month: dayKey(month.startOf("month")) });
	}

	private togglePicked(tag: string) {
		this.setState(({ picked }) => {
			const next = new Set(picked);
			if (!next.delete(tag)) next.add(tag);
			return { picked: next };
		});
	}

	/** Resolved and grouped once per task list and options, not on every month change. */
	private getTasksByDay(): Map<DayKey, ResolvedTask[]> {
		const { tasks, userOptions } = this.props;
		if (this.tasksByDay?.tasks !== tasks || this.tasksByDay.userOptions !== userOptions) {
			const byDay = new Map<DayKey, ResolvedTask[]>();
			for (const resolved of resolveTasks(tasks, userOptions, { now: moment(), moment }).shown) {
				const day = calendarDay(resolved);
				if (day) byDay.set(day, [...(byDay.get(day) ?? []), resolved]);
			}
			this.tasksByDay = { tasks, userOptions, byDay };
		}
		return this.tasksByDay.byDay;
	}

	render(): React.ReactNode {
		const month = moment(this.state.month);
		const today = dayKey(moment());
		const byDay = this.getTasksByDay();
		const { picked } = this.state;
		return (
			<div className="tcw-calendar">
				<div className="tcw-calendar-header">
					<button onClick={() => this.showMonth(-1)} aria-label="Previous month">
						‹
					</button>
					<button onClick={() => this.showMonth(undefined)}>Today</button>
					<button onClick={() => this.showMonth(1)} aria-label="Next month">
						›
					</button>
					<span className="tcw-calendar-title">{month.format("MMMM YYYY")}</span>
					<span className="tcw-calendar-tags">
						{Object.entries(this.props.userOptions.tagColorPalette).map(([tag, color]) => (
							<button
								key={tag}
								className="tcw-calendar-tag"
								style={{ "--tcw-tag-color": color } as React.CSSProperties}
								aria-pressed={picked.has(tag)}
								onClick={() => this.togglePicked(tag)}
							>
								{tag}
							</button>
						))}
					</span>
				</div>
				<div className="tcw-calendar-grid">
					{[1, 2, 3, 4, 5, 6, 0]
						.map((i) => moment.weekdaysShort(i))
						.map((day) => (
							<div className="tcw-calendar-weekday" key={day}>
								{day}
							</div>
						))}
					{monthGrid(month)
						.flat()
						.map((day) => (
							<div
								key={day}
								className={
									"tcw-calendar-day" +
									(day.slice(0, 7) === this.state.month.slice(0, 7) ? "" : " other-month") +
									(day === today ? " today" : "")
								}
							>
								<div className="tcw-calendar-date">{moment(day).date()}</div>
								{(byDay.get(day) ?? [])
									.filter((resolved) => hasAnyTag(resolved, picked))
									.map(({ task, status, visual }) => (
										<div key={task.id} className={"tcw-calendar-task " + status} title={visual}>
											<input
												type="checkbox"
												checked={status === TaskStatus.done}
												onChange={() =>
													this.context.handleCompleteTask(task.path, task.position)
												}
											/>
											<span onClick={() => this.context.handleOpenFile(task.path, task.position)}>
												{plainText(visual)}
											</span>
										</div>
									))}
							</div>
						))}
				</div>
			</div>
		);
	}
}
