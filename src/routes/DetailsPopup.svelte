<script lang="ts">
	import { type Detail, DetailType } from '$lib/scripts/Trajectory';
	import { SvelteComponent, getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import WaypointEditor from './WaypointEditor.svelte';
	import AutoConfigEditor from './AutoConfigEditor.svelte';
	import PathConfigEditor from './PathConfigEditor.svelte';
	import RobotConfigEditor from './RobotConfigEditor.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	let titleBar: HTMLDivElement;
	let contentContainer: HTMLDivElement;
	let popup: HTMLDivElement;

	let movingPopup = false;
	let movementStart: { popupX: number; popupY: number; mouseX: number; mouseY: number };
	let expanded: boolean;
	let expandingPopup = false;
	let lastExpandPos: number;

	let detailsStore = getContext<Writable<Detail>>('details');
	let detail: Detail;
	detailsStore.subscribe((newDetails) => {
		detail = newDetails;
		expanded = true;
	});
	const setDetail = (newDetail: Detail) => {
		if (newDetail) detailsStore.set(detail);
	};
	$: setDetail(detail);

	onMount(() => {
		expanded = false;
		window.addEventListener('mouseup', () => {
			movingPopup = false;
			expandingPopup = false;
		});

		window.addEventListener('mousemove', (e) => {
			if (movingPopup) {
				popup.style.left = `${e.clientX - (movementStart.mouseX - movementStart.popupX)}px`;
				popup.style.top = `${e.clientY - (movementStart.mouseY - movementStart.popupY)}px`;
			} else if (expandingPopup) {
				console.log(`title: ${titleBar?.offsetHeight} content: ${contentContainer?.offsetHeight}`);
				const newHeight = Math.min(
					popup.offsetHeight + (e.clientY - lastExpandPos),
					100000 //titleBar?.offsetHeight ?? 0 + contentContainer?.offsetHeight ?? 0
				);
				popup.style.height = `${newHeight}px`;
				lastExpandPos = e.clientY;
			}
		});
	});
</script>

<div
	class="absolute flex flex-col rounded-xl shadow-lg border border-1 border-zinc-600 z-20 overflow-hidden"
	bind:this={popup}
>
	<div
		class="flex flex-shrink-0 flex-grow-0 h-5 w-full items-center justify-end bg-zinc-700 shadow-inner shadow-md cursor-move"
		bind:this={titleBar}
		on:mousedown={(ev) => {
			movingPopup = true;
			movementStart = {
				popupX: popup.offsetLeft,
				popupY: popup.offsetTop,
				mouseX: ev.clientX,
				mouseY: ev.clientY
			};
		}}
	>
		<button class="flex"
			><FontAwesomeIcon
				class="text-zinc-400 hover:text-lighttext mr-2 h-3"
				icon="fa-solid fa-up-right-and-down-left-from-center"
			/></button
		>
	</div>
	<div class="w-48 flex-grow flex-shrink lg:w-64 bg-zinc-800 overflow-auto p-4 box-border">
		{#if detail.type === DetailType.Waypoint}
			<WaypointEditor bind:div={contentContainer} bind:waypoint={detail.value} {expanded} />
		{:else if detail.type === DetailType.AutoConfig}
			<AutoConfigEditor bind:config={detail.value} {expanded} />
		{:else if detail.type === DetailType.PathConfig}
			<PathConfigEditor bind:config={detail.value} {expanded} />
		{:else if detail.type === DetailType.RobotConfig}
			<RobotConfigEditor bind:config={detail.value} {expanded} />
		{/if}
	</div>

	<div
		class="absolute -bottom-0.5 h-1 w-full cursor-ns-resize"
		on:mousedown={(ev) => {
			expandingPopup = true;
			lastExpandPos = ev.clientY;
		}}
	/>
</div>
