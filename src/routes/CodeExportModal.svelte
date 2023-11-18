<script lang="ts">
	import { pathToString, type TrajectoryContainer } from '$lib/scripts/Trajectory';
	import { copyText } from '$lib/scripts/copyToClipboard';
	import x from '$lib/assets/x.svg';

	export let open: boolean;
	export let paths: TrajectoryContainer[];
	let exportModalCode: string;
	$: exportModalCode = open ? paths.map((path) => pathToString(path)).join('\n\n') : '';
</script>

{#if open}
	<div class="absolute top-0 left-0 w-screen h-screen bg-opacity-75 bg-black z-40">
		<div class="relative w-[50rem] h-[40rem] mx-auto mt-24 bg-violet-800 rounded-xl">
			<div class="mx-auto max-w-max">
				<div class="flex text-white">
					<h2 class="max-w-max pt-8 pb-4 text-bold text-xl">Exported Path Code</h2>
					<button type="button" on:click={() => copyText(exportModalCode)} class="mt-8 mb-4 mx-4"
						><div><i class="fa-regular fa-copy" /></div></button
					>
				</div>
				<div
					class="bg-white w-[46rem] h-[32rem] text-black whitespace-pre-wrap rounded-lg px-8 py-4 overflow-scroll"
				>
					<p>
						{exportModalCode}
					</p>
				</div>
			</div>
			<button type="button" class="w-4 h-4 absolute top-4 right-4" on:click={() => (open = false)}
				><img src={x} alt="" srcset="" /></button
			>
		</div>
	</div>
{/if}
