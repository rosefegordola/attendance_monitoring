import type { Timestamp } from "firebase/firestore";

export type UserRole = "teacher" | "student" | "pendingTeacher";
export type TeacherAccountStatus = "pendingEmailVerification" | "active";
export type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  status?: TeacherAccountStatus;
  studentId?: string;
  teacherId?: string;
  createdAt?: Timestamp;
}

export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  course: string;
  yearLevel: string;
  section: string;
  email: string;
  contactNumber: string;
  createdAt?: Timestamp;
}

export interface ClassRecord {
  id: string;
  classCode: string;
  subjectName: string;
  teacherName: string;
  schedule: string;
  room: string;
  section: string;
  createdAt?: Timestamp;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  classCode: string;
  subjectName: string;
  date: string;
  section?: string;
  teacherId?: string;
  status: AttendanceStatus;
  remarks: string;
  markedBy: string;
  createdAt?: Timestamp;
}

export const attendanceStatuses: AttendanceStatus[] = ["Present", "Absent", "Late", "Excused"];
