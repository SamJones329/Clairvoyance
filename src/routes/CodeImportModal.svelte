<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { stringToPaths, type TrajectoryContainer } from '$lib/scripts/Trajectory';
	import x from '$lib/assets/x.svg';

	export let open = false;
	export let onImport: (paths: TrajectoryContainer[]) => void;
	let importPathTextarea: HTMLTextAreaElement;
	let importResultOpen = false;
	let importResults: TrajectoryContainer[] = [];
</script>

{#if open}
	<div class="absolute top-0 left-0 w-screen h-screen bg-opacity-75 bg-black z-40">
		<div class="relative w-[50rem] h-[40rem] mx-auto mt-24 bg-violet-800 rounded-xl">
			<div class="mx-auto max-w-max">
				<div class="flex text-white">
					<h2 class="max-w-max pt-8 pb-4 text-bold text-xl">Import Path Code</h2>
					<span class="text-neutral-400 pl-2 pt-[2.25rem]">Units: meters, radians</span>
				</div>
				<div
					class="bg-white w-[46rem] h-[30rem] text-black whitespace-pre-wrap rounded-lg px-8 py-4 overflow-scroll"
				>
					<textarea
						placeholder="Enter code here..."
						class="w-full h-full p-1"
						name="import"
						id="import"
						cols="30"
						rows="10"
						bind:this={importPathTextarea}
					/>
				</div>
				<div class="font-bold mx-auto max-w-max mt-1">
					<Button
						onClick={() => {
							importResults = stringToPaths(importPathTextarea.value);
							importResultOpen = true;
						}}
						invert={true}>Import</Button
					>
				</div>
			</div>
			<button type="button" class="w-4 h-4 absolute top-4 right-4" on:click={() => (open = false)}
				><img src={x} alt="" srcset="" /></button
			>
		</div>
	</div>
{/if}

{#if importResultOpen}
	<div class="absolute top-0 left-0 w-screen h-screen bg-opacity-75 bg-black z-40">
		<div class="relative w-64 h-48 mx-auto mt-24 bg-zinc-600 rounded-xl">
			<div class="mx-auto max-w-max p-4 flex flex-col h-full justify-between">
				<div>
					<h3 class="text-lg font-bold">
						{importResults.length ? 'Import Successful' : 'Import Failed'}
					</h3>
					<p>
						{`Found ${importResults.length} paths${
							importResults.length ? `: ${importResults.map((path) => path.title)}` : ''
						}`}
					</p>
				</div>
				<div class="flex">
					<Button
						width="w-20"
						widthLg="w-20"
						height="h-12"
						onClick={() => {
							importResultOpen = false;
							open = false;
							importPathTextarea.value = '';
							if (importResults.length) onImport(importResults);
							importResults = [];
						}}>{importResults.length ? 'Confirm' : 'Exit'}</Button
					>
					<Button
						width="w-20"
						widthLg="w-20"
						height="h-12"
						invert={true}
						onClick={() => {
							importResultOpen = false;
						}}>Cancel</Button
					>
				</div>
			</div>
		</div>
	</div>
{/if}
