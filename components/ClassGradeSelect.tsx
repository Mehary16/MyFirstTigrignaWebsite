import { CLASS_GRADES, CLASS_GRADE_LABELS, type ClassGrade } from '../lib/classGrades';
import { cn } from '../lib/cn';

type ClassGradeSelectProps = {
  label?: string;
  value: ClassGrade | '';
  onChange: (value: ClassGrade | '') => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  optional?: boolean;
};

export default function ClassGradeSelect({
  label = 'Class grade',
  value,
  onChange,
  required = true,
  disabled,
  className,
  optional = false
}: ClassGradeSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        required={required && !optional}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value as ClassGrade | '')}
        className={cn(
          'mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-slate-500',
          className
        )}
      >
        {optional ? <option value="">All grades (optional)</option> : <option value="">Select grade</option>}
        {CLASS_GRADES.map((grade) => (
          <option key={grade} value={grade}>
            {CLASS_GRADE_LABELS[grade]}
          </option>
        ))}
      </select>
    </div>
  );
}
