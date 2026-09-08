<script lang="ts">
  import { onMount } from 'svelte';
  import type { DashboardSummary, Incident, IncidentInput, Page, Service, ServiceInput } from '@service-ops/shared';
  import { incidentSeverities, incidentStatuses, serviceEnvironments, serviceStatuses } from '@service-ops/shared';
  import { api } from '$lib/api';
  import Badge from '$lib/Badge.svelte';
  import Modal from '$lib/Modal.svelte';
  import Pagination from '$lib/Pagination.svelte';

  type Tab = 'overview' | 'services' | 'incidents';
  let tab: Tab = 'overview';
  let loading = true;
  let error = '';
  let toast = '';
  let summary: DashboardSummary = { serviceCount: 0, operationalCount: 0, activeIncidentCount: 0, criticalIncidentCount: 0 };
  let services: Page<Service> = { items: [], page: 1, pageSize: 8, total: 0, totalPages: 1 };
  let allServices: Service[] = [];
  let incidents: Page<Incident> = { items: [], page: 1, pageSize: 8, total: 0, totalPages: 1 };
  let serviceSearch = '';
  let serviceStatus = '';
  let incidentSearch = '';
  let incidentStatus = '';
  let incidentSeverity = '';
  let serviceModal = false;
  let incidentModal = false;
  let editingService: Service | null = null;
  let editingIncident: Incident | null = null;
  let saving = false;
  let formError = '';
  let serviceForm: ServiceInput = { name: '', description: '', owner: '', status: 'operational', environment: 'production' }; //初始表单
  let incidentForm: IncidentInput = { title: '', description: '', serviceId: '', severity: 'medium', status: 'investigating' };

  const serviceName = (id: string) => allServices.find(s => s.id === id)?.name ?? 'Unknown service';
  const formatTime = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date));
  const notify = (message: string) => { toast = message; setTimeout(() => toast = '', 2800); };

  async function loadSummary() { summary = await api.summary(); }
  async function loadServices(page = services.page) {
    services = await api.services({ search: serviceSearch, status: serviceStatus, page, pageSize: 8 }); //传给api客户端的数据
    allServices = (await api.services({ pageSize: 50 })).items;
  }
  async function loadIncidents(page = incidents.page) {
    incidents = await api.incidents({ search: incidentSearch, status: incidentStatus, severity: incidentSeverity, page, pageSize: 8 });
  }
  async function refresh() { await Promise.all([loadSummary(), loadServices(), loadIncidents()]); }

  onMount(async () => {
    try { await refresh(); } catch (e) { error = e instanceof Error ? e.message : 'Could not connect to the API'; }
    finally { loading = false; }
  });

  function openService(item?: Service) {
    editingService = item ?? null; formError = '';
    serviceForm = item ? { name: item.name, description: item.description, owner: item.owner, status: item.status, environment: item.environment } : { name: '', description: '', owner: '', status: 'operational', environment: 'production' };
    serviceModal = true;
  } //编辑或新增service
  function openIncident(item?: Incident) {
    editingIncident = item ?? null; formError = '';
    incidentForm = item ? { title: item.title, description: item.description, serviceId: item.serviceId, severity: item.severity, status: item.status } : { title: '', description: '', serviceId: allServices[0]?.id ?? '', severity: 'medium', status: 'investigating' };
    incidentModal = true;
  }
  async function saveService(event: SubmitEvent) {
    event.preventDefault(); saving = true; formError = '';
    try {
      if (editingService) await api.updateService(editingService.id, serviceForm); else await api.createService(serviceForm);
      serviceModal = false; await refresh(); notify(editingService ? 'Service updated' : 'Service created');
    } catch (e) { formError = e instanceof Error ? e.message : 'Unable to save'; } finally { saving = false; }
  }
  async function saveIncident(event: SubmitEvent) {
    event.preventDefault(); saving = true; formError = '';
    try {
      if (editingIncident) await api.updateIncident(editingIncident.id, incidentForm); else await api.createIncident(incidentForm);
      incidentModal = false; await refresh(); notify(editingIncident ? 'Incident updated' : 'Incident created');
    } catch (e) { formError = e instanceof Error ? e.message : 'Unable to save'; } finally { saving = false; }
  }
  async function removeService(item: Service) {
    if (!confirm(`Delete ${item.name}?`)) return;
    try { await api.deleteService(item.id); await refresh(); notify('Service deleted'); } catch (e) { notify(e instanceof Error ? e.message : 'Unable to delete'); }
  }
  async function removeIncident(item: Incident) {
    if (!confirm(`Delete ${item.title}?`)) return;
    try { await api.deleteIncident(item.id); await refresh(); notify('Incident deleted'); } catch (e) { notify(e instanceof Error ? e.message : 'Unable to delete'); }
  }
