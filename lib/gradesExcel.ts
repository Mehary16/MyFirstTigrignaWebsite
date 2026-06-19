import * as XLSX from 'xlsx';
import type { GradeRow } from '../components/TeacherGradeManager';

export const GRADES_SHEET_NAME = 'Grades';
export const GRADES_HEADERS = [
  'Grade ID',
  'Student Name',
  'Student ID',
  'Assignment',
  'Grade',
  'Feedback',
  'Date'
] as const;

export type GradesExcelRow = {
  gradeId: string;
  studentName: string;
  studentId: string;
  title: string;
  grade: string;
  feedback: string;
  date: string;
};

export type ParsedGradeImportRow = {
  gradeId: string | null;
  studentName: string;
  studentId: string | null;
  title: string;
  grade: string;
  feedback: string | null;
};

function studentNameFromGrade(grade: GradeRow) {
  if (!grade.profiles) return 'Student';
  if (Array.isArray(grade.profiles)) return grade.profiles[0]?.full_name ?? 'Student';
  return grade.profiles.full_name;
}

export function gradesToExcelRows(grades: GradeRow[]): GradesExcelRow[] {
  return grades.map((grade) => ({
    gradeId: grade.id,
    studentName: studentNameFromGrade(grade),
    studentId: grade.student_id,
    title: grade.title,
    grade: grade.grade,
    feedback: grade.feedback ?? '',
    date: new Date(grade.created_at).toLocaleDateString()
  }));
}

export function buildGradesWorkbook(grades: GradeRow[]) {
  const rows = gradesToExcelRows(grades);
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      'Grade ID': row.gradeId,
      'Student Name': row.studentName,
      'Student ID': row.studentId,
      Assignment: row.title,
      Grade: row.grade,
      Feedback: row.feedback,
      Date: row.date
    })),
    { header: [...GRADES_HEADERS] }
  );

  worksheet['!cols'] = [
    { wch: 38 },
    { wch: 24 },
    { wch: 38 },
    { wch: 28 },
    { wch: 12 },
    { wch: 36 },
    { wch: 14 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, GRADES_SHEET_NAME);
  return workbook;
}

export function downloadGradesExcel(grades: GradeRow[], fileName?: string) {
  const workbook = buildGradesWorkbook(grades);
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, fileName ?? `student-grades-${stamp}.xlsx`);
}

function cellValue(value: unknown) {
  if (value == null) return '';
  return String(value).trim();
}

export function parseGradesWorkbook(buffer: ArrayBuffer): ParsedGradeImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames.includes(GRADES_SHEET_NAME)
    ? GRADES_SHEET_NAME
    : workbook.SheetNames[0];

  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return rawRows
    .map((row) => {
      const title = cellValue(row.Assignment ?? row.assignment ?? row['Assignment / lesson']);
      const grade = cellValue(row.Grade ?? row.grade);
      const studentName = cellValue(row['Student Name'] ?? row.student_name ?? row.Student);
      const studentId = cellValue(row['Student ID'] ?? row.student_id);
      const gradeId = cellValue(row['Grade ID'] ?? row.grade_id ?? row.id);
      const feedback = cellValue(row.Feedback ?? row.feedback);

      return {
        gradeId: gradeId || null,
        studentName,
        studentId: studentId || null,
        title,
        grade,
        feedback: feedback || null
      };
    })
    .filter((row) => row.title || row.grade || row.studentName || row.studentId);
}

export function parseGradesFile(file: File): Promise<ParsedGradeImportRow[]> {
  return file.arrayBuffer().then(parseGradesWorkbook);
}
