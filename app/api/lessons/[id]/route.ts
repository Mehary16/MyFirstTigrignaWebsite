import { NextResponse } from 'next/server';
import { CLASS_GRADES } from '../../../../lib/classGrades';
import { formatDatabaseError } from '../../../../lib/supabaseErrors';
import { requireTeacherApi } from '../../../../lib/lessonApiAuth';
import { revalidateLessonCaches } from '../../../../lib/revalidateLessons';

type UpdateLessonBody = {
  title?: string;
  description?: string | null;
  category?: string | null;
  level?: string | null;
  videoUrl?: string;
  externalLink?: string | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireTeacherApi();
  if ('error' in auth && auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const { supabase } = auth;
  const body = (await request.json()) as UpdateLessonBody;
  const title = body.title?.trim();
  const videoUrl = body.videoUrl?.trim();

  if (!title || !videoUrl) {
    return NextResponse.json({ error: 'Title and video URL are required.' }, { status: 400 });
  }

  const level = body.level?.trim() || null;
  if (!level || !CLASS_GRADES.includes(level as (typeof CLASS_GRADES)[number])) {
    return NextResponse.json({ error: 'Class grade (Grade 1, Grade 2, or Grade 3) is required.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('lessons')
    .update({
      title,
      description: body.description?.trim() || null,
      category: body.category?.trim() || null,
      level,
      video_url: videoUrl,
      external_link: body.externalLink?.trim() || null
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  revalidateLessonCaches(id);

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireTeacherApi();
  if ('error' in auth && auth.error) {
    return auth.error;
  }

  const { id } = await context.params;
  const { supabase } = auth;

  const { error } = await supabase.from('lessons').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: formatDatabaseError(error.message) }, { status: 500 });
  }

  revalidateLessonCaches(id);

  return NextResponse.json({ success: true });
}
