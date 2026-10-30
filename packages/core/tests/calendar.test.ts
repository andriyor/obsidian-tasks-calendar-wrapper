import { test } from "node:test";
import assert from "node:assert/strict";
import moment from "moment";

import { calendarDay, hasAnyTag } from "../src/calendar";
import { monthGrid } from "../src/dates";
import { parseTaskLine } from "../src/parse";
import { resolveTasks } from "../src/resolve";

// Issue #73: a month calendar of the tasks

const today = moment("2026-10-16", "YYYY-MM-DD", true);

const dayOf = (line: string) => {
	const task = parseTaskLine(line, { moment, path: "Inbox.md" });
	assert.ok(task, `not a task line: ${line}`);
	return calendarDay(resolveTasks([task], {}, { now: today, moment }).shown[0]);
};

test("the calendar shows a done task on the day it was done, others on their first planned date", () => {
	assert.equal(dayOf("- [x] task 🛫 2026-03-01 ✅ 2026-10-14"), "2026-10-14");
	assert.equal(dayOf("- [ ] task ⏳ 2026-10-20 📅 2026-10-25"), "2026-10-25");
	assert.equal(dayOf("- [ ] task 🛫 2026-10-18"), "2026-10-18");
	assert.equal(dayOf("- [ ] task without dates"), undefined);
});

test("a month grid has whole weeks starting on Monday", () => {
	const weeks = monthGrid(today);
	assert.ok(weeks.every((week) => week.length === 7));
	assert.equal(weeks[0][0], "2026-09-28");
	assert.equal(weeks.at(-1)?.at(-1), "2026-11-01");
	assert.equal(weeks.flat().filter((d) => d.startsWith("2026-10")).length, 31);
});

test("the calendar's tag filter keeps tasks with any tag picked, and every task when none are", () => {
	const resolvedOf = (line: string) => {
		const task = parseTaskLine(line, { moment, path: "Inbox.md" });
		assert.ok(task, `not a task line: ${line}`);
		return resolveTasks([task], {}, { now: today, moment }).shown[0];
	};
	const work = resolvedOf("- [ ] task #work 📅 2026-10-20");
	const plain = resolvedOf("- [ ] task 📅 2026-10-20");
	assert.equal(hasAnyTag(work, new Set()), true);
	assert.equal(hasAnyTag(plain, new Set()), true);
	assert.equal(hasAnyTag(work, new Set(["#home", "#work"])), true);
	assert.equal(hasAnyTag(work, new Set(["#home"])), false);
	assert.equal(hasAnyTag(plain, new Set(["#work"])), false);
});
