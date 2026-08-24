'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { activityLabel, type AlphabetActivityRow, type AlphabetActivityType } from '../../lib/alphabetProgressDb';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const ACTIVITY_OPTIONS: AlphabetActivityType[] = ['learn', 'trace', 'quiz_start', 'quiz_answer'];

type EditDraft = {
  activityType: AlphabetActivityType;
  formKey: string;
  familyId: string;
  correct: '' | 'true' | 'false';
};

function draftFromActivity(item: AlphabetActivityRow): EditDraft {
  return {
    activityType: item.activity_type,
    formKey: item.form_key ?? '',
    familyId: item.family_id ?? '',
    correct: item.correct === true ? 'true' : item.correct === false ? 'false' : ''
  };
}

function formatDetails(item: AlphabetActivityRow) {
  const char = typeof item.metadata?.char === 'string' ? item.metadata.char : null;
  const transliteration = typeof item.metadata?.transliteration === 'string' ? item.metadata.transliteration : null;

  if (item.form_key && char) {
    return `${char}${transliteration ? ` (${transliteration})` : ''} · ${item.form_key}`;
  }

  return item.form_key ?? item.family_id ?? '—';
}

export default function TeacherAlphabetActivity() {
  const [activities, setActivities] = useState<AlphabetActivityRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'learn' | 'trace' | 'quiz_answer' | 'quiz_start'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = filter === 'all' ? '' : `?type=${filter}&limit=100`;
      const response = await fetch(`/api/alphabet/activity${query}`);
      const payload = (await response.json()) as { activities?: AlphabetActivityRow[]; error?: string };
      if (!response.ok) {
        setError(payload.error ?? 'Could not load alphabet activity.');
        return;
      }
      setActivities(payload.activities ?? []);
      setSelectedIds(new Set());
    } catch {
      setError('Could not load alphabet activity.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  const selectableIds = activities.map((item) => item.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const someSelected = selectableIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds));
  };

  const startEdit = (item: AlphabetActivityRow) => {
    setEditingId(item.id);
    setEditDraft(draftFromActivity(item));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async (id: string) => {
    if (!editDraft) return;

    setBusyId(id);
    setError(null);

    try {
      const response = await fetch('/api/alphabet/activity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          activityType: editDraft.activityType,
          formKey: editDraft.formKey,
          familyId: editDraft.familyId,
          correct:
            editDraft.activityType === 'quiz_answer' && editDraft.correct
              ? editDraft.correct === 'true'
              : null
        })
      });

      const payload = (await response.json()) as { activity?: AlphabetActivityRow; error?: string };
      if (!response.ok) {
        setError(payload.error ?? 'Could not save changes.');
        return;
      }

      if (payload.activity) {
        setActivities((current) => current.map((item) => (item.id === id ? payload.activity! : item)));
      } else {
        await loadActivities();
      }

      cancelEdit();
    } catch {
      setError('Could not save changes.');
    } finally {
      setBusyId(null);
    }
  };

  const removeActivity = async (item: AlphabetActivityRow) => {
    const name = item.profiles?.full_name ?? 'this user';
    if (!window.confirm(`Remove this ${activityLabel(item.activity_type).toLowerCase()} entry for ${name}?`)) {
      return;
    }

    setBusyId(item.id);
    setError(null);

    try {
      const response = await fetch(`/api/alphabet/activity?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? 'Could not remove activity entry.');
        return;
      }

      setActivities((current) => current.filter((entry) => entry.id !== item.id));
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(item.id);
        return next;
      });
      if (editingId === item.id) cancelEdit();
    } catch {
      setError('Could not remove activity entry.');
    } finally {
      setBusyId(null);
    }
  };

  const removeSelected = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;

    if (!window.confirm(`Remove ${ids.length} selected activit${ids.length === 1 ? 'y' : 'ies'}?`)) {
      return;
    }

    setBulkBusy(true);
    setError(null);

    try {
      const response = await fetch('/api/alphabet/activity/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const payload = (await response.json()) as { deletedIds?: string[]; error?: string };
      if (!response.ok) {
        setError(payload.error ?? 'Could not remove selected activities.');
        return;
      }

      const deleted = new Set(payload.deletedIds ?? ids);
      setActivities((current) => current.filter((entry) => !deleted.has(entry.id)));
      setSelectedIds(new Set());
      if (editingId && deleted.has(editingId)) cancelEdit();
    } catch {
      setError('Could not remove selected activities.');
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Alphabet activity log</p>
          <p className="text-xs text-slate-500">See who is tracing letters, studying, or taking the quiz.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'learn', 'trace', 'quiz_start', 'quiz_answer'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === option ? 'bg-brand-900 text-white' : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {option === 'all' ? 'All' : activityLabel(option)}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {selectedIds.size > 0 ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-3">
          <p className="text-sm font-semibold text-red-900">
            {selectedIds.size} activit{selectedIds.size === 1 ? 'y' : 'ies'} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedIds(new Set())} disabled={bulkBusy}>
              Clear selection
            </Button>
            <Button type="button" size="sm" variant="danger" onClick={removeSelected} disabled={bulkBusy}>
              <Trash2 className="h-4 w-4" />
              {bulkBusy ? 'Removing...' : `Remove selected (${selectedIds.size})`}
            </Button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading activity…</p>
      ) : activities.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="w-10 px-3 py-2">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all activities"
                    className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-700/20"
                  />
                </th>
                <th className="px-3 py-2">Student / user</th>
                <th className="px-3 py-2">Activity</th>
                <th className="px-3 py-2">Details</th>
                <th className="px-3 py-2">Result</th>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((item) => {
                const isEditing = editingId === item.id;
                const isBusy = busyId === item.id;

                return (
                  <tr key={item.id} className="border-b border-slate-100 align-top">
                    <td className="px-3 py-3">
                      {!isEditing ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelected(item.id)}
                          disabled={bulkBusy || Boolean(busyId)}
                          aria-label={`Select activity for ${item.profiles?.full_name ?? 'user'}`}
                          className="h-4 w-4 rounded border-slate-300 text-brand-900 focus:ring-brand-700/20"
                        />
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-900">{item.profiles?.full_name ?? 'User'}</p>
                      <p className="text-xs text-slate-500">
                        {item.profiles?.class_grade ? `${item.profiles.class_grade} · ` : ''}
                        {item.profiles?.email ?? item.user_id.slice(0, 8)}
                      </p>
                    </td>

                    {isEditing && editDraft ? (
                      <>
                        <td className="px-3 py-3">
                          <select
                            value={editDraft.activityType}
                            onChange={(event) =>
                              setEditDraft((current) =>
                                current ? { ...current, activityType: event.target.value as AlphabetActivityType } : current
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                          >
                            {ACTIVITY_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {activityLabel(option)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <div className="space-y-2">
                            <input
                              value={editDraft.formKey}
                              onChange={(event) =>
                                setEditDraft((current) => (current ? { ...current, formKey: event.target.value } : current))
                              }
                              placeholder="Form key (e.g. be:0)"
                              className="w-full rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                            />
                            <input
                              value={editDraft.familyId}
                              onChange={(event) =>
                                setEditDraft((current) => (current ? { ...current, familyId: event.target.value } : current))
                              }
                              placeholder="Family id (optional)"
                              className="w-full rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {editDraft.activityType === 'quiz_answer' ? (
                            <select
                              value={editDraft.correct}
                              onChange={(event) =>
                                setEditDraft((current) =>
                                  current ? { ...current, correct: event.target.value as EditDraft['correct'] } : current
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 px-2 py-1.5 text-sm"
                            >
                              <option value="">No result</option>
                              <option value="true">Correct</option>
                              <option value="false">Wrong</option>
                            </select>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Button type="button" size="sm" onClick={() => saveEdit(item.id)} disabled={isBusy}>
                              Save
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={cancelEdit} disabled={isBusy}>
                              <X className="h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-3">
                          <Badge variant={item.activity_type.startsWith('quiz') ? 'brand' : 'info'}>
                            {activityLabel(item.activity_type)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-slate-600">{formatDetails(item)}</td>
                        <td className="px-3 py-3 text-slate-600">
                          {item.activity_type === 'quiz_answer'
                            ? item.correct
                              ? 'Correct'
                              : 'Wrong'
                            : '—'}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => startEdit(item)}
                              disabled={isBusy}
                              aria-label="Edit activity entry"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => removeActivity(item)}
                              disabled={isBusy}
                              aria-label="Remove activity entry"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No alphabet activity yet. Students will appear here when they study or take the quiz.</p>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Run <code className="rounded bg-slate-100 px-1">supabase/FIX_ALPHABET_ACTIVITY_MANAGE.sql</code> once if edit or
        remove shows a permission error.
      </p>
    </div>
  );
}
