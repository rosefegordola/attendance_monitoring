import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import type { AttendanceRecord, AttendanceStatus, ClassRecord } from "../types";
import { attendanceStatuses } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import AttendanceTable from "../components/AttendanceTable";
import ConfirmModal from "../components/ConfirmModal";

export default function ReportsPage() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [classId, setClassId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<AttendanceStatus | "">("");
  const [deleting, setDeleting] = useState<AttendanceRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let recordsReady = false;
    let classesReady = profile?.role !== "teacher";
    const finish = () => setLoading(!(recordsReady && classesReady));
    const recordsQuery = profile?.role === "student"
      ? query(collection(db, "attendance"), where("studentId", "==", profile.studentId || ""))
      : collection(db, "attendance");
    const stopRecords = onSnapshot(recordsQuery, (snapshot) => {
      const all = snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as AttendanceRecord));
      setRecords(all);
      recordsReady = true;
      finish();
    }, (reason) => { setError(reason.message); recordsReady = true; finish(); });
    const stopClasses = profile?.role === "teacher"
      ? onSnapshot(collection(db, "classes"), (snapshot) => {
          setClasses(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as ClassRecord)));
          classesReady = true;
          finish();
        }, (reason) => { setError(reason.message); classesReady = true; finish(); })
      : () => undefined;
    return () => { stopRecords(); stopClasses(); };
  }, [profile]);

  const filtered = useMemo(() => records.filter((record) =>
    (!classId || record.classId === classId) &&
    (!fromDate || record.date >= fromDate) &&
    (!toDate || record.date <= toDate) &&
    (!status || record.status === status)
  ).sort((a, b) => b.date.localeCompare(a.date) || a.studentName.localeCompare(b.studentName)), [records, classId, fromDate, toDate, status]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteDoc(doc(db, "attendance", deleting.id));
      setNotice("Attendance record deleted.");
      setDeleting(null);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete attendance record.");
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) return <main className="container page-content"><LoadingSpinner label="Loading attendance reports" /></main>;
  return (
    <main className="container page-content">
      <div className="page-heading"><div><span className="eyebrow eyebrow-blue">ATTENDANCE INSIGHTS</span><h1>{profile?.role === "student" ? "My attendance" : "Attendance reports"}</h1><p className="muted">{profile?.role === "student" ? "Review your attendance history." : "Filter and review class attendance records."}</p></div><span className="report-total">{filtered.length} <small>records</small></span></div>
      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <section className="panel report-panel">
        <div className="report-filters">
          {profile?.role === "teacher" && <div className="field"><label htmlFor="report-class">Class</label><select id="report-class" value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">All classes</option>{classes.map((record) => <option key={record.id} value={record.id}>{record.classCode} · {record.subjectName}</option>)}</select></div>}
          <div className="field"><label htmlFor="report-from">From date</label><input id="report-from" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} /></div>
          <div className="field"><label htmlFor="report-to">To date</label><input id="report-to" type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} /></div>
          <div className="field"><label htmlFor="report-status">Status</label><select id="report-status" value={status} onChange={(event) => setStatus(event.target.value as AttendanceStatus | "")}><option value="">All statuses</option>{attendanceStatuses.map((option) => <option key={option}>{option}</option>)}</select></div>
          <button type="button" className="button button-outline filter-reset" onClick={() => { setClassId(""); setFromDate(""); setToDate(""); setStatus(""); }}>Clear filters</button>
        </div>
        <AttendanceTable records={filtered} onDelete={profile?.role === "teacher" ? setDeleting : undefined} />
      </section>
      {deleting && <ConfirmModal title="Delete attendance record?" message={`Delete ${deleting.studentName}'s ${deleting.status.toLowerCase()} record for ${deleting.date}?`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} busy={deleteBusy} />}
    </main>
  );
}
