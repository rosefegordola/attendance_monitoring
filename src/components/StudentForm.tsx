import { useEffect, useState, type FormEvent } from "react";
import type { Student } from "../types";

export type StudentInput = Omit<Student, "id" | "createdAt">;

interface StudentFormProps {
  initialValue?: Student;
  onSubmit: (student: StudentInput) => Promise<void>;
  onCancel: () => void;
}

const emptyStudent: StudentInput = {
  studentId: "", fullName: "", course: "", yearLevel: "", section: "", email: "", contactNumber: "",
};

export default function StudentForm({ initialValue, onSubmit, onCancel }: StudentFormProps) {
  const [values, setValues] = useState<StudentInput>(emptyStudent);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentInput, string>>>({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (initialValue) {
      const { studentId, fullName, course, yearLevel, section, email, contactNumber } = initialValue;
      setValues({ studentId, fullName, course, yearLevel, section, email, contactNumber });
    } else setValues(emptyStudent);
  }, [initialValue]);

  function update(field: keyof StudentInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!values.studentId.trim()) nextErrors.studentId = "Student ID is required.";
    else if (!/^[A-Za-z0-9._-]+$/.test(values.studentId.trim())) nextErrors.studentId = "Use letters, numbers, periods, underscores, or hyphens only.";
    if (!values.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!values.course.trim()) nextErrors.course = "Course is required.";
    if (!values.email.trim()) nextErrors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = "Enter a valid email address.";
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.values(nextErrors).some(Boolean)) return;
    setBusy(true);
    try {
      await onSubmit({ ...values, studentId: values.studentId.trim(), fullName: values.fullName.trim(), course: values.course.trim() });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save student.");
    } finally {
      setBusy(false);
    }
  }

  const fields: { key: keyof StudentInput; label: string; required?: boolean; type?: string }[] = [
    { key: "studentId", label: "Student ID", required: true },
    { key: "fullName", label: "Full name", required: true },
    { key: "course", label: "Course", required: true },
    { key: "yearLevel", label: "Year level" },
    { key: "section", label: "Section" },
    { key: "email", label: "Email", type: "email" },
    { key: "contactNumber", label: "Contact number", type: "tel" },
  ];

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      {fields.map(({ key, label, required, type }) => (
        <div className="field" key={key}>
          <label htmlFor={`student-${key}`}>{label}{required && <span aria-hidden="true"> *</span>}</label>
          <input id={`student-${key}`} type={type || "text"} value={values[key]} required={required} readOnly={key === "studentId" && Boolean(initialValue)}
            onChange={(event) => update(key, event.target.value)} aria-invalid={Boolean(errors[key])}
            aria-describedby={errors[key] ? `student-${key}-error` : undefined} />
          {errors[key] && <span className="field-error" id={`student-${key}-error`}>{errors[key]}</span>}
        </div>
      ))}
      {submitError && <p className="alert alert-error form-full">{submitError}</p>}
      <div className="button-row form-full">
        <button type="button" className="button button-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Saving…" : initialValue ? "Save changes" : "Add student"}</button>
      </div>
    </form>
  );
}
