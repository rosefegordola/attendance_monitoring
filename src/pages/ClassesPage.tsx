import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import type { ClassRecord } from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import ClassForm, { type ClassInput } from "../components/ClassForm";
import ConfirmModal from "../components/ConfirmModal";
import Icon from "../components/Icon";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<ClassRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ClassRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  useEffect(() => onSnapshot(collection(db, "classes"), (snapshot) => {
    setClasses(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as ClassRecord)));
    setLoading(false);
    setError("");
  }, (reason) => { setError(reason.message); setLoading(false); }), []);

  async function save(values: ClassInput) {
    if (editing) await updateDoc(doc(db, "classes", editing.id), values);
    else await addDoc(collection(db, "classes"), { ...values, createdAt: serverTimestamp() });
    setNotice(editing ? "Class updated successfully." : "Class added successfully.");
    setEditing(null);
    setFormOpen(false);
    setError("");
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteDoc(doc(db, "classes", deleting.id));
      setNotice(`${deleting.classCode} was deleted. Existing attendance records are retained.`);
      setDeleting(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete class.");
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) return <main className="container page-content"><LoadingSpinner label="Loading classes" /></main>;
  return (
    <main className="container page-content">
      <div className="page-heading"><div><span className="eyebrow eyebrow-blue">TEACHING SCHEDULE</span><h1>Classes &amp; subjects</h1><p className="muted">Create and maintain your class list.</p></div><button className="button button-primary" type="button" onClick={() => { setEditing(null); setFormOpen(true); }}><Icon name="plus" />Add class</button></div>
      {notice && <p className="alert alert-success" role="status">{notice}</p>}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {classes.length ? <div className="class-grid">{classes.map((record) => (
        <article className="class-card" key={record.id}>
          <div className="class-card-top"><span className="class-icon"><Icon name="classes" /></span><span className="class-code">{record.classCode}</span></div>
          <h2>{record.subjectName}</h2>
          <p className="muted">Instructor · {record.teacherName}</p>
          <div className="class-details"><span><Icon name="clock" />{record.schedule || "Schedule not set"}</span><span><Icon name="building" />{record.room || "Room not set"}</span>{record.section && <span><Icon name="students" />Section {record.section}</span>}</div>
          <div className="button-row"><button type="button" className="button button-small button-outline" onClick={() => { setEditing(record); setFormOpen(true); }}><Icon name="edit" />Edit class</button><button type="button" className="button button-small button-danger" onClick={() => setDeleting(record)}><Icon name="trash" />Delete</button></div>
        </article>
      ))}</div> : <section className="panel empty-state">No classes have been added yet. Create a class to start taking attendance.</section>}
      {formOpen && <div className="modal-backdrop" role="presentation"><section className="modal-card modal-wide" role="dialog" aria-modal="true" aria-labelledby="class-form-title"><h2 id="class-form-title">{editing ? "Edit class" : "Add a class"}</h2><ClassForm initialValue={editing || undefined} onSubmit={save} onCancel={() => { setFormOpen(false); setEditing(null); }} /></section></div>}
      {deleting && <ConfirmModal title="Delete class?" message={`Delete ${deleting.classCode} · ${deleting.subjectName}? Existing attendance records will remain in reports.`} onCancel={() => setDeleting(null)} onConfirm={confirmDelete} busy={deleteBusy} />}
    </main>
  );
}
