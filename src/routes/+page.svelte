<script lang="ts">
	import x from '$lib/assets/x.svg';
	import PathTableRow from '$lib/components/PathTableRow.svelte';
	import {
		getPath,
		initialPathTables,
		initialTrajectoryConfig,
		pathToString
	} from '$lib/scripts/Trajectory';
	import PathCanvas from '$lib/components/PathCanvas.svelte';
	import { onMount } from 'svelte';

	let pathTables = initialPathTables;

	let selectedPath = 0;

	let modalCode = '';
	let modalOpen = false;

	function updatePathTablesAfter(func: () => any, pathTableIndex: number) {
		return async () => {
			const retVal = func();
			pathTables = pathTables;

			const startVelocity = (
				document.querySelector('input[name="start-velocity"]') as HTMLInputElement
			).valueAsNumber;
			const endVelocity = (document.querySelector('input[name="end-velocity"]') as HTMLInputElement)
				.valueAsNumber;
			const maxVelocity = (document.querySelector('input[name="max-velocity"]') as HTMLInputElement)
				.valueAsNumber;
			const maxAcceleration = (
				document.querySelector('input[name="max-acceleration"]') as HTMLInputElement
			).valueAsNumber;
			const reversed = (document.querySelector('input[name="reversed"]') as HTMLInputElement)
				.checked;

			pathTables[pathTableIndex].path = await getPath(
				pathTables[pathTableIndex].waypoints,
				startVelocity,
				endVelocity,
				maxVelocity,
				maxAcceleration,
				reversed
			);
			pathTables = pathTables;

			return retVal;
		};
	}

	onMount(() => {
		getPath(
			pathTables[0].waypoints,
			initialTrajectoryConfig.startVelocity,
			initialTrajectoryConfig.endVelocity,
			initialTrajectoryConfig.maxVelocity,
			initialTrajectoryConfig.maxAcceleration,
			initialTrajectoryConfig.reversed
		).then((startPath) => {
			console.log(startPath);
			pathTables.forEach((pathTable, idx) => {
				console.log(`setting start path ${idx}`);
				pathTable.path = startPath;
			});
			pathTables = pathTables;
		});
	});
</script>

<div class="bg-violet-900 text-white flex items-center justify-between">
	<h1 class="m-4 text-3xl">Clairvoyance</h1>
	<span class="text-violet-300 m-4">Samuel Jones</span>
</div>

