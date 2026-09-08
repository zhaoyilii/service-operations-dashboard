<script lang="ts">
  let { page, totalPages, onchange }: { page: number; totalPages: number; onchange: (page: number) => void } = $props();
</script>

<div class="flex items-center justify-between border-t border-line px-5 py-4">
  <span class="text-xs font-semibold text-ink/50">Page {page} of {totalPages}</span>
  <div class="flex gap-2">
    <button class="btn-secondary !px-3 !py-1.5" disabled={page <= 1} onclick={() => onchange(page - 1)}>← Previous</button>
    <button class="btn-secondary !px-3 !py-1.5" disabled={page >= totalPages} onclick={() => onchange(page + 1)}>Next →</button>
  </div>
</div>
