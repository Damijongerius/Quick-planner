import { test } from "node:test";
import assert from "node:assert/strict";
import { detectDelimiter, parseCsv, toCsv, unguardFormula } from "../importer/csv";
import { guessStatus, isDropped, parseLooseDate, parseLooseNumber } from "../importer/normalize";
import { buildFromCsv, detectCsvFlavor, guessMapping, parseOwnExport, parseTrello, readImportFile } from "../importer/formats";
import { exportToCsv } from "../importer/export";
import { BUILT_IN_TEMPLATES, blueprintProblem } from "../importer/templates";

test("csv: quotes, doubled quotes, embedded newlines, BOM and trailing blank lines", () => {
  const rows = parseCsv('﻿a,b,c\r\n1,"he said ""hi""","line1\nline2"\r\n\r\n');
  assert.deepEqual(rows, [["a", "b", "c"], ["1", 'he said "hi"', "line1\nline2"]]);
});

test("csv: semicolon and tab delimiters are detected", () => {
  assert.equal(detectDelimiter("a;b;c\n1;2;3"), ";");
  assert.equal(detectDelimiter("a\tb\tc"), "\t");
  assert.equal(detectDelimiter('"a,b",c'), ",");
  assert.deepEqual(parseCsv("a;b\n1;2"), [["a", "b"], ["1", "2"]]);
});