<div class="flex">
	<div class="w-[20rem] bg-zinc-800 h-screen p-4">
		<form action="" class="flex flex-col items-center">
			<div class="flex items-center justify-end w-48 h-12">
				<input
					class="w-12 h-4 text-black"
					type="text"
					name="path-name"
					id="path-name"
					value={pathTables[selectedPath].title}
					on:change={(ev) => {
						pathTables[selectedPath].title = ev.currentTarget.value;
						pathTables = pathTables;
					}}
				/>
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="reversed">Reversed</label>
				<input
					class="w-12 h-4 text-black"
					type="checkbox"
					name="reversed"
					id="reversed"
					value={initialTrajectoryConfig.reversed}
				/>
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="clamped-cubic">Clamped Cubic</label>
				<input
					class="w-12 h-4 text-black"
					type="checkbox"
					name="clamped-cubic"
					id="clamped-cubic"
				/>
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="max-acceleration">Max Acceleration</label>
				<input
					class="ml-4 w-12 text-black"
					type="number"
					name="max-acceleration"
					id="max-acceleration"
					value={initialTrajectoryConfig.maxAcceleration}
				/>
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="max-velocity">Max Velocity</label>
				<input
					class="ml-4 w-12 text-black"
					type="number"
					name="max-velocity"
					id="max-velocity"
					value={initialTrajectoryConfig.maxVelocity}
				/>
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="max-centripetal-acceleration"
					>Max Centripetal Acceleration</label
				>
				<input
					class="ml-4 w-12 text-black"
					type="number"
					name="max-centripetal-acceleration"
					id="max-centripetal-acceleration"
				/>
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="start-velocity">Start Velocity</label>
				<input
					class="ml-4 w-12 text-black"
					type="number"
					name="start-velocity"
					id="start-velocity"
					value={initialTrajectoryConfig.startVelocity}
				/>
			</div>

			<div class="flex items-center justify-end w-48 h-12">
				<label class="text-right" for="end-velocity">End Velocity</label>
				<input
					class="ml-4 w-12 text-black"
					type="number"
					name="end-velocity"
					id="end-velocity"
					value={initialTrajectoryConfig.endVelocity}
				/>
			</div>

			<div class="paths mt-8 bg-white">
				<ul class="flex items-stretch">
					{#each pathTables as pathTable, tableIndex}
						{#if tableIndex == selectedPath}
							<li class="bg-violet-800 flex-1 text-center"><button>{tableIndex + 1}</button></li>
						{:else}
							<li class="bg-violet-500 hover:bg-violet-600 flex-1 text-center">
								<button
									class="w-full"
									on:click={() => {
										selectedPath = tableIndex;
									}}>{tableIndex + 1}</button
								>
							</li>
						{/if}
					{/each}
				</ul>
				{#each pathTables as pathTable, tableIndex}
					<table class={'text-black w-64 ' + (tableIndex === selectedPath ? '' : 'hidden')}>
						<colgroup>
							<col />
							<col />
							<col />
						</colgroup>
						<thead>
							<tr>
								<th class="bg-violet-300"
									><button
										on:click={updatePathTablesAfter(
											() => pathTables[tableIndex].waypoints.push({ x: 0, y: 0, th: 0, psi: 0 }),
											tableIndex
										)}>+</button
									></th
								>
								<th>X(m)</th>
								<th class="bg-violet-300">Y(m)</th>
								<th>θ(°)</th>
								<th class="bg-violet-300">ψ(°)</th>
							</tr>
						</thead>
						<tbody>
							{#each pathTable.waypoints as row, rowIndex}
								<PathTableRow
									{row}
									onClickAddRow={updatePathTablesAfter(
										() => pathTable.waypoints.splice(rowIndex, 0, { x: 0, y: 0, th: 0, psi: 0 }),
										tableIndex
									)}
									onClickRemoveRow={updatePathTablesAfter(
										() => pathTable.waypoints.splice(rowIndex, 1),
										tableIndex
									)}
									updateTableRender={() => (pathTable = pathTable)}
								/>
							{/each}
						</tbody>
					</table>
				{/each}
			</div>
			<button
				class="w-48 bg-violet-800 p-2 rounded-lg mx-4 mt-4"
				type="button"
				on:click={() => {
					modalCode = pathToString(
						pathTables[selectedPath].waypoints,
						pathTables[selectedPath].title
					);
					modalOpen = true;
				}}>Export Selected Path</button
			>
			<button
				type="button"
				class="w-48 bg-violet-800 p-2 rounded-lg mx-4 mt-4"
				on:click={() => {
					let newModalCode = '';
					for (const path of pathTables) {
						newModalCode += pathToString(path.waypoints, path.title) + '\n';
					}
					modalCode = newModalCode;
					modalOpen = true;
				}}>Export All Paths</button
			>
		</form>
	</div>

	<div class="overflow-y-auto m-8">
		<PathCanvas
			waypoints={pathTables[selectedPath].waypoints}
			path={pathTables[selectedPath].path ?? {
				states: [],
				totalTimeSeconds: 0,
				initialPose: { translation: { x: 0, y: 0 }, rotation: { radians: 0 } }
			}}
			triggerWaypointUpdate={updatePathTablesAfter(() => {}, selectedPath)}
		/>
	</div>
</div>

<div
	class={'absolute top-0 left-0 w-screen h-screen bg-opacity-75 bg-black z-50 ' +
		(modalOpen ? '' : 'hidden')}
>
	<div class="relative w-[50rem] h-[40rem] mx-auto mt-24 bg-violet-800 rounded-xl">
		<div class="mx-auto max-w-max">
			<h2 class="max-w-max pt-8 pb-4 text-white text-bold text-xl">Exported Path Code</h2>
			<div
				class="bg-white w-[46rem] h-[32rem] text-black whitespace-pre-wrap rounded-lg px-8 py-4 overflow-scroll"
			>
				<p>
					{modalCode}
				</p>
			</div>
		</div>
		<button class="w-4 h-4 absolute top-4 right-4" on:click={() => (modalOpen = false)}
			><img src={x} alt="" srcset="" /></button
		>
	</div>
</div>
