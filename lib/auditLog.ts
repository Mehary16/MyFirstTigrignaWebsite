import { createAdminSupabaseClient } from './supabaseAdmin';

export type AuditLogEvent = {
  action: string;
  actorId?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

function isMissingAuditTable(message: string) {
  return message.includes('audit_logs') && (message.includes('does not exist') || message.includes('schema cache'));
}

export async function writeAuditLog(event: AuditLogEvent) {
  const payload = {
    action: event.action,
    actor_id: event.actorId ?? null,
    target_id: event.targetId ?? null,
    metadata: event.metadata ?? {}
  };

  const admin = createAdminSupabaseClient();
  if (!admin) {
    if (process.env.NODE_ENV !== 'production') {
      console.info('[audit]', payload);
    }
    return { stored: false };
  }

  const { error } = await admin.from('audit_logs').insert(payload);

  if (error) {
    if (isMissingAuditTable(error.message)) {
      if (process.env.NODE_ENV !== 'production') {
        console.info('[audit:fallback]', payload);
      }
      return { stored: false, error: 'Run supabase/FIX_AUDIT_LOGS.sql to enable audit logs.' };
    }

    return { stored: false, error: error.message };
  }

  return { stored: true };
}
