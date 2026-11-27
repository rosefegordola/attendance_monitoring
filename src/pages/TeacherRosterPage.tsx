import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import type { Student } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import StudentForm, { type StudentInput } from "../components/StudentForm";
import ConfirmModal from "../components/ConfirmModal";
import Icon from "../components/Icon";
import { sectionOf } from "./teacherUtils";

export default function TeacherRosterPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  const [editing, setEditing] = useState<Student | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => onSnapshot(collection(db, "students"), (snapshot) => {
    setStudents(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Student)));
    setLoading(false);
    setError("");
  }, (reason) => { setError(reason.message); setLoading(false); }), []);

  const sections = useMemo(() => Array.from(new Set(students.map(sectionOf).filter(Boolean))).sort(), [students]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((student) =>
      (!term || `${student.fullName} ${student.studentId}`.toLowerCase().includes(term)) &&
      (!section || sectionOf(student) === section)
    ).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [students, search, section]);

  async function save(values: StudentInput) {
    const duplicate = await getDocs(query(collection(db, "students"), where("studentId", "==", values.studentId)));
    if (duplicate.docs.some((item) => item.id !== editing?.id)) throw new Error("That student ID is already registered.");
    const normalized = { ...values, email: values.email.trim().toLowerCase() };
    if (editing) await updateDoc(doc(db, "students", editing.id), normalized);
    else await setDoc(doc(db, "students", normalized.studentId), { ...normalized, createdAt: serverTimestamp() });
    setFormOpen(false);
    setEditing(null);
    setNotice(editing ? "Student updated successfully." : "Student added successfully.");
    setError("");
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteDoc(doc(db, "students", deleting.id));
      setNotice(`${deleting.fullName} was deleted.`);
      setDeleting(null);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete student.");
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) return <main className="container page-content"><LoadingSpinner label="Loading student roster" /></main>;
  return (
    <main className="container page-content teacher-page">
      <div className="page-heading"><div><span className="eyebrow eyebrow-blue">CAMPUS DIRECTORY</span><h1>Manage roster</h1><p className="muted">Add, update, and organize students in your classes.</p></div><button className="button button-primary" type="button" onClick={() => { setEditing(null); setFormOpen(true); }}><Icon name="plus" />Add student</button></div>
      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <section className="panel">
        <div className="teacher-toolbar">
          <div><h2>All students <span className="count-pill">{students.length}</span></h2><p className="muted">Search by name or student ID, or filter by course and section.</p></div>
          <div className="teacher-filters">
            <div className="search-field"><label htmlFor="teacher-roster-search" className="sr-only">Search students</label><Icon name="search" /><input id="teacher-roster-search" placeholder="Search name or ID" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
            <div className="field"><label className="sr-only" htmlFor="teacher-roster-section">Course / Section</label><select id="teacher-roster-section" value={section} onChange={(event) => setSection(event.target.value)}><option value="">All courses / sections</option>{sections.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
          </div>
        </div>
        <div className="table-scroll">
          <table className="teacher-table">
            <thead><tr><th>Student name</th><th>Student ID</th><th>Course / Section</th><th>Email</th><th>Action</th></tr></thead>
            <tbody>{filtered.map((student) => <tr key={student.id}>
              <td><strong>{student.fullName}</strong></td><td>{student.studentId}</td><td>{sectionOf(student) || "—"}</td><td>{student.email || "—"}</td>
              <td><div className="teacher-actions"><button className="button button-small button-outline" type="button" onClick={() => { setEditing(student); setFormOpen(true); }}><Icon name="edit" />Edit</button><button className="button button-small button-danger" type="button" onClick={() => setDeleting(student)}><Icon name="trash" />Delete</button></div></td>
            </tr>)}</tbody>
          </table>
          {!filtered.length && <div className="empty-state">{search || section ? "No students match these filters." : "No students yet. Add your first student to get started."}</div>}
        </div>
      </section>
      {formOpen && <div className="modal-backdrop" role="presentation"><section className="modal-card modal-wide" role="dialog" aria-modal="true" aria-labelledby="teacher-student-form-title"><h2 id="teacher-student-form-title">{editing ? "Edit student" : "Add a student"}</h2><p className="muted">Student ID cannot be changed after registration.</p><StudentForm initialValue={editing || undefined} onSubmit={save} onCancel={() => { setFormOpen(false); setEditing(null); }} /></section></div>}
      {deleting && <ConfirmModal title="Delete student?" message={`Are you sure? Delete ${deleting.fullName} (${deleting.studentId}) from the student roster? Attendance history is retained.`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} busy={deleteBusy} />}
    </main>
  );
}