</script>

<div class="min-h-screen bg-canvas">
  <header class="border-b border-line bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-9">
      <button class="flex items-center gap-3 text-left" onclick={() => tab = 'overview'}>
        <span class="grid h-10 w-10 place-items-center rounded-xl bg-ink text-lime">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 17l5-5 4 4 7-8"/><path d="M16 8h4v4"/></svg>
        </span>
        <span><strong class="block font-display text-base leading-tight">Ops Atlas</strong><small class="text-xs text-ink/50">Service operations</small></span>
      </button>
      <nav class="hidden items-center gap-1 rounded-xl bg-canvas p-1 md:flex" aria-label="Primary navigation">
        {#each [['overview','Overview'],['services','Services'],['incidents','Incidents']] as item}
          <button class={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === item[0] ? 'bg-white shadow-sm' : 'text-ink/55 hover:text-ink'}`} onclick={() => tab = item[0] as Tab}>{item[1]}</button>
        {/each}
      </nav>
      <div class="flex items-center gap-3">
        <span class="hidden items-center gap-2 text-xs font-semibold text-ink/55 sm:flex"><i class="h-2 w-2 rounded-full bg-emerald-500"></i> API connected</span>
        <button class="btn-primary" onclick={() => openIncident()}>+ New incident</button>
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-[1440px] px-5 py-8 lg:px-9 lg:py-10">
    {#if loading}
      <div class="grid min-h-[60vh] place-items-center"><div class="text-center"><div class="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-line border-t-moss"></div><p class="text-sm text-ink/50">Loading operations data…</p></div></div>
    {:else if error}
      <div class="panel mx-auto max-w-lg p-8 text-center"><div class="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-2xl text-red-700">!</div><h1 class="font-display text-xl">API unavailable</h1><p class="mt-2 text-sm text-ink/60">{error}. Start both apps with <code class="rounded bg-canvas px-1.5 py-0.5">pnpm dev</code>.</p></div>
    {:else}
      <section class="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p class="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-moss">Operations center</p>
          <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">{tab === 'overview' ? 'System pulse' : tab === 'services' ? 'Service catalog' : 'Incident response'}</h1>
          <p class="mt-2 max-w-xl text-sm leading-6 text-ink/55">{tab === 'overview' ? 'A clear view of service health, active incidents, and the work that needs attention.' : tab === 'services' ? 'Track ownership and current operating status across customer-facing systems.' : 'Coordinate investigation, mitigation, and resolution from a single queue.'}</p>
        </div>
        <div class="flex gap-3">
          {#if tab === 'services'}<button class="btn-primary" onclick={() => openService()}>+ Add service</button>{/if}
          {#if tab === 'overview'}<button class="btn-secondary" onclick={() => { tab = 'services'; openService(); }}>Add service</button>{/if}
        </div>
      </section>

      {#if tab === 'overview'}
        <section class="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary metrics">
          {#each [
            {label:'Total services',value:summary.serviceCount,note:'in catalog',accent:'bg-ink text-white'},
            {label:'Operational',value:summary.operationalCount,note:`${summary.serviceCount ? Math.round(summary.operationalCount/summary.serviceCount*100) : 0}% healthy`,accent:'bg-emerald-50 text-emerald-700'},
            {label:'Active incidents',value:summary.activeIncidentCount,note:'require attention',accent:'bg-amber-50 text-amber-700'},
            {label:'Critical incidents',value:summary.criticalIncidentCount,note:summary.criticalIncidentCount ? 'escalate now' : 'all clear',accent:'bg-red-50 text-red-700'}
          ] as metric}
            <article class="panel p-5">
              <div class="mb-5 flex items-center justify-between"><span class="text-sm font-semibold text-ink/55">{metric.label}</span><span class={`grid h-9 w-9 place-items-center rounded-xl ${metric.accent}`}>↗</span></div>
              <strong class="font-display text-4xl">{metric.value}</strong><span class="ml-2 text-xs text-ink/45">{metric.note}</span>
            </article>
          {/each}
        </section>

        <section class="grid gap-6 xl:grid-cols-[1.05fr_1.6fr]">
          <article class="panel overflow-hidden">
            <header class="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 class="font-display font-bold">Service health</h2><p class="mt-0.5 text-xs text-ink/45">Current system status</p></div><button class="text-sm font-bold text-moss" onclick={() => tab = 'services'}>View all →</button></header>
            <div class="divide-y divide-line">
              {#each allServices.slice(0, 5) as service}
                <button class="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-canvas/70" onclick={() => openService(service)}>
                  <span><strong class="block text-sm">{service.name}</strong><small class="mt-1 block text-ink/45">{service.owner}</small></span><Badge value={service.status} />
                </button>
              {/each}
            </div>
          </article>
          <article class="panel overflow-hidden">
            <header class="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 class="font-display font-bold">Recent incidents</h2><p class="mt-0.5 text-xs text-ink/45">Latest response activity</p></div><button class="text-sm font-bold text-moss" onclick={() => tab = 'incidents'}>Open queue →</button></header>
            <div class="overflow-x-auto"><table class="w-full min-w-[640px] text-left"><thead class="bg-canvas/60 text-[11px] uppercase tracking-wider text-ink/45"><tr><th class="px-5 py-3">Incident</th><th class="px-4 py-3">Severity</th><th class="px-4 py-3">Status</th><th class="px-5 py-3">Updated</th></tr></thead><tbody class="divide-y divide-line">
              {#each incidents.items.slice(0,5) as incident}<tr class="cursor-pointer transition hover:bg-canvas/60" onclick={() => openIncident(incident)}><td class="px-5 py-4"><strong class="block text-sm">{incident.title}</strong><small class="mt-1 block text-ink/45">{serviceName(incident.serviceId)}</small></td><td class="px-4 py-4"><Badge value={incident.severity}/></td><td class="px-4 py-4"><Badge value={incident.status}/></td><td class="px-5 py-4 text-xs text-ink/50">{formatTime(incident.updatedAt)}</td></tr>{/each}
            </tbody></table></div>
          </article>
        </section>
      {:else if tab === 'services'}
        <section class="panel overflow-hidden">
          <div class="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
            <input class="field sm:max-w-sm" aria-label="Search services" placeholder="Search name, owner, description…" bind:value={serviceSearch} onkeydown={(e) => e.key === 'Enter' && loadServices(1)} />
            //在搜索框中输入内容时 svelte会自动更新serviceSearch = '...';
            <select class="field sm:w-52" aria-label="Filter service status" bind:value={serviceStatus} onchange={() => loadServices(1)}><option value="">All statuses</option>{#each serviceStatuses as status}<option value={status}>{status}</option>{/each}</select>
            <button class="btn-secondary" onclick={() => loadServices(1)}>Search</button> //点击搜索按钮后调用loadServices(1) 这里传入1表示每次执行新搜索时，都回到第一页。
          </div>
          <div class="overflow-x-auto"><table class="w-full min-w-[760px] text-left"><thead class="bg-canvas/60 text-[11px] uppercase tracking-wider text-ink/45"><tr><th class="px-5 py-3">Service</th><th class="px-4 py-3">Owner</th><th class="px-4 py-3">Environment</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Updated</th><th class="px-5 py-3 text-right">Actions</th></tr></thead><tbody class="divide-y divide-line">
            {#each services.items as service}<tr class="hover:bg-canvas/40"><td class="px-5 py-4"><strong class="block text-sm">{service.name}</strong><small class="mt-1 block max-w-sm truncate text-ink/45">{service.description}</small></td><td class="px-4 py-4 text-sm">{service.owner}</td><td class="px-4 py-4"><Badge value={service.environment}/></td><td class="px-4 py-4"><Badge value={service.status}/></td><td class="px-4 py-4 text-xs text-ink/50">{formatTime(service.updatedAt)}</td><td class="px-5 py-4 text-right"><button class="mr-3 text-sm font-bold text-moss" onclick={() => openService(service)}>Edit</button><button class="text-sm font-bold text-clay" onclick={() => removeService(service)}>Delete</button></td></tr>{:else}<tr><td colspan="6" class="px-5 py-12 text-center text-sm text-ink/45">No services match these filters.</td></tr>{/each}
          </tbody></table></div>
          <Pagination page={services.page} totalPages={services.totalPages} onchange={loadServices}/>
        </section>
      {:else}
        <section class="panel overflow-hidden">
          <div class="flex flex-col gap-3 border-b border-line p-4 lg:flex-row">
            <input class="field lg:max-w-sm" aria-label="Search incidents" placeholder="Search incidents…" bind:value={incidentSearch} onkeydown={(e) => e.key === 'Enter' && loadIncidents(1)} />
            <select class="field lg:w-48" aria-label="Filter severity" bind:value={incidentSeverity} onchange={() => loadIncidents(1)}><option value="">All severities</option>{#each incidentSeverities as severity}<option value={severity}>{severity}</option>{/each}</select>
            <select class="field lg:w-48" aria-label="Filter incident status" bind:value={incidentStatus} onchange={() => loadIncidents(1)}><option value="">All statuses</option>{#each incidentStatuses as status}<option value={status}>{status}</option>{/each}</select>
            <button class="btn-secondary" onclick={() => loadIncidents(1)}>Search</button>
          </div>
          <div class="overflow-x-auto"><table class="w-full min-w-[880px] text-left"><thead class="bg-canvas/60 text-[11px] uppercase tracking-wider text-ink/45"><tr><th class="px-5 py-3">Incident</th><th class="px-4 py-3">Service</th><th class="px-4 py-3">Severity</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Updated</th><th class="px-5 py-3 text-right">Actions</th></tr></thead><tbody class="divide-y divide-line">
            {#each incidents.items as incident}<tr class="hover:bg-canvas/40"><td class="px-5 py-4"><strong class="block text-sm">{incident.title}</strong><small class="mt-1 block max-w-sm truncate text-ink/45">{incident.description}</small></td><td class="px-4 py-4 text-sm">{serviceName(incident.serviceId)}</td><td class="px-4 py-4"><Badge value={incident.severity}/></td><td class="px-4 py-4"><Badge value={incident.status}/></td><td class="px-4 py-4 text-xs text-ink/50">{formatTime(incident.updatedAt)}</td><td class="px-5 py-4 text-right"><button class="mr-3 text-sm font-bold text-moss" onclick={() => openIncident(incident)}>Edit</button><button class="text-sm font-bold text-clay" onclick={() => removeIncident(incident)}>Delete</button></td></tr>{:else}<tr><td colspan="6" class="px-5 py-12 text-center text-sm text-ink/45">No incidents match these filters.</td></tr>{/each}
          </tbody></table></div>
          <Pagination page={incidents.page} totalPages={incidents.totalPages} onchange={loadIncidents}/>
        </section>
      {/if}
    {/if}
  </main>

  <nav class="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-xl md:hidden">
    {#each [['overview','Overview'],['services','Services'],['incidents','Incidents']] as item}<button class={`rounded-xl px-3 py-2 text-xs font-bold ${tab===item[0]?'bg-ink text-white':'text-ink/50'}`} onclick={() => tab=item[0] as Tab}>{item[1]}</button>{/each}
  </nav>

  {#if toast}<div class="fixed bottom-20 right-5 z-[60] rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-xl md:bottom-6" role="status">{toast}</div>{/if}
</div>

{#if serviceModal}
  <Modal title={editingService ? 'Edit service' : 'Add service'} onclose={() => serviceModal = false}>
    <form onsubmit={saveService} class="space-y-4">
      <div><label class="label" for="service-name">Service name</label><input id="service-name" class="field" required minlength="2" maxlength="80" bind:value={serviceForm.name} placeholder="e.g. Search API" /></div>
      <div><label class="label" for="service-description">Description</label><textarea id="service-description" class="field min-h-24 resize-y" maxlength="240" bind:value={serviceForm.description} placeholder="What does this service support?"></textarea></div>
      <div class="grid gap-4 sm:grid-cols-3">
  <div>
    <label class="label" for="service-owner">
      Owner
    </label>

    <input
      id="service-owner"
      class="field"
      required
      minlength="2"
      maxlength="80"
      bind:value={serviceForm.owner}
      placeholder="Team name"
    />
  </div>

  <div>
    <label class="label" for="service-status">
      Status
    </label>

    <select
      id="service-status"
      class="field capitalize"
      bind:value={serviceForm.status}
    >
      {#each serviceStatuses as status}
        <option value={status}>{status}</option>
      {/each}
    </select>
  </div>

  <div>
    <label class="label" for="service-environment">
      Environment
    </label>

    <select
      id="service-environment"
      class="field capitalize"
      bind:value={serviceForm.environment} //关键
    >
      {#each serviceEnvironments as environment}
        <option value={environment}>
          {environment}
        </option>
      {/each}
    </select>
  </div>
</div>
      {#if formError}<p class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>{/if}
      <div class="flex justify-end gap-3 pt-2"><button type="button" class="btn-secondary" onclick={() => serviceModal=false}>Cancel</button><button class="btn-primary" disabled={saving}>{saving?'Saving…':editingService?'Save changes':'Create service'}</button></div>
    </form>
  </Modal>
{/if}

{#if incidentModal}
  <Modal title={editingIncident ? 'Update incident' : 'Declare incident'} onclose={() => incidentModal = false}>
    <form onsubmit={saveIncident} class="space-y-4">
      <div><label class="label" for="incident-title">Incident title</label><input id="incident-title" class="field" required minlength="3" maxlength="120" bind:value={incidentForm.title} placeholder="Short, specific summary" /></div>
      <div><label class="label" for="incident-description">What is happening?</label><textarea id="incident-description" class="field min-h-24 resize-y" maxlength="500" bind:value={incidentForm.description} placeholder="Customer impact, observations, and next step"></textarea></div>
      <div><label class="label" for="incident-service">Affected service</label><select id="incident-service" class="field" required bind:value={incidentForm.serviceId}><option value="" disabled>Select a service</option>{#each allServices as service}<option value={service.id}>{service.name}</option>{/each}</select></div>
      <div class="grid gap-4 sm:grid-cols-2"><div><label class="label" for="incident-severity">Severity</label><select id="incident-severity" class="field capitalize" bind:value={incidentForm.severity}>{#each incidentSeverities as severity}<option value={severity}>{severity}</option>{/each}</select></div><div><label class="label" for="incident-status">Status</label><select id="incident-status" class="field capitalize" bind:value={incidentForm.status}>{#each incidentStatuses as status}<option value={status}>{status}</option>{/each}</select></div></div>
      {#if formError}<p class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>{/if}
      <div class="flex justify-end gap-3 pt-2"><button type="button" class="btn-secondary" onclick={() => incidentModal=false}>Cancel</button><button class="btn-primary" disabled={saving}>{saving?'Saving…':editingIncident?'Save changes':'Declare incident'}</button></div>
    </form>
  </Modal>
{/if}
