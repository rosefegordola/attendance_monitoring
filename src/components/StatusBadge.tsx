import type { AttendanceStatus } from "../types";

export default function StatusBadge({ status }: { status: AttendanceStatus }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>;
}
