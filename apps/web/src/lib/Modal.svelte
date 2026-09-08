<script lang="ts">
  let { title, onclose, children }: { title: string; onclose: () => void; children: import('svelte').Snippet } = $props();
</script>

<div class="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm" role="presentation" onclick={(e) => e.currentTarget === e.target && onclose()} onkeydown={(e) => e.key === 'Escape' && onclose()}>
  <div class="max-h-[92vh] w-full max-w-xl overflow-auto rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label={title}>
    <header class="flex items-center justify-between border-b border-line px-6 py-5">
      <h2 class="font-display text-xl font-bold">{title}</h2>
      <button class="grid h-9 w-9 place-items-center rounded-full text-xl hover:bg-canvas" aria-label="Close" onclick={onclose}>×</button>
    </header>
    <div class="p-6">{@render children()}</div>
  </div>
</div>
