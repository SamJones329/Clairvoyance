<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	import Input from '$lib/components/Input.svelte';
	import { invoke } from '@tauri-apps/api/tauri';
	import Button from '$lib/components/Button.svelte';
	import PathTableRow from '$lib/components/PathTableRow.svelte';
	import PathTableBreakRow from '$lib/components/PathTableBreakRow.svelte';
	import {
		fetchPath,
		getDefaultPath,
		waypointsToPoses,
		getDoNothingTrajectory,
		type SwerveTrajectoryWaypoint,
		type TrajectoryResponse,
		type TrajectoryConfig
	} from '$lib/scripts/Trajectory';
	import PathCanvas from '$lib/components/PathCanvas.svelte';
	import { onMount } from 'svelte';
	import { parseAndRound } from '$lib/scripts/math';
	import CodeImportModal from './CodeImportModal.svelte';
	import CodeExportModal from './CodeExportModal.svelte';

	let getPath: (
		waypoints: SwerveTrajectoryWaypoint[],
		config: TrajectoryConfig
	) => Promise<TrajectoryResponse> = fetchPath;

	let ON_TAURI = false;
	let pathTables = [getDefaultPath()];

	let showControls = true;
	let selectedPath = 0;

	let exportModalOpen = false;
	let importModalOpen = false;
	let exportAllPaths = false;

	function updatePaths(pathTableIndex: number) {
		for (let i = 0; i < pathTables[pathTableIndex].waypoints.length; i++)
			updatePath(pathTableIndex, i);
	}

	async function updatePath(pathTableIndex: number, pathsIndex: number) {
		pathTables[pathTableIndex].paths[pathsIndex] = await getPath(
			pathTables[pathTableIndex].waypoints[pathsIndex],
			pathTables[pathTableIndex].config
		);
		pathTables = pathTables;
	}

	function updatePathTablesAfter(func: () => any, pathTableIndex: number, pathsIndex: number) {
		return () => {
			const retVal = func();
			pathTables = pathTables;

			updatePath(pathTableIndex, pathsIndex);

			return retVal;
		};
	}

	onMount(async () => {
		ON_TAURI =
			(await invoke('test_for_tauri')
				.then((val) => (typeof val === 'boolean' ? val : false))
				.catch((err) => {
					return false;
				})) ?? false;
		console.info(
			ON_TAURI
				? 'Was able to invoke tauri function, will use Rust trajectory generation'
				: 'Was not able to invoke tauri function, will use TrajectoryAPI'
		);
		if (ON_TAURI) {
			getPath = (waypoints, config) =>
				invoke<TrajectoryResponse>('generate_trajectory_tauri', {
					waypoints: waypointsToPoses(waypoints),
					config: {
						max_acceleration: config.maxAcceleration,
						max_velocity: config.maxVelocity,
						start_velocity: config.startVelocity,
						end_velocity: config.endVelocity,
						reversed: config.reversed
					}
				});
		}
		const val = getPath(pathTables[0].waypoints[0], pathTables[0].config);

		if (val instanceof Promise) {
			val.then((startPath) => {
				pathTables[0].paths = [startPath];
				pathTables = pathTables;
			});
		} else {
			pathTables.forEach((pathTable, idx) => {
				pathTable.paths = [val];
			});
			pathTables = pathTables;
		}
	});
</script>

<div class="bg-violet-900 text-white flex items-center justify-between h-10 lg:h-20">
	<h1 class="m-4 text-xl lg:text-3xl">Clairvoyance</h1>
	<span class="text-violet-300 m-4">Samuel Jones</span>
</div>

