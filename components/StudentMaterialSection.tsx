'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import {
  getMaterialDownloadLabel,
  getMaterialFileHref,
  inferMediaKind,
  type MaterialRow
} from '../lib/teacherMaterials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from './ui';

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
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {materials.length ? (
          <div className="grid gap-4">
            {materials.map((material) => (
              <article key={material.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{material.title}</h3>
                    {material.file_name && <p className="text-sm text-slate-500">{material.file_name}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
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
                <MaterialPreview material={material} />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={FileText} title={emptyMessage} description="Your teacher will share materials here when they are ready." />
        )}
      </CardContent>
    </Card>
  );
}
