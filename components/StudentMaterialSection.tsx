'use client';

import {
  getMaterialDownloadLabel,
  getMaterialFileHref,
  inferMediaKind,
  type MaterialRow
} from '../lib/teacherMaterials';

function MaterialPreview({ material }: { material: MaterialRow }) {
  if (!material.file_url) return null;

  const mediaKind = inferMediaKind(undefined, material.file_url, material.file_name);

  if (material.material_category === 'media' && mediaKind === 'video') {
    return (
      <video controls className="mt-4 w-full rounded-2xl border border-slate-200 bg-black" src={material.file_url}>
        Your browser does not support video playback.
      </video>
    );
  }

  if (material.material_category === 'media' && mediaKind === 'audio') {
    return (
      <audio controls className="mt-4 w-full" src={material.file_url}>
        Your browser does not support audio playback.
      </audio>
    );
  }

  return null;
}

type StudentMaterialSectionProps = {
  title: string;
  description: string;
  emptyMessage: string;
  materials: MaterialRow[];
};

export default function StudentMaterialSection({
  title,
  description,
  emptyMessage,
  materials
}: StudentMaterialSectionProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-slate-600">{description}</p>
      <div className="mt-5 grid gap-4">
        {materials.length ? (
          materials.map((material) => (
            <article key={material.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{material.title}</h3>
                  {material.file_name && <p className="text-sm text-slate-500">{material.file_name}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {material.file_url && (
                    <a
                      href={getMaterialFileHref(material) ?? material.file_url}
                      {...(material.material_category === 'media'
                        ? { target: '_blank', rel: 'noreferrer' }
                        : {})}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      {getMaterialDownloadLabel(material)}
                    </a>
                  )}
                  {material.external_link && (
                    <a
                      href={material.external_link}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Open Link
                    </a>
                  )}
                </div>
              </div>
              <MaterialPreview material={material} />
            </article>
          ))
        ) : (
          <p className="text-slate-600">{emptyMessage}</p>
        )}
      </div>
    </section>
  );
}
