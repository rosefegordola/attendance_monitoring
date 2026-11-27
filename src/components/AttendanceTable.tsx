import type { AttendanceRecord, AttendanceStatus } from "../types";
import { attendanceStatuses } from "../types";
import StatusBadge from "./StatusBadge";
import Icon from "./Icon";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onStatusChange?: (recordId: string, status: AttendanceStatus) => void;
  onDelete?: (record: AttendanceRecord) => void;
}

export default function AttendanceTable({ records, onStatusChange, onDelete }: AttendanceTableProps) {
  if (!records.length) return <div className="empty-state">No attendance records match these filters.</div>;
  return (
    <div className="table-scroll">
      <table>
        <thead><tr><th>Student</th><th>Student ID</th><th>Class</th><th>Date</th><th>Status</th><th>Remarks</th>{onDelete && <th>Action</th>}</tr></thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.studentName}</td>
              <td>{record.studentId}</td>
              <td>{record.classCode} · {record.subjectName}</td>
              <td>{record.date}</td>
              <td>{onStatusChange ? (
                <label className="sr-only" htmlFor={`status-${record.id}`}>Attendance status for {record.studentName}</label>
              ) : null}
                {onStatusChange ? (
                  <select id={`status-${record.id}`} value={record.status} onChange={(event) => onStatusChange(record.id, event.target.value as AttendanceStatus)}>
                    {attendanceStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                ) : <StatusBadge status={record.status} />}
              </td>
              <td>{record.remarks || "—"}</td>
              {onDelete && <td><button className="button button-small button-danger" type="button" onClick={() => onDelete(record)} aria-label={`Delete attendance for ${record.studentName} on ${record.date}`}><Icon name="trash" />Delete</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
