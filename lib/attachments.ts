export type AttachmentFields = {
  file_url: string | null;
  file_name: string | null;
};

export function getAttachmentOpenHref(attachment: AttachmentFields) {
  return attachment.file_url?.trim() || null;
}

export function getAttachmentDownloadHref(attachment: AttachmentFields) {
  if (!attachment.file_url) return null;

  try {
    const url = new URL(attachment.file_url);
    url.searchParams.set('download', attachment.file_name?.trim() || '');
    return url.toString();
  } catch {
    return attachment.file_url;
  }
}

export async function uploadTeacherAttachment(file: File): Promise<{ fileUrl: string; fileName: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/attachments/upload', {
    method: 'POST',
    body: formData
  });

  const payload = (await response.json()) as { error?: string; fileUrl?: string; fileName?: string };

  if (!response.ok || !payload.fileUrl) {
    throw new Error(payload.error ?? 'Could not upload the file.');
  }

  return {
    fileUrl: payload.fileUrl,
    fileName: payload.fileName ?? file.name
  };
}
