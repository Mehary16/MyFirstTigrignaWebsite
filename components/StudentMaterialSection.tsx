'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import {
  getFileExtension,
  getMaterialDownloadLabel,
  getMaterialFileHref,
  inferMediaKind,
  type MaterialRow
} from '../lib/teacherMaterials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from './ui';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp']);

function isImageMaterial(material: MaterialRow) {
  const extension = getFileExtension(material.file_name ?? material.file_url ?? '');
  return IMAGE_EXTENSIONS.has(extension);
}

function isPdfMaterial(material: MaterialRow) {
  return getFileExtension(material.file_name ?? material.file_url ?? '') === 'pdf';
}

function MaterialOpenPanel({ material }: { material: MaterialRow }) {
  if (!material.file_url && !material.external_link) return null;

  const mediaKind = material.file_url ? inferMediaKind(undefined, material.file_url, material.file_name) : 'file';

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      {material.file_url && material.material_category === 'media' && mediaKind === 'video' && (
        <video controls className="w-full rounded-2xl border border-slate-200 bg-black" src={material.file_url}>
          Your browser does not support video playback.
        </video>
      )}

      {material.file_url && material.material_category === 'media' && mediaKind === 'audio' && (
        <audio controls className="w-full" src={material.file_url}>
          Your browser does not support audio playback.
        </audio>
      )}

      {material.file_url && material.material_category === 'document' && isImageMaterial(material) && (
        <img
          src={material.file_url}
          alt={material.file_name ?? material.title}
          className="max-h-[28rem] w-full rounded-2xl border border-slate-200 object-contain"
        />
      )}

      {material.file_url && material.material_category === 'document' && isPdfMaterial(material) && (
        <iframe
          title={material.title}
          src={material.file_url}
          className="h-[28rem] w-full rounded-2xl border border-slate-200 bg-white"
        />
      )}

      {material.file_url &&
        material.material_category === 'document' &&
        !isImageMaterial(material) &&
        !isPdfMaterial(material) && (
          <p className="text-sm text-slate-600">
            Preview is not available for this file type.{' '}
            <a href={material.file_url} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 underline">
              Open file in a new tab
            </a>
            .
          </p>
        )}

      {material.external_link && (
        <p className="text-sm text-slate-600">
          External link:{' '}
          <a href={material.external_link} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 underline break-all">
            {material.external_link}
          </a>
        </p>
      )}
    </div>
  );
}

type StudentMaterialSectionProps = {
  title: string;
  description: string;
  emptyMessage: string;
  materials: MaterialRow[];
  sectionId?: string;
};

export default function StudentMaterialSection({
  title,
  description,
  emptyMessage,
  materials,
  sectionId
}: StudentMaterialSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filteredMaterials = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return materials;

    return materials.filter((m) => {
      const haystack = [m.title, m.file_name ?? '', m.external_link ?? '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [materials, query]);

  useEffect(() => {
    if (!openId) return;
    if (!filteredMaterials.some((m) => m.id === openId)) setOpenId(null);
  }, [openId, filteredMaterials]);

  const showEmptySearch = materials.length > 0 && filteredMaterials.length === 0;

  return (
    <Card variant="elevated" id={sectionId}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="pt-2">
          <label className="sr-only" htmlFor={`${sectionId ?? title}-search`}>
            Search materials
          </label>
          <input
            id={`${sectionId ?? title}-search`}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Search materials..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none shadow-sm focus:border-slate-500"
          />
        </div>
      </CardHeader>
      <CardContent>
        {materials.length ? (
          showEmptySearch ? (
            <EmptyState
              icon={FileText}
              title="No matching materials"
              description="Try a different keyword."
            />
          ) : (
          <div className="grid gap-4">
            {filteredMaterials.map((material) => (
              <article key={material.id} id={`material-${material.id}`} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{material.title}</h3>
                    {material.file_name && <p className="text-sm text-slate-500">{material.file_name}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(material.file_url || material.external_link) && (
                      <button
                        type="button"
                        onClick={() => setOpenId((current) => (current === material.id ? null : material.id))}
                        className="link-button-secondary px-4 py-2 text-sm"
                      >
                        {openId === material.id ? 'Close' : 'Open'}
                      </button>
                    )}
                    {material.file_url && (
                      <Link
                        href={getMaterialFileHref(material) ?? material.file_url}
                        {...(material.material_category === 'media'
                          ? { target: '_blank', rel: 'noreferrer' }
                          : {})}
                        className="link-button-primary px-4 py-2 text-sm"
                      >
                        {getMaterialDownloadLabel(material)}
                      </Link>
                    )}
                    {material.external_link && (
                      <a
                        href={material.external_link}
                        target="_blank"
                        rel="noreferrer"
                        className="link-button-secondary px-4 py-2 text-sm"
                      >
                        Open Link
                      </a>
                    )}
                  </div>
                </div>
                {openId === material.id && <MaterialOpenPanel material={material} />}
              </article>
            ))}
          </div>
          )
        ) : (
          <EmptyState
            icon={FileText}
            title={emptyMessage}
            description="Your teacher will share materials here when they are ready."
          />
        )}
      </CardContent>
    </Card>
  );
}
