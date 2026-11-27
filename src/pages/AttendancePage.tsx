import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import type { AttendanceRecord, AttendanceStatus, ClassRecord, Student } from "../types";
import { attendanceStatuses } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import StatusBadge from "../components/StatusBadge";

function currentDate() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [date, setDate] = useState(currentDate());
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let readyCount = 0;
    const markReady = () => { readyCount += 1; if (readyCount === 3) setLoading(false); };
    const listeners = [
      onSnapshot(collection(db, "classes"), (snapshot) => {
        const values = snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as ClassRecord));
        setClasses(values);
        setSelectedClassId((current) => current || values[0]?.id || "");
        markReady();
      }, (reason) => { setError(reason.message); markReady(); }),
      onSnapshot(collection(db, "students"), (snapshot) => {
        setStudents(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Student)));
        markReady();
      }, (reason) => { setError(reason.message); markReady(); }),
      onSnapshot(collection(db, "attendance"), (snapshot) => {
        setAttendance(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as AttendanceRecord)));
        markReady();
      }, (reason) => { setError(reason.message); markReady(); }),
    ];
    return () => listeners.forEach((unsubscribe) => unsubscribe());
  }, []);

  const selectedClass = classes.find((item) => item.id === selectedClassId);
  const roster = useMemo(() => selectedClass?.section
    ? students.filter((student) => student.section.trim().toLowerCase() === selectedClass.section.trim().toLowerCase())
    : students, [selectedClass, students]);
  const existing = useMemo(() => attendance.filter((record) => record.classId === selectedClassId && record.date === date), [attendance, selectedClassId, date]);

  useEffect(() => {
    const statusMap: Record<string, AttendanceStatus> = {};
    const remarkMap: Record<string, string> = {};
    existing.forEach((record) => { statusMap[record.studentId] = record.status; remarkMap[record.studentId] = record.remarks || ""; });
    setStatuses(statusMap);
    setRemarks(remarkMap);
  }, [existing]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setStatuses((current) => ({ ...current, [studentId]: status }));
    setNotice("");
  }

  async function saveAttendance() {
    if (!selectedClass) {
      setError("Create or select a class before saving attendance.");
      return;
    }
    if (!roster.length) {
      setError("There are no students in this class section.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await Promise.all(roster.map((student) => {
        const recordId = `${encodeURIComponent(student.studentId)}_${selectedClass.id}_${date}`;
        const matching = existing.find((record) => record.studentId === student.studentId);
        return setDoc(doc(db, "attendance", recordId), {
          studentId: student.studentId,
          studentName: student.fullName,
          classId: selectedClass.id,
          classCode: selectedClass.classCode,
          subjectName: selectedClass.subjectName,
          date,
          status: statuses[student.studentId] || "Present",
          remarks: remarks[student.studentId] || "",
          markedBy: profile?.uid || "",
          ...(matching ? {} : { createdAt: serverTimestamp() }),
        }, { merge: true });
      }));
      setNotice(`Attendance saved for ${roster.length} student${roster.length === 1 ? "" : "s"}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save attendance.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="container page-content"><LoadingSpinner label="Loading attendance workspace" /></main>;
  return (
    <main className="container page-content">
      <div className="page-heading"><div><span className="eyebrow eyebrow-blue">DAILY CLASS RECORD</span><h1>Take attendance</h1><p className="muted">Choose a class and date, then mark each student.</p></div></div>
      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <section className="panel attendance-panel">
        <div className="filter-toolbar">
          <div className="field"><label htmlFor="attendance-class">Class</label><select id="attendance-class" value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}><option value="">Select a class</option>{classes.map((record) => <option key={record.id} value={record.id}>{record.classCode} · {record.subjectName}{record.section ? ` (${record.section})` : ""}</option>)}</select></div>
          <div className="field"><label htmlFor="attendance-date">Date</label><input id="attendance-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
          <div className="attendance-count"><strong>{roster.length}</strong><span>students on roster</span></div>
        </div>
        {!classes.length && <p className="alert alert-info">Add a class before taking attendance.</p>}
        {selectedClass?.section && <p className="info-note">Roster filtered to section <strong>{selectedClass.section}</strong>.</p>}
        {roster.length ? (
          <div className="table-scroll">
            <table className="mark-table">
              <thead><tr><th>Student</th><th>Student ID</th><th>Attendance status</th><th>Remarks</th></tr></thead>
              <tbody>{roster.map((student) => {
                const status = statuses[student.studentId] || "Present";
                return <tr key={student.id}>
                  <td><strong>{student.fullName}</strong><small>{student.course}</small></td>
                  <td>{student.studentId}</td>
                  <td><div className="status-options" role="group" aria-label={`Mark ${student.fullName}`} >{attendanceStatuses.map((choice) => <button key={choice} type="button" className={`status-option ${status === choice ? `selected selected-${choice.toLowerCase()}` : ""}`} onClick={() => setStatus(student.studentId, choice)} aria-pressed={status === choice}>{choice}</button>)}</div><span className="sr-only">Selected: <StatusBadge status={status} /></span></td>
                  <td><label className="sr-only" htmlFor={`remark-${student.id}`}>Remarks for {student.fullName}</label><input className="remark-input" id={`remark-${student.id}`} placeholder="Optional" value={remarks[student.studentId] || ""} onChange={(event) => setRemarks((current) => ({ ...current, [student.studentId]: event.target.value }))} /></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        ) : selectedClass ? <div className="empty-state">No students are assigned to this class{selectedClass.section ? ` section (${selectedClass.section})` : ""}.</div> : null}
        <div className="attendance-footer"><p className="muted">{existing.length ? `${existing.length} record(s) already exist for this date. Saving updates them.` : "Students default to Present. Change any status before saving."}</p><button className="button button-primary" type="button" onClick={saveAttendance} disabled={saving || !roster.length}>{saving ? "Saving attendance…" : "Save attendance"}</button></div>
      </section>
    </main>
  );
}
