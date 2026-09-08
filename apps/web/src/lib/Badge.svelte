<script lang="ts">
  let { value }: { value: string } = $props();
  const tone: Record<string, string> = {
    operational: 'bg-emerald-50 text-emerald-700 border-emerald-200', degraded: 'bg-amber-50 text-amber-700 border-amber-200',
    outage: 'bg-red-50 text-red-700 border-red-200', maintenance: 'bg-sky-50 text-sky-700 border-sky-200',
    critical: 'bg-red-50 text-red-700 border-red-200', high: 'bg-orange-50 text-orange-700 border-orange-200', medium: 'bg-amber-50 text-amber-700 border-amber-200', low: 'bg-slate-50 text-slate-600 border-slate-200',
    investigating: 'bg-violet-50 text-violet-700 border-violet-200', identified: 'bg-orange-50 text-orange-700 border-orange-200', monitoring: 'bg-sky-50 text-sky-700 border-sky-200', resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
</script>

<span class={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize tracking-wide ${tone[value] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>{value}</span>
