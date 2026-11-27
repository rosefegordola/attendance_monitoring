import type { AttendanceRecord, AttendanceStatus, ClassRecord, Student } from "../types";

export function localDate(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function countStatuses(records: AttendanceRecord[]) {
  return records.reduce<Record<AttendanceStatus, number>>((counts, record) => {
    counts[record.status] += 1;
    return counts;
  }, { Present: 0, Absent: 0, Late: 0, Excused: 0 });
}

export function sectionOf(student: Student) {
  return [student.course, student.section].filter(Boolean).join(" / ");
}

export function attendanceSection(record: AttendanceRecord, classes: ClassRecord[]) {
  if ("section" in record && typeof record.section === "string" && record.section) return record.section;
  return classes.find((item) => item.id === record.classId)?.section || "";
}

export function statusClass(status: AttendanceStatus) {
  return `teacher-status-${status.toLowerCase()}`;
}
