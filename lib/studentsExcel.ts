import * as XLSX from 'xlsx';
import { CLASS_GRADES, normalizeClassGrade, type ClassGrade } from './classGrades';
import type { StudentListItem } from './studentList';

export const STUDENTS_SHEET_NAME = 'Students';
export const INSTRUCTIONS_SHEET_NAME = 'Instructions';

export const STUDENTS_HEADERS = [
  'Student ID',
  'First Name',
  'Last Name',
  'Email',
  'Class Grade',
  'Status',
  'Joined',
  'Submissions',
  'Temporary Password'
] as const;

export type StudentsExcelRow = {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  classGrade: string;
  status: string;
  joined: string;
  submissions: number;
  temporaryPassword: string;
};

export type ParsedStudentImportRow = {
  studentId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  classGrade: ClassGrade | null;
  status: 'active' | 'suspended' | null;
  temporaryPassword: string | null;
};

function cellValue(value: unknown) {
  if (value == null) return '';
  return String(value).trim();
}

function compareForExport(a: StudentListItem, b: StudentListItem) {
  const gradeOrder = (grade: ClassGrade | null) => {
    if (!grade) return CLASS_GRADES.length;
    return CLASS_GRADES.indexOf(grade);
  };
  const byGrade = gradeOrder(a.class_grade) - gradeOrder(b.class_grade);
  if (byGrade !== 0) return byGrade;
  const byLast = a.last_name.localeCompare(b.last_name, undefined, { sensitivity: 'base' });
  if (byLast !== 0) return byLast;
  return a.first_name.localeCompare(b.first_name, undefined, { sensitivity: 'base' });
}

export function studentsToExcelRows(students: StudentListItem[]): StudentsExcelRow[] {
  return [...students].sort(compareForExport).map((student) => ({
    studentId: student.id,
    firstName: student.first_name === '—' ? '' : student.first_name,
    lastName: student.last_name === '—' ? '' : student.last_name,
    email: student.email ?? '',
    classGrade: student.class_grade ?? '',
    status: student.is_active ? 'Active' : 'Suspended',
    joined: new Date(student.created_at).toLocaleDateString(),
    submissions: student.submission_count,
    temporaryPassword: ''
  }));
}

function rowToSheetObject(row: StudentsExcelRow) {
  return {
    'Student ID': row.studentId,
    'First Name': row.firstName,
    'Last Name': row.lastName,
    Email: row.email,
    'Class Grade': row.classGrade,
    Status: row.status,
    Joined: row.joined,
    Submissions: row.submissions,
    'Temporary Password': row.temporaryPassword
  };
}

function buildInstructionsSheet() {
  const rows = [
    { Topic: 'Export', Details: 'Download your current student roster grouped by class grade.' },
    {
      Topic: 'Import new students',
      Details: 'Leave Student ID empty. Fill First Name, Last Name, Email, Class Grade, and Temporary Password (8+ characters).'
    },
    {
      Topic: 'Update existing students',
      Details: 'Keep the Student ID from export. You can change names, Class Grade, and Status (Active or Suspended).'
    },
    {
      Topic: 'Class grades',
      Details: 'Use exactly: Grade 1, Grade 2, or Grade 3.'
    },
    {
      Topic: 'Setup email option',
      Details: 'For bulk import, temporary passwords are required. Students change their password after first login.'
    }
  ];
  return XLSX.utils.json_to_sheet(rows);
}

export function buildStudentsWorkbook(students: StudentListItem[], options?: { template?: boolean }) {
  const rows = options?.template
    ? [
        {
          studentId: '',
          firstName: 'Sara',
          lastName: 'Tesfay',
          email: 'sara@example.com',
          classGrade: 'Grade 1',
          status: 'Active',
          joined: '',
          submissions: 0,
          temporaryPassword: 'ChangeMe123'
        },
        {
          studentId: '',
          firstName: 'Daniel',
          lastName: 'Haile',
          email: 'daniel@example.com',
          classGrade: 'Grade 2',
          status: 'Active',
          joined: '',
          submissions: 0,
          temporaryPassword: 'ChangeMe123'
        }
      ]
    : studentsToExcelRows(students);

  const mainSheet = XLSX.utils.json_to_sheet(rows.map(rowToSheetObject), { header: [...STUDENTS_HEADERS] });
  mainSheet['!cols'] = [
    { wch: 38 },
    { wch: 16 },
    { wch: 16 },
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, mainSheet, STUDENTS_SHEET_NAME);

  if (!options?.template) {
    for (const grade of CLASS_GRADES) {
      const gradeRows = studentsToExcelRows(students.filter((student) => student.class_grade === grade));
      if (!gradeRows.length) continue;
      const sheet = XLSX.utils.json_to_sheet(gradeRows.map(rowToSheetObject), { header: [...STUDENTS_HEADERS] });
      sheet['!cols'] = mainSheet['!cols'];
      XLSX.utils.book_append_sheet(workbook, sheet, grade);
    }
  }

  const instructions = buildInstructionsSheet();
  XLSX.utils.book_append_sheet(workbook, instructions, INSTRUCTIONS_SHEET_NAME);

  return workbook;
}

export function parseStudentsWorkbook(buffer: ArrayBuffer): ParsedStudentImportRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames.includes(STUDENTS_SHEET_NAME)
    ? STUDENTS_SHEET_NAME
    : workbook.SheetNames[0];

  if (!sheetName || sheetName === INSTRUCTIONS_SHEET_NAME) return [];

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return rawRows
    .map((row) => {
      const firstName = cellValue(row['First Name'] ?? row.first_name ?? row.First);
      const lastName = cellValue(row['Last Name'] ?? row.last_name ?? row.Last);
      const email = cellValue(row.Email ?? row.email).toLowerCase();
      const classGrade = normalizeClassGrade(cellValue(row['Class Grade'] ?? row.class_grade ?? row.Grade));
      const studentId = cellValue(row['Student ID'] ?? row.student_id ?? row.id);
      const temporaryPassword = cellValue(row['Temporary Password'] ?? row.temporary_password ?? row.Password);
      const statusRaw = cellValue(row.Status ?? row.status).toLowerCase();
      const status: ParsedStudentImportRow['status'] =
        statusRaw === 'active' ? 'active' : statusRaw === 'suspended' ? 'suspended' : null;

      return {
        studentId: studentId || null,
        firstName,
        lastName,
        email,
        classGrade,
        status,
        temporaryPassword: temporaryPassword || null
      };
    })
    .filter(
      (row) =>
        row.studentId ||
        row.firstName ||
        row.lastName ||
        row.email ||
        row.classGrade ||
        row.temporaryPassword
    );
}
