<script lang="ts">
	import { type Detail, DetailType } from '$lib/scripts/Trajectory';
	import { onMount } from 'svelte';
	import WaypointEditor from './WaypointEditor.svelte';
	import AutoConfigEditor from './AutoConfigEditor.svelte';
	import PathConfigEditor from './PathConfigEditor.svelte';
	import RobotConfigEditor from './RobotConfigEditor.svelte';
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

	/** The currently selected detail. Will not be reassigned from within this component, only modified. */
	export let detail: Detail;
	$: console.debug('DetailsPopup', detail);

	let titleBar: HTMLDivElement;
	let contentContainer: HTMLDivElement;
	let popup: HTMLDivElement;

	let movingPopup = false;
	let movementStart: { popupX: number; popupY: number; mouseX: number; mouseY: number };
	let expanded: boolean;
	let expandingPopup = false;
	let lastExpandPos: number;

	let maxRight: number;
	let maxTop: number;
	const getMaxPopupPositions = () => {
		maxRight = window.innerWidth - contentContainer.offsetWidth;
		maxTop = window.innerHeight - contentContainer.offsetHeight - titleBar.offsetHeight;
	};

	onMount(() => {
		console.debug(detail);
		getMaxPopupPositions();
		window.addEventListener('resize', getMaxPopupPositions);

		expanded = true;
		window.addEventListener('mouseup', () => {
			movingPopup = false;
			expandingPopup = false;
		});

		window.addEventListener('mousemove', (e) => {
			if (movingPopup) {
				let right = window.innerWidth - e.clientX - (movementStart.mouseX - movementStart.popupX);
				if (right > maxRight) right = maxRight;
				else if (right < 0) right = 0;
				popup.style.right = `${right}px`;

				let top = e.clientY - (movementStart.mouseY - movementStart.popupY);
				if (top > maxTop) top = maxTop;
				else if (top < 0) top = 0;
				popup.style.top = `${top}px`;
			} else if (expandingPopup) {
				console.debug(
					`title: ${titleBar?.offsetHeight} content: ${contentContainer?.offsetHeight}`
				);
				const newHeight = Math.min(
					popup.offsetHeight + (e.clientY - lastExpandPos),
					100000 //titleBar?.clientHeight ?? 0 + contentContainer?.offsetHeight ?? 0
				);
				popup.style.height = `${newHeight}px`;
				lastExpandPos = e.clientY;
			}
		});
	});
</script>

<div
	class={`fixed right-0 flex flex-col rounded-xl shadow-lg border border-1 border-zinc-600 z-20 overflow-hidden`}
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
		<button class="flex" on:click={() => (expanded = !expanded)}
			><FontAwesomeIcon
				class="text-zinc-400 hover:text-lighttext mr-2 h-3"
				icon="fa-solid fa-up-right-and-down-left-from-center"
			/></button
		>
	</div>
	<div
		bind:this={contentContainer}
		class={`${
			expanded ? 'w-48 lg:w-64' : 'w-20'
		} flex-grow flex-shrink bg-zinc-800 overflow-auto p-4 box-border`}
	>
		{#if detail.type === DetailType.Waypoint}
			<WaypointEditor bind:waypoint={detail.value} {expanded} />
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
