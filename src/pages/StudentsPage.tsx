import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where, getDocs, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import type { Student } from "../types";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import StudentCard from "../components/StudentCard";
import StudentForm, { type StudentInput } from "../components/StudentForm";
import ConfirmModal from "../components/ConfirmModal";
import Icon from "../components/Icon";

export default function StudentsPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Student | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => onSnapshot(collection(db, "students"), (snapshot) => {
    setStudents(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as Student)));
    setLoading(false);
    setError("");
  }, (reason) => { setError(reason.message); setLoading(false); }), []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((student) => `${student.fullName} ${student.studentId}`.toLowerCase().includes(term));
  }, [students, search]);

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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete student.");
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) return <main className="container page-content"><LoadingSpinner label="Loading students" /></main>;
  return (
    <main className="container page-content">
      <div className="page-heading">
        <div><span className="eyebrow eyebrow-blue">CAMPUS DIRECTORY</span><h1>Students</h1><p className="muted">Manage the student roster for your classes.</p></div>
        <button className="button button-primary" type="button" onClick={() => { setEditing(null); setFormOpen(true); }}><Icon name="plus" />Add student</button>
      </div>
      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <section className="panel">
        <div className="list-toolbar"><div><h2>All students <span className="count-pill">{students.length}</span></h2><p className="muted">Search by student name or ID.</p></div><div className="search-field"><label htmlFor="student-search" className="sr-only">Search students</label><Icon name="search" /><input id="student-search" placeholder="Search name or ID" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
        {filtered.length ? <div className="student-grid">{filtered.map((student) => <StudentCard key={student.id} student={student} onEdit={(item) => { setEditing(item); setFormOpen(true); }} onDelete={setDeleting} />)}</div> : <div className="empty-state">{search ? "No students found for that search." : "No students yet. Add your first student to get started."}</div>}
      </section>
      {formOpen && <div className="modal-backdrop" role="presentation"><section className="modal-card modal-wide" role="dialog" aria-modal="true" aria-labelledby="student-form-title"><h2 id="student-form-title">{editing ? "Edit student" : "Add a student"}</h2><p className="muted">Fields marked with * are required.</p><StudentForm initialValue={editing || undefined} onSubmit={save} onCancel={() => { setFormOpen(false); setEditing(null); }} /></section></div>}
      {deleting && <ConfirmModal title="Delete student?" message={`Delete ${deleting.fullName} (${deleting.studentId}) from the student roster? Attendance history is retained.`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} busy={deleteBusy} />}
      <span className="sr-only">{profile?.fullName}</span>
    </main>
  );
}
