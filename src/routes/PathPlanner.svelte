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

	/**
	 * For passing selected auto up through state. Not
	 * intended to be reassigned from outside this component.
	 * Bind this prop if changes to detail properties
	 * should trigger state update higher up.
	 */
	let auto: Auto = getDefaultAuto();

	let robot = getDefaultRobotConfig();
	let autos: Auto[] = [auto];
	let selectedAuto = 0;
	let selectedDetail: [number, number] = [0, 0];
	let detail: Detail = { type: DetailType.AutoConfig, value: autos[selectedAuto].config };
	let open = true;

	$: auto = autos[selectedAuto];

	const selectAuto = (selectedAuto: number) => {
		if (detail?.type === DetailType.Waypoint) {
			const value = autos[selectedAuto].paths[selectedDetail[0]].waypoints[selectedDetail[1]];
			if (value !== detail?.value) {
				detail = {
					type: DetailType.Waypoint,
					value: value
				};
			}
		} else if (detail?.type === DetailType.PathConfig) {
			const value = autos[selectedAuto].paths[selectedDetail[0]].config;
			if (value !== detail?.value) {
				detail = {
					type: DetailType.PathConfig,
					value
				};
			}
		} else if (detail?.type === DetailType.AutoConfig) {
			const value = autos[selectedAuto].config;
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
		autos = autos;
	};
	$: selectAuto(selectedAuto);

	const autoUpdated = (newAuto: Auto) => {
		if (!newAuto) return;
		// waypoints can be updated outside of this component so need to refresh detail, may need to handle more cases later
		if (detail.type === DetailType.Waypoint) {
			detail = {
				type: DetailType.Waypoint,
				value: autos[selectedAuto].paths[selectedDetail[0]].waypoints[selectedDetail[1]]
			};
		}
		console.log('PathsDrawer auto updated -> detail update forced');
	};
	$: autoUpdated(auto);

	const updateDetail = (newDetails: Detail) => {
		if (!newDetails) return;
		detail = newDetails;
		if (newDetails.type === DetailType.AutoConfig) {
			autos[selectedDetail[0]].config = newDetails.value as AutoConfig;
		} else if (newDetails.type === DetailType.PathConfig) {
			autos[selectedAuto].paths[selectedDetail[0]].config = newDetails.value as PathConfig;
		} else if (newDetails.type === DetailType.RobotConfig) {
			robot = newDetails.value as RobotConfig;
		} else if (newDetails.type === DetailType.Waypoint) {
			autos[selectedAuto].paths[selectedDetail[0]].waypoints[selectedDetail[1]] =
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
					{#each autos as auto, i}
						<DrawerRow
							bind:name={auto.title}
							selected={i == selectedAuto}
							onClick={() => {
								selectedAuto = i;
								detail = {
									type: DetailType.AutoConfig,
									value: autos[selectedAuto].config
								};
							}}
							deleteRow={() => {
								autos.splice(i, 1);
								if (i == selectedAuto) {
									selectedAuto = 0;
									if (autos.length == 0) {
										autos.push(getDefaultAuto());
									}
								}
							}}
						/>
					{/each}
					<DrawerAddButton
						onClick={() => {
							autos.push(getDefaultAuto());
							selectedAuto = autos.length - 1;
						}}
					/>
				</div>
				<div class="mb-8">
					<DrawerHeading>Waypoints</DrawerHeading>
					{#each autos[selectedAuto].paths as path, i}
						{#each path.waypoints as waypoint, j}
							<DrawerRow
								selected={detail?.type === DetailType.Waypoint &&
									selectedDetail[0] == i &&
									selectedDetail[1] == j}
								name={`Waypoint ${j + 1}`}
								deleteRow={() => {
									autos[selectedAuto].paths[i].waypoints.splice(j, 1);
									autos = autos;
								}}
								onClick={() => {
									selectedDetail = [i, j];
									detail = {
										type: DetailType.Waypoint,
										value: autos[selectedAuto].paths[i].waypoints[j]
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

			<DrawerButton onClick={downloadAuto}>Export</DrawerButton>
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
