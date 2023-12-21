<script lang="ts">
	import DrawerAddButton from '$lib/components/DrawerAddButton.svelte';
	import DrawerButton from '$lib/components/DrawerButton.svelte';
	import DrawerHeading from '$lib/components/DrawerHeading.svelte';
	import DrawerRow from '$lib/components/DrawerRow.svelte';
	import {
		getDefaultAuto,
		type Auto,
		DetailType,
		type Detail,
		getDefaultRobotConfig,
		type AutoConfig,
		type PathConfig,
		type RobotConfig,
		type Waypoint
	} from '$lib/scripts/Trajectory';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import DetailsPopup from './DetailsPopup.svelte';
	import PathCanvas from './PathCanvas.svelte';
	import AutoImportModal from './AutoImportModal.svelte';

	/**
	 * For passing selected auto up through state. Not
	 * intended to be reassigned from outside this component.
	 * Bind this prop if changes to detail properties
	 * should trigger state update higher up.
	 */
	let auto: Auto = getDefaultAuto();

	let robot = getDefaultRobotConfig();
	let autos: Auto[] = [auto];

	// used where more resolution is needed than selectedAuto to determine detail location
	let selectedDetail: { pathIndex: number; waypointIndex: number } = {
		pathIndex: 0,
		waypointIndex: 0
	};
	let detail: Detail = { type: DetailType.AutoConfig, value: auto.config };
	let open = true;
	let importing = false;

	const selectAuto = (selectedAuto: number) => {
		auto = autos[selectedAuto];

		if (detail?.type === DetailType.Waypoint) {
			const value = auto.paths[selectedDetail.pathIndex].waypoints[selectedDetail.waypointIndex];
			if (value !== detail?.value) {
				detail = {
					type: DetailType.Waypoint,
					value: value
				};
			}
		} else if (detail?.type === DetailType.PathConfig) {
			const value = auto.paths[selectedDetail.pathIndex].config;
			if (value !== detail?.value) {
				detail = {
					type: DetailType.PathConfig,
					value
				};
			}
		} else if (detail?.type === DetailType.AutoConfig) {
			const value = auto.config;
			if (value !== detail?.value) {
				detail = {
					type: DetailType.AutoConfig,
					value
				};
			}
		} else if (detail?.type === DetailType.RobotConfig) {
			const value = robot;
			if (value !== detail?.value) {
				detail = {
					type: DetailType.RobotConfig,
					value
				};
			}
		}

		detail = {
			type: DetailType.AutoConfig,
			value: auto.config
		};
		autos = autos;
	};

	const autoUpdated = (newAuto: Auto) => {
		if (!newAuto) return;
		// waypoints can be updated outside of this component so need to refresh detail, may need to handle more cases later
		if (detail.type === DetailType.Waypoint) {
			detail = {
				type: DetailType.Waypoint,
				value: auto.paths[selectedDetail.pathIndex].waypoints[selectedDetail.waypointIndex]
			};
		}
		console.debug('PathsDrawer auto updated -> detail update forced');
	};
	$: autoUpdated(auto);

	const updateDetail = (newDetails: Detail) => {
		if (!newDetails) return;
		detail = newDetails;
		if (newDetails.type === DetailType.AutoConfig) {
			auto.config = newDetails.value as AutoConfig;
		} else if (newDetails.type === DetailType.PathConfig) {
			auto.paths[selectedDetail.pathIndex].config = newDetails.value as PathConfig;
		} else if (newDetails.type === DetailType.RobotConfig) {
			robot = newDetails.value as RobotConfig;
		} else if (newDetails.type === DetailType.Waypoint) {
			auto.paths[selectedDetail.pathIndex].waypoints[selectedDetail.waypointIndex] =
				newDetails.value as Waypoint;
		}
		auto = auto;
	};
	$: updateDetail(detail);

	function downloadAuto() {
		const element = document.createElement('a');
		const file = new Blob([JSON.stringify(auto)], { type: 'text/plain' });
		element.href = URL.createObjectURL(file);
		element.download = `${auto.title}.json`;
		document.body.appendChild(element); // Required for this to work in FireFox
		element.click();
	}

	function deleteWaypoint(pathIndex: number, waypointIndex: number) {
		const path = auto.paths[pathIndex];
		path.waypoints.splice(waypointIndex, 1);

		if (detail.type === DetailType.Waypoint) {
			if (pathIndex === selectedDetail.pathIndex) {
				if (waypointIndex === selectedDetail.waypointIndex) {
					// if this waypoint was the detail, default to auto config
					detail = {
						type: DetailType.AutoConfig,
						value: auto.config
					};
				} else if (waypointIndex < selectedDetail.waypointIndex) {
					// if this waypoint was before the detail waypoint, shift the indices back
					selectedDetail.waypointIndex--;
				}
			}
		}

		if (path.waypoints.length === 0) {
			// if this was the last waypoint, remove the path
			auto.paths.splice(pathIndex, 1);
			if (detail.type === DetailType.PathConfig) {
				if (pathIndex < selectedDetail.pathIndex) {
					// if this path was before the detail path, shift the indices back
					selectedDetail.pathIndex--;
				} else if (pathIndex === selectedDetail.pathIndex) {
					// if this path was the detail, default to auto config
					detail = {
						type: DetailType.AutoConfig,
						value: auto.config
					};
				}
			}
		}

		auto = auto;
	}
