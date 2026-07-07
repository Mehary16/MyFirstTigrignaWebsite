import { getAttachmentDownloadHref, getAttachmentOpenHref } from '../lib/attachments';
import type { AnnouncementRow } from './TeacherAnnouncementManager';

type AnnouncementsFeedProps = {
  announcements: AnnouncementRow[];
  title?: string;
};

export default function AnnouncementsFeed({ announcements, title = 'Announcements' }: AnnouncementsFeedProps) {
  if (!announcements.length) return null;

  return (
    <section id="student-announcements" className="rounded-[2rem] border border-blue-100 bg-blue-50/50 p-6">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {announcements.map((item) => {
          const openHref = getAttachmentOpenHref(item);
          const downloadHref = getAttachmentDownloadHref(item);

          return (
            <article key={item.id} id={`announcement-${item.id}`} className="rounded-2xl border border-blue-100 bg-white p-4">
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.body}</p>
              {openHref && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={openHref}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Open attachment
                  </a>
                  {downloadHref && (
                    <a
                      href={downloadHref}
                      download={item.file_name ?? undefined}
                      className="rounded-full border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-50"
                    >
                      Download
                    </a>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
