<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import type { Auto } from '$lib/scripts/Trajectory';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import type { ChangeEventHandler } from 'svelte/elements';

	export let show: boolean;
	export let onImport: (auto: Auto) => void;

	let previewImport = false;
	let auto: Auto | null = null;
	let importError: Error | null = null;
	let numWaypoints = 0;

	const importFileChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		if (!e.currentTarget?.files?.length) return;
		const file = e.currentTarget.files[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			const contents = e.target?.result as string;
			if (!contents) return;
			try {
				const newAuto = JSON.parse(contents) as Auto;
				if (!newAuto.config) throw new Error('Auto has no config');
				if (typeof newAuto.config !== 'object') throw new Error('Auto config is not an object');
				if (newAuto.config.maxAcceleration == null)
					throw new Error('Auto config has no maxAcceleration');
				if (typeof newAuto.config.maxAcceleration !== 'number')
					throw new Error('Auto config maxAcceleration is not a number');
				if (newAuto.config.maxVelocity == null) throw new Error('Auto config has no maxVelocity');
				if (typeof newAuto.config.maxVelocity !== 'number')
					throw new Error('Auto config maxVelocity is not a number');
				if (newAuto.config.reversed == null) throw new Error('Auto config has no reversed');
				if (typeof newAuto.config.reversed !== 'boolean')
					throw new Error('Auto config reversed is not a boolean');

				if (!newAuto.paths) throw new Error('Auto has no paths');
				if (!Array.isArray(newAuto.paths)) throw new Error('Auto paths is not an array');
				if (!newAuto.paths.length) throw new Error('Auto paths is empty');

				for (let i = 0; i < newAuto.paths.length; i++) {
					const path = newAuto.paths[i];
					if (!Array.isArray(path.waypoints))
						throw new Error(`Auto path at index ${i} has waypoints that are not an array`);
					if (!path.waypoints) throw new Error(`Auto path at index ${i} has no waypoints`);

					for (let j = 0; j < path.waypoints.length; j++) {
						const waypoint = path.waypoints[j];
						if (typeof waypoint !== 'object')
							throw new Error(
								`Auto path at index ${i} has waypoint at index ${j} that is not an object`
							);
						if (typeof waypoint.x !== 'number')
							throw new Error(
								`Auto path at index ${i} has waypoint at index ${j} with non-numeric x`
							);
						if (typeof waypoint.y !== 'number')
							throw new Error(
								`Auto path at index ${i} has waypoint at index ${j} with non-numeric y`
							);

						// TODO figure out how to better handle this when add support for translational waypoints
						if (typeof waypoint.th !== 'number') waypoint.th = 0;
						if (typeof waypoint.psi !== 'number') waypoint.psi = 0;
						waypoint.hidden = !!waypoint.hidden;

						numWaypoints++;
					}

					// non-critical/fixable errors
					if (!path.config) path.config = {};
					path.hidden = !!path.hidden;

					// we don't care about path malformation since we should refetch it anyways after importing
				}
				auto = newAuto;
				previewImport = true;
				importError = null;
			} catch (e) {
				console.error(e);
				alert((e as Error)?.message);
				importError = e as Error;
			}
		};

		reader.readAsText(file);
	};

	const importFile = () => {
		if (!auto) return;
		onImport(auto);
		show = false;
	};
</script>

{#if show}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="relative bg-zinc-800 p-4 rounded-lg">
			<button class="text-white absolute right-4 top-4" on:click={() => (show = false)}
				><FontAwesomeIcon class="text-zinc-600 hover:text-lighttext" icon="fa-solid fa-x" /></button
			>
			<h2 class="text-lg text-lighttext mb-4">Import Auto</h2>
			<div class="flex flex-col">
				<div class="flex flex-col">
					<label class="text-lighttext m-1" for="auto">Select File</label>
					<input
						class="bg-zinc-700 text-lighttext rounded-lg p-2"
						type="file"
						name="auto"
						accept=".json"
						on:change={importFileChange}
					/>
				</div>
				{#if importError}
					<div class="text-red-500">{importError.message}</div>
				{:else if previewImport}
					<p class="text-lighttext m-4">
						Import auto "{auto?.title}" with {numWaypoints} waypoints?
					</p>
					<div class="flex justify-center gap-4">
						<Button intent="danger" onClick={() => (show = false)}>Cancel</Button>
						{#if auto}
							<Button intent="success" onClick={importFile}>Confirm</Button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
