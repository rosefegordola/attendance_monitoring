import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import type { AttendanceRecord, AttendanceStatus, ClassRecord, Student } from "../types";
import { attendanceStatuses } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import { countStatuses, localDate, statusClass } from "./teacherUtils";

export default function TeacherAttendancePage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [section, setSection] = useState("");
  const [date, setDate] = useState(localDate(new Date()));
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [ready, setReady] = useState({ students: false, classes: false, records: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const stopStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      const values = snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Student));
      setStudents(values);
      setSection((current) => current || Array.from(new Set(values.map((student) => student.section).filter(Boolean))).sort()[0] || "");
      setReady((current) => ({ ...current, students: true }));
    }, (reason) => { setError(reason.message); setReady((current) => ({ ...current, students: true })); });
    const stopRecords = onSnapshot(collection(db, "attendance"), (snapshot) => {
      setRecords(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as AttendanceRecord)));
      setReady((current) => ({ ...current, records: true }));
    }, (reason) => { setError(reason.message); setReady((current) => ({ ...current, records: true })); });
    const stopClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
      setClasses(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as ClassRecord)));
      setReady((current) => ({ ...current, classes: true }));
    }, (reason) => { setError(reason.message); setReady((current) => ({ ...current, classes: true })); });
    return () => { stopStudents(); stopRecords(); stopClasses(); };
  }, []);

  const sections = useMemo(() => Array.from(new Set(students.map((student) => student.section).filter(Boolean))).sort(), [students]);
  const roster = useMemo(() => students.filter((student) => student.section === section).sort((a, b) => a.fullName.localeCompare(b.fullName)), [students, section]);
  const existing = useMemo(() => records.filter((record) =>
    record.date === date &&
    (record.section === section || classes.some((item) => item.id === record.classId && item.section === section))
  ), [records, classes, date, section]);

  useEffect(() => {
    const next: Record<string, AttendanceStatus> = {};
    existing.forEach((record) => { next[record.studentId] = record.status; });
    setStatuses(next);
    setNotice("");
  }, [existing]);

  const counts = useMemo(() => countStatuses(roster.flatMap((student) => {
    const status = statuses[student.studentId];
    return status ? [{ id: student.id, studentId: student.studentId, studentName: student.fullName, date, status } as AttendanceRecord] : [];
  })), [roster, statuses, date]);

  function chooseStatus(studentId: string, status: AttendanceStatus) {
    setStatuses((current) => ({ ...current, [studentId]: status }));
    setNotice("");
  }

  async function saveAttendance() {
    if (!section) { setError("Select a section before saving attendance."); return; }
    if (!roster.length) { setError("There are no students in this section."); return; }
    if (!Object.keys(statuses).length) { setError("Mark at least one student before saving attendance."); return; }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const markedStudents = roster.filter((student) => statuses[student.studentId]);
      await Promise.all(markedStudents.map((student) => {
        const matching = existing.find((record) => record.studentId === student.studentId);
        const recordId = matching?.id || `${encodeURIComponent(student.studentId)}_${encodeURIComponent(section)}_${date}`;
        return setDoc(doc(db, "attendance", recordId), {
          studentId: student.studentId,
          studentName: student.fullName,
          section,
          date,
          status: statuses[student.studentId],
          teacherId: profile?.uid || "",
          ...(matching ? {} : { createdAt: serverTimestamp() }),
        }, { merge: true });
      }));
      setNotice(`Attendance saved for ${markedStudents.length} student${markedStudents.length === 1 ? "" : "s"}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save attendance.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready.students || !ready.classes || !ready.records) return <main className="container page-content"><LoadingSpinner label="Loading attendance workspace" /></main>;
  return (
    <main className="container page-content teacher-page">
      <div className="page-heading"><div><span className="eyebrow eyebrow-blue">DAILY CLASS RECORD</span><h1>Manage attendance</h1><p className="muted">Choose a section and date, then mark each student.</p></div></div>
      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <section className="panel">
        <div className="teacher-attendance-toolbar">
          <div className="field"><label htmlFor="teacher-attendance-section">Class / Section</label><select id="teacher-attendance-section" value={section} onChange={(event) => setSection(event.target.value)}><option value="">Select a section</option>{sections.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
          <div className="field"><label htmlFor="teacher-attendance-date">Date</label><input id="teacher-attendance-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
          <div className="teacher-counts" aria-label="Attendance counts">{attendanceStatuses.map((status) => <span className={`teacher-status ${statusClass(status)}`} key={status}>{counts[status]} {status}</span>)}</div>
        </div>
        {existing.length > 0 && <p className="info-note">Attendance is already marked for {date} · {section}. Update any statuses and save to replace them.</p>}
        {!sections.length && <p className="alert alert-info">Add students with a section to begin marking attendance.</p>}
        <div className="teacher-attendance-actions"><button className="button button-outline" type="button" disabled={!roster.length} onClick={() => { setStatuses(Object.fromEntries(roster.map((student) => [student.studentId, "Present" as AttendanceStatus]))); setNotice(""); }}>Mark all present</button><button className="button button-outline" type="button" disabled={!roster.length} onClick={() => { setStatuses({}); setNotice(""); }}>Clear all</button></div>
        <div className="table-scroll">
          <table className="teacher-table teacher-attendance-table">
            <thead><tr><th>Student</th><th>Student ID</th><th>Attendance status</th></tr></thead>
            <tbody>{roster.map((student) => <tr key={student.id}><td><strong>{student.fullName}</strong><small>{student.course}</small></td><td>{student.studentId}</td><td><div className="status-options" role="group" aria-label={`Mark ${student.fullName}`}>{attendanceStatuses.map((status) => <button key={status} type="button" className={`status-option teacher-choice-${status.toLowerCase()}${statuses[student.studentId] === status ? " selected" : ""}`} onClick={() => chooseStatus(student.studentId, status)} aria-pressed={statuses[student.studentId] === status}>{status}</button>)}</div></td></tr>)}</tbody>
          </table>
          {!roster.length && section && <div className="empty-state">No students are assigned to {section}.</div>}
        </div>
        <div className="attendance-footer"><p className="muted">{Object.keys(statuses).length} of {roster.length} students marked. Unmarked students are not changed when saved.</p><button className="button button-primary" type="button" onClick={saveAttendance} disabled={saving || !roster.length}>{saving ? "Saving attendance…" : "Save attendance"}</button></div>
      </section>
    </main>
  );
}
