import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, label, hint, error, id, ...props }, ref) => {
  const textareaId = id ?? props.name;

  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/15',
          error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-200',
          className
        )}
        {...props}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
