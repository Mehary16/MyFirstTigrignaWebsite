import { PLATFORM_READINESS, PLATFORM_READINESS_INTRO } from '../lib/helpCopy';

export default function TeacherPlatformReadiness() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700">
              Area
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700">
              Readiness
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-700">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {PLATFORM_READINESS.map((row) => (
            <tr key={row.area}>
              <td className="px-4 py-3 font-medium text-slate-900">{row.area}</td>
              <td className="px-4 py-3 text-slate-800">{row.readiness}</td>
              <td className="px-4 py-3 text-slate-600">{row.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 bg-slate-50/80 px-4 py-3 text-xs text-slate-500">
        {PLATFORM_READINESS_INTRO.description}
      </p>
    </div>
  );
}
