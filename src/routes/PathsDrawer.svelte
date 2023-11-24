<script lang="ts">
	import DrawerAddButton from '$lib/components/DrawerAddButton.svelte';
	import DrawerHeading from '$lib/components/DrawerHeading.svelte';
	import DrawerRow from '$lib/components/DrawerRow.svelte';
	import {
		getDefaultAuto,
		type Auto,
		type Waypoint,
		type RobotConfig,
		getDefaultRobotConfig,
		DetailType,
		type Detail,
		type AutoConfig,
		type PathConfig
	} from '$lib/scripts/Trajectory';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	let robot = getDefaultRobotConfig();
	let autos: Auto[] = [getDefaultAuto()];
	let selectedAuto = 0;
	let open = true;
	let autoStore = getContext<Writable<Auto>>('auto');
	let detailsStore = getContext<Writable<Detail>>('details');
	let detail: Detail;
	let selectedDetail: [number, number] = [0, 0];

	$: autoStore.set(autos[selectedAuto]);
	autoStore.subscribe((newAuto) => {
		autos[selectedAuto] = newAuto;
		if (detail?.type === DetailType.Waypoint) {
			const value = autos[selectedAuto].paths[selectedDetail[0]].waypoints[selectedDetail[1]];
			if (value !== detail?.value) {
				detailsStore.set({
					type: DetailType.Waypoint,
					value: value
				});
			}
		} else if (detail?.type === DetailType.PathConfig) {
			const value = autos[selectedAuto].paths[selectedDetail[0]].config;
			if (value !== detail?.value) {
				detailsStore.set({
					type: DetailType.PathConfig,
					value
				});
			}
		} else if (detail?.type === DetailType.AutoConfig) {
			const value = autos[selectedAuto].config;
			if (value !== detail?.value) {
				detailsStore.set({
					type: DetailType.AutoConfig,
					value
				});
			}
		} else if (detail?.type === DetailType.RobotConfig) {
			const value = robot;
			if (value !== detail?.value) {
				detailsStore.set({
					type: DetailType.RobotConfig,
					value
				});
			}
		}
		autos = autos;
	});

	detailsStore.subscribe((newDetails) => {
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
		autos = autos;
	});
</script>

{#if open}
	<div
		class="w-48 lg:w-64 flex-shrink-0 flex-grow-0 bg-zinc-800 h-screen-minus-title p-4 overflow-y-scroll"
	>
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
						autoStore.set(autos[selectedAuto]);
						detailsStore.set({
							type: DetailType.AutoConfig,
							value: autos[selectedAuto].config
						});
					}}
					deleteRow={() => {
						autos.splice(i, 1);
						if (i == selectedAuto) {
							selectedAuto = 0;
							if (autos.length == 0) {
								autos.push(getDefaultAuto());
							}
							autoStore.set(autos[selectedAuto]);
						}
						autos = autos;
					}}
				/>
			{/each}
			<DrawerAddButton
				onClick={() => {
					autos.push(getDefaultAuto());
					selectedAuto = autos.length - 1;
					autoStore.set(autos[selectedAuto]);
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
							detailsStore.set({
								type: DetailType.Waypoint,
								value: waypoint
							});
						}}
					/>
				{/each}
			{/each}
			<DrawerAddButton
				onClick={() => {
					autos[selectedAuto].paths[autos[selectedAuto].paths.length - 1].waypoints.push({
						x: 0,
						y: 0,
						psi: 0,
						th: 0,
						hidden: false
					});
					autos = autos;
				}}
			/>
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