<div class="relative flex">
	{#if showControls}
		<div
			class="w-48 lg:w-64 flex-shrink-0 flex-grow-0 bg-zinc-800 h-screen-minus-title p-4 overflow-y-scroll"
		>
			<form action="" class="flex flex-col items-center">
				<h2 class="text-xl font-bold">Config</h2>

				<Input
					name="Reversed"
					type="checkbox"
					value={pathTables[selectedPath].config.reversed}
					onChange={(ev) => {
						pathTables[selectedPath].config.reversed = ev.currentTarget.checked;
						updatePaths(selectedPath);
					}}
				/>

				<Input
					name="Max Acceleration"
					type="text"
					value={pathTables[selectedPath].config.maxAcceleration}
					onChange={(ev) => {
						pathTables[selectedPath].config.maxAcceleration = parseAndRound(ev.currentTarget.value);
					}}
				/>

				<Input
					name="Max Velocity"
					type="number"
					value={pathTables[selectedPath].config.maxVelocity}
					onChange={(ev) => {
						pathTables[selectedPath].config.maxVelocity = parseAndRound(ev.currentTarget.value);
					}}
				/>

				<Input
					name="Start Velocity"
					type="number"
					value={pathTables[selectedPath].config.startVelocity}
					onChange={(ev) => {
						pathTables[selectedPath].config.startVelocity = parseAndRound(ev.currentTarget.value);
					}}
				/>

				<Input
					name="End Velocity"
					type="number"
					value={pathTables[selectedPath].config.endVelocity}
					onChange={(ev) => {
						pathTables[selectedPath].config.endVelocity = parseAndRound(ev.currentTarget.value);
					}}
				/>

				<div class="flex items-center justify-end w-48 h-8 mt-4">
					<input
						class="w-full h-8 text-black bg-transparent text-white text-xl text-center focus:outline-none border-b-2 focus:rounded-lg focus:border-2 border-violet-300"
						type="text"
						name="path-name"
						aria-label="path name"
						id="path-name"
						value={pathTables[selectedPath].title}
						on:change={(ev) => {
							pathTables[selectedPath].title = ev.currentTarget.value;
							pathTables = pathTables;
						}}
					/>
				</div>
				<div class="overflow-x-scroll w-48 lg:w-64 mt-4 no-scrollbar">
					<ul class="flex items-stretch">
						{#each pathTables as pathTable, tableIndex}
							{#if tableIndex == selectedPath}
								<li class="bg-violet-800 flex-1 text-center min-w-min px-4">
									<button type="button">{tableIndex + 1}</button>
								</li>
							{:else}
								<li class="bg-violet-500 hover:bg-violet-600 flex-1 text-center min-w-min px-4">
									<button
										type="button"
										class="w-full"
										on:click={() => {
											selectedPath = tableIndex;
										}}>{tableIndex + 1}</button
									>
								</li>
							{/if}
						{/each}
						<li class="bg-violet-500 hover:bg-violet-600 flex-1 text-center min-w-min px-4">
							<button
								type="button"
								class="w-full"
								on:click={() => {
									pathTables.push(getDefaultPath());
									updatePaths(pathTables.length - 1);
								}}
							>
								+
							</button>
						</li>
					</ul>
				</div>
				<div class="paths bg-white">
					{#each pathTables as pathTable, tableIndex}
						<table class={`text-black w-48 lg:w-64 ${tableIndex === selectedPath ? '' : 'hidden'}`}>
							<colgroup>
								<col />
								<col />
								<col />
							</colgroup>
							<thead>
								<tr>
									<th class="bg-violet-300" />
									<th>X(m)</th>
									<th class="bg-violet-300">Y(m)</th>
									<th>θ(°)</th>
									<th class="bg-violet-300">ψ(°)</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{#each pathTable.waypoints as waypoints, waypointsIndex}
									{#each waypoints as row, rowIndex}
										<PathTableRow
											{row}
											toggleShowPath={rowIndex === 0
												? () => {
														pathTable.drawMask[waypointsIndex] =
															!pathTable.drawMask[waypointsIndex];
														pathTables = pathTables;
												  }
												: null}
											showPathValue={pathTable.drawMask[waypointsIndex]}
											onClickAddRow={updatePathTablesAfter(
												() =>
													pathTable.waypoints[waypointsIndex].splice(rowIndex, 0, {
														x: 0,
														y: 0,
														th: 0,
														psi: 0
													}),
												tableIndex,
												waypointsIndex
											)}
											onClickRemoveRow={updatePathTablesAfter(
												() => pathTable.waypoints[waypointsIndex].splice(rowIndex, 1),
												tableIndex,
												waypointsIndex
											)}
											updateTableRender={() => updatePath(tableIndex, waypointsIndex)}
										/>
									{/each}
									{#if waypointsIndex !== pathTable.waypoints.length - 1}
										<PathTableBreakRow
											onClickRemoveRow={() => {
												const [pointsToMerge] = pathTable.waypoints.splice(waypointsIndex + 1, 1);
												pathTable.waypoints[waypointsIndex] = waypoints.concat(pointsToMerge);
												pathTable.paths.pop();
												updatePaths(tableIndex);
											}}
											onClickAddRow={updatePathTablesAfter(
												() =>
													pathTable.waypoints[waypointsIndex].push({
														x: 0,
														y: 0,
														th: 0,
														psi: 0
													}),
												tableIndex,
												waypointsIndex
											)}
										/>
									{/if}
								{/each}
								<tr class="relative top-0 left-0">
									<td class="bg-violet-500 hover:bg-violet-600 text-white pb-1" colspan="6">
										<button
											class="w-full h-full"
											type="button"
											on:click={() => {
												const newSubPath = getDefaultPath();
												pathTable.waypoints.push(newSubPath.waypoints[0]);
												pathTable.paths.push(newSubPath.paths[0]);
												pathTable.drawMask.push(newSubPath.drawMask[0]);
												pathTables = pathTables;
											}}>Add Breakpoint</button
										>
									</td>
									<div class="relative top-0 left-0">
										<button
											type="button"
											class="-top-1 right-0 absolute w-48 lg:w-64 h-2 hover:bg-opacity-50 hover:bg-green-500"
											on:click={updatePathTablesAfter(
												() =>
													pathTables[tableIndex].waypoints[
														pathTables[tableIndex].waypoints.length - 1
													].push({ x: 0, y: 0, th: 0, psi: 0 }),
												tableIndex,
												pathTables[tableIndex].waypoints.length - 1
											)}
										/>
									</div>
								</tr>
							</tbody>
						</table>
					{/each}
				</div>
				{#if pathTables.length > 1}
					<Button
						onClick={() => {
							pathTables.splice(selectedPath, 1);
							selectedPath = Math.max(0, selectedPath - 1);
							pathTables = pathTables;
						}}>Delete Path</Button
					>
				{/if}
				<Button
					fixedWidth
					onClick={() => {
						exportAllPaths = false;
						exportModalOpen = true;
					}}>Export Path</Button
				>
				<Button
					fixedWidth
					onClick={() => {
						exportAllPaths = true;
						exportModalOpen = true;
					}}>Export All Paths</Button
				>

				<Button fixedWidth onClick={() => (importModalOpen = true)}>Import</Button>
			</form>
		</div>
	{/if}
	<div class="w-4 flex-shrink-0 bg-zinc-900 h-screen-minus-title">
		<button
			type="button"
			class={`absolute top-2 w-4 h-4`}
			on:click={() => (showControls = !showControls)}
		>
			{#if showControls}
				<FontAwesomeIcon icon="fa-solid fa-angles-left" />
			{:else}
				<FontAwesomeIcon icon="fa-solid fa-angles-right" />
			{/if}
		</button>
	</div>

	<div class="overflow-scroll max-h-screen-minus-title p-8">
		<PathCanvas
			waypoints={pathTables[selectedPath].waypoints}
			paths={pathTables[selectedPath].paths ?? [getDoNothingTrajectory()]}
			drawMask={pathTables[selectedPath].drawMask}
			triggerWaypointUpdate={(pathsIndex) => updatePath(selectedPath, pathsIndex)}
		/>
	</div>
</div>

<CodeExportModal
	open={exportModalOpen}
	paths={exportAllPaths ? pathTables : [pathTables[selectedPath]]}
/>

<CodeImportModal
	open={importModalOpen}
	onImport={(newPaths) => {
		pathTables = pathTables.concat(newPaths);
	}}
/>
