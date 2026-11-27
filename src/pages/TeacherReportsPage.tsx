import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";
import type { AttendanceRecord, AttendanceStatus, ClassRecord, Student } from "../types";
import { attendanceStatuses } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import { attendanceSection, statusClass } from "./teacherUtils";

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function TeacherReportsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [ready, setReady] = useState(0);
  const [section, setSection] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<AttendanceStatus | "">("");
  const [error, setError] = useState("");

  useEffect(() => {
    const complete = () => setReady((current) => current + 1);
    const stops = [
      onSnapshot(collection(db, "attendance"), (snapshot) => { setRecords(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as AttendanceRecord))); complete(); }, (reason) => { setError(reason.message); complete(); }),
      onSnapshot(collection(db, "students"), (snapshot) => { setStudents(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Student))); complete(); }, (reason) => { setError(reason.message); complete(); }),
      onSnapshot(collection(db, "classes"), (snapshot) => { setClasses(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as ClassRecord))); complete(); }, (reason) => { setError(reason.message); complete(); }),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);

  const sections = useMemo(() => Array.from(new Set([
    ...students.map((student) => student.section),
    ...records.map((record) => attendanceSection(record, classes)),
  ].filter(Boolean))).sort(), [students, records, classes]);
  const filtered = useMemo(() => records.filter((record) => {
    const recordSection = attendanceSection(record, classes);
    return (!section || recordSection === section) &&
      (!fromDate || record.date >= fromDate) &&
      (!toDate || record.date <= toDate) &&
      (!status || record.status === status);
  }).sort((a, b) => b.date.localeCompare(a.date) || a.studentName.localeCompare(b.studentName)), [records, classes, section, fromDate, toDate, status]);

  function exportCsv() {
    const rows = [
      ["Date", "Student Name", "Student ID", "Section", "Status"],
      ...filtered.map((record) => [record.date, record.studentName, record.studentId, attendanceSection(record, classes), record.status]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `attendance-report-${fromDate || "all"}-to-${toDate || "all"}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 0);
  }

  if (ready < 3) return <main className="container page-content"><LoadingSpinner label="Loading attendance reports" /></main>;
  return (
    <main className="container page-content teacher-page">
      <div className="page-heading"><div><span className="eyebrow eyebrow-blue">ATTENDANCE INSIGHTS</span><h1>Attendance reports</h1><p className="muted">Filter, export, and print attendance records.</p></div><span className="report-total">{filtered.length} <small>records</small></span></div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <section className="panel report-panel">
        <div className="report-filters teacher-report-filters">
          <div className="field"><label htmlFor="teacher-report-section">Section</label><select id="teacher-report-section" value={section} onChange={(event) => setSection(event.target.value)}><option value="">All sections</option>{sections.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
          <div className="field"><label htmlFor="teacher-report-from">From date</label><input id="teacher-report-from" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} /></div>
          <div className="field"><label htmlFor="teacher-report-to">To date</label><input id="teacher-report-to" type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} /></div>
          <div className="field"><label htmlFor="teacher-report-status">Status</label><select id="teacher-report-status" value={status} onChange={(event) => setStatus(event.target.value as AttendanceStatus | "")}><option value="">All statuses</option>{attendanceStatuses.map((value) => <option key={value}>{value}</option>)}</select></div>
          <button type="button" className="button button-outline filter-reset no-print" onClick={() => { setSection(""); setFromDate(""); setToDate(""); setStatus(""); }}>Clear filters</button>
        </div>
        <div className="teacher-report-actions no-print"><button className="button button-outline" type="button" onClick={exportCsv}>Export to CSV</button><button className="button button-primary" type="button" onClick={() => window.print()}>Print</button></div>
        <div className="table-scroll">
          <table className="teacher-table">
            <thead><tr><th>Date</th><th>Student name</th><th>Student ID</th><th>Section</th><th>Status</th></tr></thead>
            <tbody>{filtered.map((record) => <tr key={record.id}><td>{record.date}</td><td><strong>{record.studentName}</strong></td><td>{record.studentId}</td><td>{attendanceSection(record, classes) || "—"}</td><td><span className={`teacher-status ${statusClass(record.status)}`}>{record.status}</span></td></tr>)}</tbody>
          </table>
          {!filtered.length && <div className="empty-state">No attendance records match the selected filters.</div>}
        </div>
      </section>
    </main>
  );
}
