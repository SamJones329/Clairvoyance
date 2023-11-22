<script lang="ts">
	import { getDefaultAuto, type Auto, getPath } from '$lib/scripts/Trajectory';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	let autos: Auto[] = [getDefaultAuto()];
	let selectedAuto = 0;
	let open = false;
	let autoStore = getContext<Writable<Auto>>('auto');

	$: autoStore.set(autos[selectedAuto]);
	autoStore.subscribe((newAuto) => {
		autos[selectedAuto] = newAuto;
		autos = autos;
	});
</script>

{#if open}
	<div
		class="w-48 lg:w-64 flex-shrink-0 flex-grow-0 bg-zinc-800 h-screen-minus-title p-4 overflow-y-scroll"
	>
		<h2 class="text-lg font-bold">Autos</h2>
	</div>
{/if}
<div class="w-4 flex-shrink-0 bg-zinc-900 h-screen-minus-title">
	<button type="button" class={`absolute top-2 w-4 h-4`} on:click={() => (open = !open)}>
		{#if open}
			<FontAwesomeIcon icon="fa-solid fa-angles-left" />
		{:else}
			<FontAwesomeIcon icon="fa-solid fa-angles-right" />
		{/if}
	</button>
</div>
