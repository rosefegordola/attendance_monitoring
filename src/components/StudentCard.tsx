import type { Student } from "../types";
import Icon from "./Icon";

interface StudentCardProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export default function StudentCard({ student, onEdit, onDelete }: StudentCardProps) {
  return (
    <article className="student-card">
      <div className="student-avatar" aria-hidden="true">{student.fullName.charAt(0).toUpperCase()}</div>
      <div className="student-card-main">
        <h3>{student.fullName}</h3>
        <p className="muted">{student.studentId} · {student.course}</p>
        <p>{student.yearLevel}{student.section ? ` · ${student.section}` : ""}</p>
        <p className="muted">{student.email || "No email provided"}</p>
      </div>
      <div className="button-row card-actions">
        <button type="button" className="button button-small button-outline" onClick={() => onEdit(student)} aria-label={`Edit ${student.fullName}`}><Icon name="edit" />Edit</button>
        <button type="button" className="button button-small button-danger" onClick={() => onDelete(student)} aria-label={`Delete ${student.fullName}`}><Icon name="trash" />Delete</button>
      </div>
    </article>
  );
}
