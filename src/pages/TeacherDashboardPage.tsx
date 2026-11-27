import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import Icon from "../components/Icon";
import type { AttendanceRecord, Student } from "../types";
import { countStatuses, localDate, statusClass } from "./teacherUtils";

export default function TeacherDashboardPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [ready, setReady] = useState({ students: false, records: false });
  const [error, setError] = useState("");

  useEffect(() => {
    const stopStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      setStudents(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Student)));
      setReady((current) => ({ ...current, students: true }));
    }, (reason) => { setError(reason.message); setReady((current) => ({ ...current, students: true })); });
    const stopRecords = onSnapshot(collection(db, "attendance"), (snapshot) => {
      setRecords(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as AttendanceRecord)));
      setReady((current) => ({ ...current, records: true }));
    }, (reason) => { setError(reason.message); setReady((current) => ({ ...current, records: true })); });
    return () => { stopStudents(); stopRecords(); };
  }, []);

  const today = localDate(new Date());
  const todayRecords = useMemo(() => records.filter((record) => record.date === today), [records, today]);
  const counts = useMemo(() => countStatuses(todayRecords), [todayRecords]);
  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = localDate(date);
    const dayRecords = records.filter((record) => record.date === key);
    const rate = dayRecords.length
      ? Math.round((dayRecords.filter((record) => record.status === "Present" || record.status === "Late").length / dayRecords.length) * 100)
      : 0;
    return { key, label: date.toLocaleDateString(undefined, { weekday: "short" }), rate };
  }), [records]);

  if (!ready.students || !ready.records) return <main className="container page-content"><LoadingSpinner label="Loading teacher dashboard" /></main>;

  return (
    <main className="container page-content teacher-page">
      <div className="page-heading">
        <div><span className="eyebrow eyebrow-blue">TEACHER OVERVIEW</span><h1>Good day, {profile?.fullName || "Teacher"}</h1><p className="muted">Here’s your class attendance snapshot for {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}.</p></div>
        <Link className="button button-primary" to="/teacher/attendance">Take attendance</Link>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <section className="metric-grid" aria-label="Attendance summary">
        <article className="metric-card"><span className="metric-label">Total students</span><strong>{students.length}</strong><span className="metric-foot">In your roster</span><span className="metric-icon blue-icon"><Icon name="students" /></span></article>
        <article className="metric-card"><span className="metric-label">Present today</span><strong>{counts.Present}</strong><span className="metric-foot">Marked present</span><span className="metric-icon green-icon"><Icon name="check" /></span></article>
        <article className="metric-card"><span className="metric-label">Absent today</span><strong>{counts.Absent}</strong><span className="metric-foot">Marked absent</span><span className="metric-icon red-icon"><Icon name="close" /></span></article>
        <article className="metric-card"><span className="metric-label">Late today</span><strong>{counts.Late}</strong><span className="metric-foot">Arrived late</span><span className="metric-icon gold-icon"><Icon name="clock" /></span></article>
      </section>
      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-heading"><div><h2>Attendance rate</h2><p className="muted">Present and late records over the last 7 days</p></div><span className="chart-period">LAST 7 DAYS</span></div>
          <div className="bar-chart" role="img" aria-label={`Attendance rates over the last seven days: ${week.map((day) => `${day.label} ${day.rate}%`).join(", ")}`}>
            {week.map(({ key, label, rate }) => <div className="bar-column" key={key}><span className="bar-value">{rate}%</span><div className="bar-track"><span className="bar-fill" style={{ height: `${rate}%` }} /></div><span className="bar-label">{label}</span></div>)}
          </div>
        </article>
        <article className="panel today-panel">
          <div className="panel-heading"><div><h2>Today’s attendance</h2><p className="muted">{today}</p></div><Link to="/teacher/reports" className="text-link">View reports</Link></div>
          <div className="today-progress"><span className="today-present" style={{ width: `${todayRecords.length ? Math.round(((counts.Present + counts.Late) / todayRecords.length) * 100) : 0}%` }} /></div>
          <div className="teacher-summary-list">
            {(["Present", "Absent", "Late", "Excused"] as const).map((status) => <div key={status}><span className={`legend-dot ${status.toLowerCase()}`} />{status}<strong>{counts[status]}</strong></div>)}
          </div>
          {todayRecords.length ? <ul className="teacher-today-records">{todayRecords.slice(0, 5).map((record) => <li key={record.id}><span>{record.studentName}</span><span className={`teacher-status ${statusClass(record.status)}`}>{record.status}</span></li>)}</ul> : <p className="muted empty-hint">No attendance has been recorded today yet.</p>}
        </article>
      </section>
    </main>
  );
}
