<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	import Input from '$lib/components/Input.svelte';
	import { invoke } from '@tauri-apps/api/tauri';
	import Button from '$lib/components/Button.svelte';
	import x from '$lib/assets/x.svg';
	import PathTableRow from '$lib/components/PathTableRow.svelte';
	import PathTableBreakRow from '$lib/components/PathTableBreakRow.svelte';
	import {
		fetchPath,
		getDefaultPath,
		pathToString,
		stringToPaths,
		waypointsToPoses,
		getDoNothingTrajectory,
		type SwerveTrajectoryWaypoint,
		type TrajectoryResponse,
		type TrajectoryConfig
	} from '$lib/scripts/Trajectory';
	import PathCanvas from '$lib/components/PathCanvas.svelte';
	import { onMount } from 'svelte';
	import { copyText } from '$lib/scripts/copyToClipboard';
	import { roundFloat } from '$lib/scripts/math';

	let getPath: (
		waypoints: SwerveTrajectoryWaypoint[],
		config: TrajectoryConfig
	) => Promise<TrajectoryResponse> = fetchPath;

	let ON_TAURI = false;
	let pathTables = [getDefaultPath()];

	let showControls = true;
	let selectedPath = 0;

	let oldPaths = pathTables;
	let exportModalCode = '';
	let exportModalOpen = false;
	let importPathTextarea: HTMLTextAreaElement;
	let importModalOpen = false;
	let importResultOpen = false;
	let importResults: string[] = [];

	const parseAndRound = (numStr: string) => roundFloat(parseFloat(numStr), 3);

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
					config
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
					type="number"
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
									<th class="bg-violet-300"
										><button
											type="button"
											on:click={updatePathTablesAfter(
												() =>
													pathTables[tableIndex].waypoints[
														pathTables[tableIndex].waypoints.length - 1
													].push({ x: 0, y: 0, th: 0, psi: 0 }),
												tableIndex,
												pathTables[tableIndex].waypoints.length - 1
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
								{#each pathTable.waypoints as waypoints, waypointsIndex}
									{#each waypoints as row, rowIndex}
										<PathTableRow
											{row}
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
											updateTableRender={() => (pathTable = pathTable)}
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
								<tr>
									<td class="bg-violet-500 hover:bg-violet-600 text-white pb-1" colspan="5">
										<button
											class="w-full h-4"
											on:click={() => {
												pathTable.waypoints.push([]);
												pathTable.paths.push(getDoNothingTrajectory());
												pathTables = pathTables;
											}}>Add Breakpoint</button
										>
									</td>
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
					onClick={() => {
						exportModalCode = pathToString(
							pathTables[selectedPath].waypoints,
							pathTables[selectedPath].config,
							pathTables[selectedPath].title
						);
						exportModalOpen = true;
					}}>Export Path</Button
				>
				<Button
					onClick={() => {
						let newimportModalCode = '';
						for (const path of pathTables) {
							newimportModalCode += pathToString(path.waypoints, path.config, path.title) + '\n';
						}
						exportModalCode = newimportModalCode;
						exportModalOpen = true;
					}}>Export All Paths</Button
				>

				<Button onClick={() => (importModalOpen = true)}>Import</Button>
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
				<FontAwesomeIcon icon={['fas', 'angles-left']} />
			{:else}
				<FontAwesomeIcon icon={['fas', 'angles-right']} />
			{/if}
		</button>
	</div>

	<div class="overflow-scroll max-h-screen-minus-title p-8">
		<PathCanvas
			waypoints={pathTables[selectedPath].waypoints}
			paths={pathTables[selectedPath].paths ?? [getDoNothingTrajectory()]}
			triggerWaypointUpdate={(pathsIndex) => updatePath(selectedPath, pathsIndex)}
		/>
	</div>
</div>

{#if exportModalOpen}
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
			<button
				type="button"
				class="w-4 h-4 absolute top-4 right-4"
				on:click={() => (exportModalOpen = false)}><img src={x} alt="" srcset="" /></button
			>
		</div>
	</div>
{/if}

{#if importModalOpen}
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
							oldPaths = pathTables;
							const importedPaths = stringToPaths(importPathTextarea.value);
							importResults = importedPaths.map((path) => {
								pathTables.push(path);
								return path.title;
							});
							importResultOpen = true;
						}}
						invert={true}>Import</Button
					>
				</div>
			</div>
			<button
				type="button"
				class="w-4 h-4 absolute top-4 right-4"
				on:click={() => (importModalOpen = false)}><img src={x} alt="" srcset="" /></button
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
							importResults.length ? `: ${importResults}` : ''
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
							importModalOpen = false;
							importPathTextarea.value = '';
							for (let i = 1; i <= importResults.length; i++) updatePaths(pathTables.length - i);
						}}>{importResults.length ? 'Confirm' : 'Exit'}</Button
					>
					<Button
						width="w-20"
						widthLg="w-20"
						height="h-12"
						invert={true}
						onClick={() => {
							importResults.forEach(() => pathTables.pop());
							importResultOpen = false;
						}}>Cancel</Button
					>
				</div>
			</div>
		</div>
	</div>
{/if}
