import { useEffect, useState, type FormEvent } from "react";
import type { ClassRecord } from "../types";

export type ClassInput = Omit<ClassRecord, "id" | "createdAt">;

interface ClassFormProps {
  initialValue?: ClassRecord;
  onSubmit: (record: ClassInput) => Promise<void>;
  onCancel: () => void;
}

const emptyClass: ClassInput = { classCode: "", subjectName: "", teacherName: "", schedule: "", room: "", section: "" };

export default function ClassForm({ initialValue, onSubmit, onCancel }: ClassFormProps) {
  const [values, setValues] = useState<ClassInput>(emptyClass);
  const [errors, setErrors] = useState<Partial<Record<keyof ClassInput, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialValue) {
      const { classCode, subjectName, teacherName, schedule, room, section } = initialValue;
      setValues({ classCode, subjectName, teacherName, schedule, room, section });
    } else setValues(emptyClass);
  }, [initialValue]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!values.classCode.trim()) nextErrors.classCode = "Class code is required.";
    if (!values.subjectName.trim()) nextErrors.subjectName = "Subject name is required.";
    if (!values.teacherName.trim()) nextErrors.teacherName = "Teacher name is required.";
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setBusy(true);
    setSubmitError("");
    try {
      await onSubmit({ ...values, classCode: values.classCode.trim(), subjectName: values.subjectName.trim(), teacherName: values.teacherName.trim() });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to save class.");
    } finally {
      setBusy(false);
    }
  }

  const fields: { key: keyof ClassInput; label: string; required?: boolean }[] = [
    { key: "classCode", label: "Class code", required: true },
    { key: "subjectName", label: "Subject name", required: true },
    { key: "teacherName", label: "Teacher name", required: true },
    { key: "schedule", label: "Schedule" },
    { key: "room", label: "Room" },
    { key: "section", label: "Section (matches student section)" },
  ];

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      {fields.map(({ key, label, required }) => (
        <div className="field" key={key}>
          <label htmlFor={`class-${key}`}>{label}{required && <span aria-hidden="true"> *</span>}</label>
          <input id={`class-${key}`} value={values[key]} required={required}
            onChange={(event) => {
              const value = event.target.value;
              setValues((current) => ({ ...current, [key]: value }));
              setErrors((current) => ({ ...current, [key]: "" }));
            }} aria-invalid={Boolean(errors[key])} />
          {errors[key] && <span className="field-error">{errors[key]}</span>}
        </div>
      ))}
      {submitError && <p className="alert alert-error form-full">{submitError}</p>}
      <div className="button-row form-full">
        <button type="button" className="button button-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Saving…" : initialValue ? "Save changes" : "Add class"}</button>
      </div>
    </form>
  );
}
