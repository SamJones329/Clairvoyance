<script lang="ts">
	import fieldImg from '$lib/assets/2023-Field-Charged-Up.svg';
	import { onMount } from 'svelte';
	import { AutoCanvas, canvasHeight, canvasWidth } from '$lib/scripts/canvas';
	import { getPath, type Auto, type Waypoint } from '$lib/scripts/Trajectory';

	enum TransformMode {
		Translate,
		Rotate,
		RotateHeading
	}

	// state variables
	/**
	 * The currently selected auto. Will not be
	 * reassigned from within this component, only
	 * modified. Bind this variable if auto property
	 * changes should trigger update in parent
	 * component.
	 */
	export let auto: Auto;
	let canvas: HTMLCanvasElement;
	let autoCanvas: AutoCanvas;
	let pathToTransformIndex = -1;
	let waypointToTransformIndex = -1;
	let transformMode: TransformMode = TransformMode.Translate;
	let preview: Waypoint | null = null;

	// state variable reactions
	$: waypointBoundBoxes = autoCanvas?.getWaypointBoundBoxes(auto);
	$: autoCanvas?.draw(auto, preview);

	async function updateAuto(pathIndex: number | null = null) {
		if (pathIndex != null) {
			console.log(auto.paths[pathIndex]);
			auto.paths[pathIndex].path = await getPath(auto.paths[pathIndex].waypoints, {
				...auto.config,
				...auto.paths[pathIndex].config
			});
			console.log(auto.paths[pathIndex].path);
		} else {
			for (const path of auto.paths) {
				path.path = await getPath(path.waypoints, { ...auto.config, ...path.config });
			}
		}
		auto = auto;
	}

	// Runs when component first spins up
	onMount(() => {
		updateAuto();
		autoCanvas = new AutoCanvas(canvas);

		canvas.addEventListener('dblclick', (ev: MouseEvent) => {
			const [canvasX, canvasY] = autoCanvas.clientToCanvasCoords(ev.clientX, ev.clientY);
			const fieldCoords = autoCanvas.canvasToField(canvasX, canvasY);
			auto.paths[auto.paths.length - 1].waypoints.push({
				x: fieldCoords.x,
				y: fieldCoords.y,
				psi: 0,
				th: 0,
				hidden: false
			});
			updateAuto(auto.paths.length - 1);
		});

		canvas.addEventListener('mousedown', (ev: MouseEvent) => {
			const [canvasX, canvasY] = autoCanvas.clientToCanvasCoords(ev.clientX, ev.clientY);
			console.debug(`mousedown on canvas at (${canvasX}, ${canvasY})`);
			for (let i = 0; i < waypointBoundBoxes.length; i++) {
				const boxesForPath = waypointBoundBoxes[i];
				for (let j = 0; j < boxesForPath.length; j++) {
					const bounds = boxesForPath[j];
					if (autoCanvas.isPointInCircle(canvasX, canvasY, bounds.rotationCircle)) {
						console.debug(`Rotate Waypoint ${i}`);
						pathToTransformIndex = i;
						waypointToTransformIndex = j;
						transformMode = TransformMode.Rotate;
						break;
					} else if (autoCanvas.isPointInCircle(canvasX, canvasY, bounds.headingCircle)) {
						console.debug(`Rotate Waypoint Heading ${i}`);
						pathToTransformIndex = i;
						waypointToTransformIndex = j;
						transformMode = TransformMode.RotateHeading;
						break;
					} else if (autoCanvas.isPointInBox(canvasX, canvasY, bounds.translationBox)) {
						console.debug(`Translate Waypoint ${i}`);
						pathToTransformIndex = i;
						waypointToTransformIndex = j;
						transformMode = TransformMode.Translate;
						break;
					}
				}
			}
			if (pathToTransformIndex === -1 || waypointToTransformIndex === -1)
				console.debug("Didn't find waypoint you clicked on");
		});

		canvas.addEventListener('mousemove', (ev: MouseEvent) => {
			if (waypointToTransformIndex === -1) return;
			const waypoint = auto.paths[pathToTransformIndex].waypoints[waypointToTransformIndex];
			const [canvasX, canvasY] = autoCanvas.clientToCanvasCoords(ev.clientX, ev.clientY);
			const { x, y } = autoCanvas.fieldToCanvas(waypoint.x, waypoint.y);

			switch (transformMode) {
				case TransformMode.Translate:
					const { x: targetX, y: targetY } = autoCanvas.canvasToField(canvasX, canvasY);
					if (preview) {
						preview.x = targetX;
						preview.y = targetY;
					} else {
						preview = {
							...waypoint,
							x: targetX,
							y: targetY
						};
					}
					break;
				case TransformMode.Rotate:
					const psi = autoCanvas.canvasToFieldAngle(Math.atan2(canvasY - y, canvasX - x));
					if (preview) {
						preview.psi = psi;
					} else {
						preview = {
							...waypoint,
							psi
						};
					}
					break;
				case TransformMode.RotateHeading:
					const th = autoCanvas.canvasToFieldAngle(Math.atan2(canvasY - y, canvasX - x));
					if (preview) {
						preview.th = th;
					} else {
						preview = {
							...waypoint,
							th
						};
					}
					break;
			}
		});

		canvas.addEventListener('mouseup', (_: MouseEvent) => {
			console.debug('mouseup on canvas');
			if (waypointToTransformIndex === -1 || !preview) return;
			auto.paths[pathToTransformIndex].waypoints[waypointToTransformIndex] = preview;
			preview = null;
			waypointToTransformIndex = -1;
			updateAuto(pathToTransformIndex);
		});
	});
</script>

<div class="relative">
	<img
		class="min-w-[64rem]"
		src={fieldImg}
		alt="Top down render of FRC game field inside the field perimeter"
	/>

	<!-- Same dimensions as field-image.png -->
	<canvas
		bind:this={canvas}
		width={canvasWidth}
		height={canvasHeight}
		class="absolute min-w-[64rem] w-full h-full top-0 z-10"
	/>
</div>