</script>

<div class="relative flex">
	{#if open}
		<div
			class="flex flex-col justify-between w-48 lg:w-64 flex-col flex-shrink-0 flex-grow-0 bg-zinc-800 h-screen-minus-title p-4 overflow-y-scroll"
		>
			<div>
				<div class="flex items-center justify-between pb-4">
					<h2 class="text-lg text-lighttext">Project</h2>
					<button on:click={() => (open = false)}>
						<FontAwesomeIcon class="text-zinc-600 hover:text-lighttext" icon="fa-solid fa-x" />
					</button>
				</div>
				<div class="mb-8">
					<DrawerHeading>Autos</DrawerHeading>
					{#each autos as autoIter, i}
						<DrawerRow
							bind:name={autoIter.title}
							selected={autoIter === auto}
							onClick={() => {
								selectAuto(i);
							}}
							deleteRow={(selected) => {
								autos.splice(i, 1);
								if (selected) {
									if (autos.length == 0) {
										autos.push(getDefaultAuto());
									}
									selectAuto(0);
								}
							}}
						/>
					{/each}
					<DrawerAddButton
						onClick={() => {
							autos.push(getDefaultAuto());
							selectAuto(autos.length - 1);
						}}
					/>
				</div>
				<div class="mb-8">
					<DrawerHeading>Waypoints</DrawerHeading>
					{#each auto.paths as path, i}
						{#each path.waypoints as waypoint, j}
							<DrawerRow
								selected={detail?.type === DetailType.Waypoint &&
									selectedDetail.pathIndex == i &&
									selectedDetail.waypointIndex == j}
								name={`Waypoint ${j + 1}`}
								deleteRow={() => deleteWaypoint(i, j)}
								onClick={() => {
									selectedDetail = { pathIndex: i, waypointIndex: j };
									detail = {
										type: DetailType.Waypoint,
										value: auto.paths[i].waypoints[j]
									};
								}}
							/>
						{/each}
					{/each}
					<DrawerAddButton
						onClick={() => {
							const pathIndex = auto.paths.length - 1;
							auto.paths[pathIndex].waypoints.push({
								x: 0,
								y: 0,
								psi: 0,
								th: 0,
								hidden: false
							});
							auto = auto;
						}}
					/>
				</div>
			</div>

			<div>
				<DrawerButton onClick={() => (importing = true)}>Import</DrawerButton>
				<DrawerButton onClick={downloadAuto}>Export</DrawerButton>
			</div>
		</div>
	{:else}
		<button
			type="button"
			class={`w-6 flex justify-center flex-shrink-0 bg-zinc-800 h-screen-minus-title`}
			on:click={() => (open = true)}
		>
			<div class="w-4 h-4 pt-2">
				<FontAwesomeIcon class="text-lighttext" icon="fa-solid fa-bars" />
			</div>
		</button>
	{/if}

	<DetailsPopup bind:detail />

	<PathCanvas bind:auto />
</div>

{#if importing}
	<AutoImportModal
		onImport={(auto) => {
			autos.push(auto);
			selectAuto(autos.length - 1);
		}}
		bind:show={importing}
	/>
{/if}
