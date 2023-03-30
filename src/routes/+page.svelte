<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	import Input from '$lib/components/Input.svelte';
	import { invoke } from '@tauri-apps/api/tauri';
	import Button from '$lib/components/Button.svelte';
	import x from '$lib/assets/x.svg';
	import PathTableRow from '$lib/components/PathTableRow.svelte';
	import {
		fetchPath,
		initialPathTables,
		initialTrajectoryConfig,
		pathToString,
		stringToPaths,
		waypointsToPoses,
		type SwerveTrajectoryWaypoint,
		type TrajectoryResponse
	} from '$lib/scripts/Trajectory';
	import PathCanvas from '$lib/components/PathCanvas.svelte';
	import { onMount } from 'svelte';
	import { copyText } from '$lib/scripts/copyToClipboard';

	let getPath: (
		waypoints: SwerveTrajectoryWaypoint[],
		startVelocity: number,
		endVelocity: number,
		maxVelocity: number,
		maxAcceleration: number,
		reversed: boolean
	) => Promise<TrajectoryResponse | null> = fetchPath;

	let trajConfig = {
		startVelocity: initialTrajectoryConfig.startVelocity,
		endVelocity: initialTrajectoryConfig.endVelocity,
		maxVelocity: initialTrajectoryConfig.maxVelocity,
		maxAcceleration: initialTrajectoryConfig.maxAcceleration,
		reversed: initialTrajectoryConfig.reversed
	};

	let ON_TAURI = false;
	let pathTables = initialPathTables;

	let showControls = true;
	let selectedPath = 0;

	let oldPaths = pathTables;
	let exportModalCode = '';
	let exportModalOpen = false;
	let importPathTextarea: HTMLTextAreaElement;
	let importModalOpen = false;
	let importResultOpen = false;
	let importResults: string[] = [];

	async function updatePath(pathTableIndex: number) {
		const { startVelocity, endVelocity, maxVelocity, maxAcceleration, reversed } = trajConfig;

		pathTables[pathTableIndex].path = await getPath(
			pathTables[pathTableIndex].waypoints,
			startVelocity,
			endVelocity,
			maxVelocity,
			maxAcceleration,
			reversed
		);
		pathTables = pathTables;
	}

	function updatePathTablesAfter(func: () => any, pathTableIndex: number) {
		return () => {
			const retVal = func();
			pathTables = pathTables;

			updatePath(pathTableIndex);

			return retVal;
		};
	}

	onMount(async () => {
		ON_TAURI =
			(await invoke('test_for_tauri')
				.then((val) => (typeof val === 'boolean' ? val : false))
				.catch((err) => {
					console.log(`Error getting tauri: ${err}`);
					return false;
				})) ?? false;
		console.log(
			ON_TAURI
				? 'Was able to invoke tauri function, will use Rust trajectory generation'
				: 'Was not able to invoke tauri function, will use TrajectoryAPI'
		);
		if (ON_TAURI) {
			getPath = (waypoints, startVelocity, endVelocity, maxVelocity, maxAcceleration, reversed) =>
				invoke<TrajectoryResponse>('generate_trajectory_tauri', {
					waypoints: waypointsToPoses(waypoints),
					config: {
						max_velocity: maxVelocity,
						max_acceleration: maxAcceleration,
						start_velocity: startVelocity,
						end_velocity: endVelocity,
						reversed
					}
				});
		}
		const val = getPath(
			pathTables[0].waypoints,
			initialTrajectoryConfig.startVelocity,
			initialTrajectoryConfig.endVelocity,
			initialTrajectoryConfig.maxVelocity,
			initialTrajectoryConfig.maxAcceleration,
			initialTrajectoryConfig.reversed
		);

		if (val instanceof Promise) {
			val.then((startPath) => {
				console.log(startPath);
				pathTables.forEach((pathTable, idx) => {
					console.log(`setting start path ${idx}`);
					pathTable.path = startPath;
				});
				pathTables = pathTables;
			});
		} else {
			console.log(val);
			pathTables.forEach((pathTable, idx) => {
				console.log(`setting start path ${idx}`);
				pathTable.path = val;
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
					value={trajConfig.reversed}
					onChange={(ev) => {
						trajConfig.reversed = ev.currentTarget.checked;
						updatePath(selectedPath);
					}}
				/>

				<Input
					name="Max Acceleration"
					type="number"
					value={trajConfig.maxAcceleration}
					onChange={(ev) => (trajConfig.maxAcceleration = parseFloat(ev.currentTarget.value))}
				/>

				<Input
					name="Max Velocity"
					type="number"
					value={trajConfig.maxVelocity}
					onChange={(ev) => (trajConfig.maxVelocity = parseFloat(ev.currentTarget.value))}
				/>

				<Input
					name="Start Velocity"
					type="number"
					value={trajConfig.startVelocity}
					onChange={(ev) => (trajConfig.startVelocity = parseFloat(ev.currentTarget.value))}
				/>

				<Input
					name="End Velocity"
					type="number"
					value={trajConfig.endVelocity}
					onChange={(ev) => (trajConfig.endVelocity = parseFloat(ev.currentTarget.value))}
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

				<div class="paths mt-4 bg-white">
					<ul class="flex items-stretch rounded-t-lg">
						{#each pathTables as pathTable, tableIndex}
							{#if tableIndex == selectedPath}
								<li class="bg-violet-800 flex-1 text-center">
									<button>{tableIndex + 1}</button>
								</li>
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
					class="w-36 lg:w-48 bg-violet-800 p-2 rounded-lg mx-4 mt-4"
					type="button"
					on:click={() => {
						exportModalCode = pathToString(
							pathTables[selectedPath].waypoints,
							pathTables[selectedPath].title
						);
						exportModalOpen = true;
					}}>Export Path</button
				>
				<button
					type="button"
					class="w-36 lg:w-48 bg-violet-800 p-2 rounded-lg mx-4 mt-4"
					on:click={() => {
						let newimportModalCode = '';
						for (const path of pathTables) {
							newimportModalCode += pathToString(path.waypoints, path.title) + '\n';
						}
						exportModalCode = newimportModalCode;
						exportModalOpen = true;
					}}>Export All Paths</button
				>

				<Button onClick={() => (importModalOpen = true)}>Import</Button>
			</form>
		</div>
	{/if}
	<div class="w-4 flex-shrink-0 bg-zinc-900 h-screen-minus-title">
		<button class={`absolute top-2 w-4 h-4`} on:click={() => (showControls = !showControls)}>
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
			path={pathTables[selectedPath].path ?? {
				states: [],
				totalTimeSeconds: 0,
				initialPose: { translation: { x: 0, y: 0 }, rotation: { radians: 0 } }
			}}
			triggerWaypointUpdate={updatePathTablesAfter(() => {}, selectedPath)}
		/>
	</div>
</div>

{#if exportModalOpen}
	<div class="absolute top-0 left-0 w-screen h-screen bg-opacity-75 bg-black z-40">
		<div class="relative w-[50rem] h-[40rem] mx-auto mt-24 bg-violet-800 rounded-xl">
			<div class="mx-auto max-w-max">
				<div class="flex text-white">
					<h2 class="max-w-max pt-8 pb-4 text-bold text-xl">Exported Path Code</h2>
					<button on:click={() => copyText(exportModalCode)} class="mt-8 mb-4 mx-4"
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
			<button class="w-4 h-4 absolute top-4 right-4" on:click={() => (exportModalOpen = false)}
				><img src={x} alt="" srcset="" /></button
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
					<span class="text-neutral-400 pl-2 pt-[2.25rem]">Units: meters, degrees</span>
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
							const importedPaths = stringToPaths(importPathTextarea.value).slice(0, 5);
							importResults = importedPaths.map((path, idx) => {
								pathTables[idx] = path;
								return path.title;
							});
							importResultOpen = true;
						}}
						invert={true}>Import</Button
					>
				</div>
			</div>
			<button class="w-4 h-4 absolute top-4 right-4" on:click={() => (importModalOpen = false)}
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
							importResults.length ? `: ${importResults}` : ''
						}`}
					</p>
				</div>
				<div>
					<Button
						width="w-20"
						height="h-12"
						mX="mx-1"
						mTop="mt-1"
						onClick={() => {
							importResultOpen = false;
							importModalOpen = false;
							importPathTextarea.value = '';
							for (let i = 0; i < importResults.length; i++) updatePath(i);
						}}>{importResults.length ? 'Confirm' : 'Exit'}</Button
					>
					<Button
						width="w-20"
						height="h-12"
						invert={true}
						onClick={() => {
							pathTables = oldPaths;
							importResultOpen = false;
						}}>Cancel</Button
					>
				</div>
			</div>
		</div>
	</div>
{/if}