test("csv: writing escapes and neutralises formulas, reading undoes it", () => {
  const out = toCsv([["Title", "n"], ["=SUM(A1)", 5], ["plain, text", "-3"], ["-danger", ""]]);
  assert.match(out, /'=SUM\(A1\)/);
  assert.match(out, /"plain, text",-3/);
  assert.match(out, /'-danger/);
  assert.equal(unguardFormula("'=SUM(A1)"), "=SUM(A1)");
  assert.equal(unguardFormula("'just a quote"), "'just a quote");
});

test("status guesses cover the common vocabularies", () => {
  const cases: [string, string | null][] = [
    ["To Do", "TODO"], ["Backlog", "TODO"], ["Selected for Development", "TODO"], ["Open", "TODO"],
    ["In Progress", "IN_PROGRESS"], ["Doing", "IN_PROGRESS"], ["In Development", "IN_PROGRESS"],
    ["In Review", "REVIEW"], ["Code review", "REVIEW"], ["QA", "REVIEW"], ["Testing", "REVIEW"],
    ["Done", "DONE"], ["Closed", "DONE"], ["Resolved", "DONE"], ["Completed", "DONE"], ["Canceled", "DONE"],
    ["Waiting on legal", null], ["", null],
  ];
  for (const [raw, want] of cases) assert.equal(guessStatus(raw), want, raw);
  assert.equal(isDropped("Won't Do"), true);
  assert.equal(isDropped("Done"), false);
});

test("dates in the formats exports use", () => {
  assert.equal(parseLooseDate("2026-03-14"), "2026-03-14");
  assert.equal(parseLooseDate("2026-03-14T10:00:00.000Z"), "2026-03-14");
  assert.equal(parseLooseDate("14/03/2026"), "2026-03-14");
  assert.equal(parseLooseDate("03/14/2026"), "2026-03-14");
  assert.equal(parseLooseDate("21/Oct/26 9:12 AM"), "2026-10-21");
  assert.equal(parseLooseDate("Oct 21, 2026"), "2026-10-21");
  assert.equal(parseLooseDate("Thu Oct 21 2026 10:00:00 GMT+0200"), "2026-10-21");
  assert.equal(parseLooseDate("31/02/2026"), undefined);
  assert.equal(parseLooseDate("soon"), undefined);
  assert.equal(parseLooseDate(""), undefined);
});

test("numbers: commas, units and junk", () => {
  assert.equal(parseLooseNumber("5"), 5);
  assert.equal(parseLooseNumber("3,5"), 3.5);
  assert.equal(parseLooseNumber(" 8 pts"), 8);
  assert.equal(parseLooseNumber("n/a"), undefined);
});

const JIRA = [
  "Summary,Issue key,Issue id,Issue Type,Status,Priority,Assignee,Created,Sprint,Sprint,Parent,Custom field (Story point estimate),Description,Outward issue link (Blocks)",
  'Checkout epic,SHOP-1,1001,Epic,In Progress,High,,21/Oct/26 9:12 AM,,,,,"Big, hairy epic",',
  'Pay with card,SHOP-2,1002,Story,Done,Medium,Sam,21/Oct/26 9:12 AM,Sprint 1,Sprint 2,SHOP-1,5,,SHOP-3',
  "Receipt email,SHOP-3,1003,Task,To Do,Low,,21/Oct/26 9:12 AM,,,SHOP-2,2,,",
].join("\n");

test("jira: flavor, mapping, hierarchy, repeated sprint columns, points and blocks links", () => {
  const read = readImportFile(JIRA);
  assert.equal(read.kind, "csv");
  if (read.kind !== "csv") return;
  assert.equal(read.flavor, "jira");
  assert.equal(read.mapping.fields.title, "Summary");
  assert.equal(read.mapping.fields.ref, "Issue key");
  const parsed = buildFromCsv(read.rows, read.mapping, read.flavor);
  assert.equal(parsed.items.length, 3);
  const [epic, story, task] = parsed.items;
  assert.equal(epic.description, "Big, hairy epic");
  assert.equal(story.parentRef, "SHOP-1");
  assert.equal(task.parentRef, "SHOP-2");
  assert.equal(story.sprint, "Sprint 2");
  assert.equal(story.fields?.["Story points"], 5);
  assert.equal(story.rawStatus, "Done");
  assert.deepEqual(task.blockedBy, ["SHOP-2"]);
  assert.deepEqual(parsed.sprints.map((s) => s.name), ["Sprint 2"]);
  assert.equal(story.assignee, "Sam");
});

test("linear: cycles become sprints, estimate becomes story points, canceled is archived", () => {
  const csv = [
    "ID,Team,Title,Description,Status,Estimate,Priority,Assignee,Cycle Number,Cycle Name,Parent issue,Completed,Canceled,Due Date",
    "ENG-1,Eng,Ship login,,Done,3,High,ann@x.io,4,,,2026-03-01,,2026-03-05",
    "ENG-2,Eng,Dark mode,,In Progress,5,Low,,4,,ENG-1,,,",
    "ENG-3,Eng,Old idea,,Canceled,,,,,,,,2026-02-01,",
  ].join("\n");
  const read = readImportFile(csv);
  assert.equal(read.kind === "csv" && read.flavor, "linear");
  if (read.kind !== "csv") return;
  const { items, sprints } = buildFromCsv(read.rows, read.mapping, read.flavor);
  assert.equal(items[0].sprint, "Cycle 4");
  assert.equal(items[0].fields?.["Story points"], 3);
  assert.equal(items[0].completedAt, "2026-03-01");
  assert.equal(items[0].endDate, "2026-03-05");
  assert.equal(items[1].parentRef, "ENG-1");
  assert.equal(items[2].archived, true);
  assert.deepEqual(sprints.map((s) => s.name), ["Cycle 4"]);
});

test("asana: parents and dependencies are names, completed tasks are done", () => {
  const csv = [
    "Task ID,Created At,Completed At,Name,Assignee Email,Due Date,Notes,Parent Task,Blocked By (Dependencies),Section/Column",
    "11,2026-01-01,,Design,a@x.io,2026-02-01,Pixels,,,Doing",
    "12,2026-01-01,2026-01-20,Build,,2026-02-10,,Design,Design,Backlog",
    "13,2026-01-01,,Test, ,,,,\"Design, Build\",",
  ].join("\n");
  const read = readImportFile(csv);
  assert.equal(read.kind === "csv" && read.flavor, "asana");
  if (read.kind !== "csv") return;
  const { items } = buildFromCsv(read.rows, read.mapping, read.flavor);
  assert.equal(items[1].parentRef, "11");
  assert.deepEqual(items[1].blockedBy, ["11"]);
  assert.equal(items[1].rawStatus, "Completed");
  assert.equal(items[0].assignee, "a@x.io");
  assert.equal(items[0].endDate, "2026-02-01");
  assert.deepEqual(items[2].blockedBy?.sort(), ["11", "12"]);
});

test("generic csv: synonym headers, missing refs get row numbers, links by title", () => {
  const csv = "Task,Owner,State,Depends on,Due\nWrite spec,me@x.io,doing,,2026-05-01\nReview spec,you@x.io,todo,Write spec,\n,,,,\n";
  const read = readImportFile(csv);
  assert.equal(read.kind === "csv" && read.flavor, "csv");
  if (read.kind !== "csv") return;
  assert.equal(read.mapping.fields.title, "Task");
  assert.equal(read.mapping.fields.assignee, "Owner");
  assert.equal(read.mapping.fields.status, "State");
  assert.equal(read.mapping.fields.blockedBy, "Depends on");
  const parsed = buildFromCsv(read.rows, read.mapping, read.flavor);
  assert.equal(parsed.items.length, 2);
  assert.deepEqual(parsed.items.map((i) => i.ref), ["row-2", "row-3"]);
  assert.deepEqual(parsed.items[1].blockedBy, ["row-2"]);
});

test("csv without a title column explains what to do", () => {
  const parsed = buildFromCsv([["a", "b"], ["1", "2"]], { fields: {}, custom: [] }, "csv");
  assert.equal(parsed.items.length, 0);
  assert.match(parsed.warnings[0], /title/);
});

test("duplicate keys stay unique and dangling links are reported, not fatal", () => {
  const csv = "Summary,Issue key,Parent\nA,K-1,\nB,K-1,K-9\n";
  const read = readImportFile(csv);
  if (read.kind !== "csv") throw new Error("not csv");
  const parsed = buildFromCsv(read.rows, read.mapping, read.flavor);
  assert.equal(new Set(parsed.items.map((i) => i.ref)).size, 2);
  assert.match(parsed.warnings.join(" "), /not in this file/);
});

test("trello: lists become statuses, checklist items become subtasks, closed cards are archived", () => {
  const parsed = parseTrello({
    name: "Launch board",
    lists: [{ id: "l1", name: "To Do", pos: 1 }, { id: "l2", name: "Doing", pos: 2 }, { id: "l3", name: "Parking lot", pos: 3, closed: true }],
    members: [{ id: "m1", fullName: "Sam Okafor" }],
    cards: [
      { id: "c1", name: "Write copy", idList: "l2", idMembers: ["m1"], due: "2026-04-01T12:00:00.000Z", pos: 1, labels: [{ name: "Marketing" }] },
      { id: "c2", name: "Old idea", idList: "l3", pos: 1 },
      { id: "c3", name: "Order swag", idList: "l1", pos: 1, dueComplete: true },
    ],
    checklists: [{ id: "k1", idCard: "c1", checkItems: [{ name: "Draft", state: "complete", pos: 1 }, { name: "Edit", state: "incomplete", pos: 2 }] }],
  });
  assert.equal(parsed.projectName, "Launch board");
  assert.deepEqual(parsed.items.map((i) => i.title), ["Order swag", "Write copy", "Draft", "Edit", "Old idea"]);
  const copy = parsed.items.find((i) => i.title === "Write copy")!;
  assert.equal(copy.assignee, "Sam Okafor");
  assert.equal(copy.endDate, "2026-04-01");
  assert.equal(copy.fields?.Labels, "Marketing");
  assert.equal(parsed.items.find((i) => i.title === "Draft")?.parentRef, "c1");
  assert.equal(parsed.items.find((i) => i.title === "Old idea")?.archived, true);
  assert.equal(parsed.items.find((i) => i.title === "Order swag")?.rawStatus, "Done");
  assert.match(parsed.warnings.join(" "), /Parking lot/);
});

test("file detection: own json, trello json, junk", () => {
  assert.equal(readImportFile('{"format":"quick-planner","version":1,"items":[]}').kind, "parsed");
  assert.equal(readImportFile('{"lists":[],"cards":[]}').kind, "parsed");
  assert.equal(readImportFile('{"hello":1}').kind, "error");
  assert.equal(readImportFile("{nope").kind, "error");
  assert.equal(readImportFile("").kind, "error");
  assert.equal(readImportFile("only a header").kind, "error");
});

test("own export round-trips through csv with custom fields, links and special characters", () => {
  const items = [
    { ref: "a", title: "Epic, with comma", type: "Epic", status: "IN_PROGRESS" as const, description: 'multi\nline "quoted"' },
    { ref: "b", title: "=cmd()", type: "Task", status: "DONE" as const, parentRef: "a", assignee: "sam@x.io", sprint: "Sprint 1", startDate: "2026-01-01", endDate: "2026-01-05", blockedBy: ["a"], fields: { "Story points": 5, Notes: "hi" }, archived: true },
  ];
  const csv = exportToCsv({ items });
  const read = readImportFile(csv);
  assert.equal(read.kind === "csv" && read.flavor, "quick-planner");
  if (read.kind !== "csv") return;
  const back = buildFromCsv(read.rows, { ...read.mapping, custom: [...read.mapping.custom, "Story points", "Notes"] }, read.flavor).items;
  assert.equal(back[0].title, "Epic, with comma");
  assert.equal(back[0].description, 'multi\nline "quoted"');
  assert.equal(back[0].rawStatus, "In progress");
  assert.equal(back[1].title, "=cmd()");
  assert.equal(back[1].parentRef, "a");
  assert.equal(back[1].assignee, "sam@x.io");
  assert.equal(back[1].sprint, "Sprint 1");
  assert.deepEqual(back[1].blockedBy, ["a"]);
  assert.equal(back[1].fields?.["Story points"], 5);
  assert.equal(back[1].archived, true);
});

test("own json keeps the blueprint and drops malformed items", () => {
  const parsed = parseOwnExport({
    format: "quick-planner", version: 1, project: { name: "P" },
    blueprint: { nodeTypes: [{ name: "Task" }], relations: [] },
    items: [{ ref: "1", title: "ok", status: "DONE" }, { ref: "2" } as never, { ref: "3", title: "x", status: "WEIRD" as never }],
  });
  assert.equal(parsed.items.length, 2);
  assert.equal(parsed.items[1].status, undefined);
  assert.equal(parsed.blueprint?.nodeTypes[0].name, "Task");
});

test("header mapping helpers", () => {
  assert.equal(detectCsvFlavor(["Issue key", "Summary"]), "jira");
  assert.equal(detectCsvFlavor(["x", "y"]), "csv");
  assert.deepEqual(guessMapping(["Name", "Story Points", "Status"]).custom, ["Story Points"]);
});

test("built-in templates are valid blueprints", () => {
  assert.ok(BUILT_IN_TEMPLATES.length >= 4);
  for (const t of BUILT_IN_TEMPLATES) assert.equal(blueprintProblem(t.config.blueprint), null, t.id);
  assert.match(blueprintProblem({ nodeTypes: [{ name: "A" }, { name: "a" }], relations: [] }) ?? "", /both called/);
  assert.match(blueprintProblem({ nodeTypes: [{ name: "A" }], relations: [{ parent: "A", child: "B" }] }) ?? "", /doesn't exist/);
});

import { assigneeChoices, buildPlan, describePlan, matchPerson, statusChoices, typeChoices } from "../importer/plan";

test("plan: statuses come from the user's mapping first, then the guess, then To do", () => {
  const parsed = readImportFile("Task,Status,Type\nA,Waiting on legal,Story\nB,Done,Story\nC,,Bug\nD,Parked,\n");
  if (parsed.kind !== "csv") throw new Error("csv");
  const result = buildFromCsv(parsed.rows, parsed.mapping, parsed.flavor);
  const choices = statusChoices(result.items);
  assert.deepEqual(choices.map((c) => [c.raw, c.guess]).sort(), [["Done", "DONE"], ["Parked", null], ["Waiting on legal", null]]);
  const plan = buildPlan(result, { statusMap: { "Waiting on legal": "REVIEW" }, typeMap: { Story: "User story" } });
  assert.deepEqual(plan.items.map((i) => i.status), ["REVIEW", "DONE", "TODO", "TODO"]);
  assert.deepEqual(plan.items.map((i) => i.type), ["User story", "User story", "Bug", undefined]);
  assert.equal(plan.items.every((i) => !("rawStatus" in i)), true);
  assert.deepEqual(typeChoices(result.items).map((t) => [t.name, t.count]).sort(), [["Bug", 1], ["Story", 2]]);
});

test("plan: counts what will be created", () => {
  const plan = buildPlan({
    source: "csv", warnings: [], milestones: [], sprints: [{ name: "S1" }],
    items: [{ ref: "a", title: "A" }, { ref: "b", title: "B", parentRef: "a", sprint: "S2", blockedBy: ["a", "zzz"] }, { ref: "c", title: "C", rawStatus: "Done", archived: true }],
  }, { statusMap: {}, typeMap: {} });
  assert.deepEqual(describePlan(plan), { items: 3, sprints: 2, links: 1, dependencies: 1, archived: 1, done: 1, milestones: 0 });
});

test("people are matched by email or name, ignoring case", () => {
  const people = [{ email: "Sam@X.io", name: "Sam Okafor" }, { email: null, name: "Jo" }];
  assert.equal(matchPerson("sam@x.io", people), people[0]);
  assert.equal(matchPerson("sam okafor", people), people[0]);
  assert.equal(matchPerson("jo", people), people[1]);
  assert.equal(matchPerson("nobody", people), undefined);
  assert.deepEqual(assigneeChoices([{ ref: "1", title: "t", assignee: "Sam" }, { ref: "2", title: "t", assignee: "Sam" }, { ref: "3", title: "t" }]), [{ label: "Sam", count: 2 }]);
});
