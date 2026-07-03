'use client';

import type { AttachmentFields } from '../lib/attachments';
import { getAttachmentDownloadHref, getAttachmentOpenHref } from '../lib/attachments';

type AttachmentFieldProps = {
  label?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  existing?: AttachmentFields | null;
  onRemoveExisting?: () => void;
  disabled?: boolean;
};

export function AttachmentFileInput({
  label = 'Attach homework file (optional)',
  file,
  onFileChange,
  disabled
}: Pick<AttachmentFieldProps, 'label' | 'file' | 'onFileChange' | 'disabled'>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="file"
        disabled={disabled}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.jpg,.jpeg,.png,.webp,.gif"
        onChange={(event) => onFileChange(event.currentTarget.files?.[0] ?? null)}
        className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
      />
      {file && <p className="mt-2 text-xs text-slate-500">Selected: {file.name}</p>}
    </div>
  );
}

export function AttachmentActions({
  attachment,
  onReplace,
  onDelete,
  busy
}: {
  attachment: AttachmentFields;
  onReplace?: () => void;
  onDelete?: () => void;
  busy?: boolean;
}) {
  if (!attachment.file_url) return null;

  const openHref = getAttachmentOpenHref(attachment);
  const downloadHref = getAttachmentDownloadHref(attachment);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-sm font-medium text-slate-900">{attachment.file_name ?? 'Attached file'}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {openHref && (
          <a
            href={openHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open
          </a>
        )}
        {downloadHref && (
          <a
            href={downloadHref}
            download={attachment.file_name ?? undefined}
            className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
          >
            Download
          </a>
        )}
        {onReplace && (
          <button
            type="button"
            disabled={busy}
            onClick={onReplace}
            className="rounded-full border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
          >
            Edit file
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Delete file
          </button>
        )}
      </div>
    </div>
  );
}
