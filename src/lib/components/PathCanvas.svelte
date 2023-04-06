<script lang="ts">
	import fieldImg from '$lib/assets/field-image.png';
	import { degreesToRadians, radiansToDegrees, roundFloat } from '$lib/scripts/math';
	import type { SwerveTrajectoryWaypoint, TrajectoryResponse } from '$lib/scripts/Trajectory';
	import { onMount } from 'svelte';
	import { fieldLengthMeters, fieldWidthMeters } from '$lib/assets/field-data.json';

	enum TransformMode {
		Translate,
		Rotate,
		RotateHeading
	}

	// constants
	const robotSideLengthMeters = 0.889;
	const canvasWidth = 1323;
	const canvasHeight = 643;
	const robotSideLengthPx = robotSideLengthMeters * (canvasWidth / fieldLengthMeters);
	const halfRobotSideLengthPx = robotSideLengthPx / 2;
	const coreRadius = 10;

	// state variables
	export let waypoints: SwerveTrajectoryWaypoint[][];
	export let paths: TrajectoryResponse[];
	export let drawMask: boolean[];
	export let triggerWaypointUpdate: (pathsIndex: number) => void;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let waypointGroupToTransformIndex = -1;
	let waypointToTransformIndex = -1;
	let transformMode: TransformMode = TransformMode.Translate;
	let targetValue: number[];

	// state variable reactions
	$: waypointBoundBoxes = getAllWaypointBoundBoxes(waypoints);
	const updatePathDrawings = (
		ctx: CanvasRenderingContext2D,
		paths: TrajectoryResponse[],
		targetValue: number[]
	) => {
		ctx?.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		paths.forEach((path, idx) => {
			drawPath(path, idx, waypoints[idx]);
		});
		drawPreview(targetValue);
	};
	$: updatePathDrawings(ctx, paths, targetValue);

	function getAllWaypointBoundBoxes(allWaypoints: SwerveTrajectoryWaypoint[][]) {
		return allWaypoints.map((waypoints) => getWaypointBoundBoxes(waypoints));
	}

	// helper functions
	function getWaypointBoundBoxes(waypoints: SwerveTrajectoryWaypoint[]) {
		const bounds = waypoints.map((waypoint, idx) => {
			if (!drawMask[idx])
				return {
					translationBox: {
						topLeft: {
							x: -1,
							y: -1
						},
						bottomRight: {
							x: -1,
							y: -1
						}
					},
					rotationCircle: {
						center: {
							x: -1,
							y: -1
						},
						radius: 0
					},
					headingCircle: {
						center: {
							x: -1,
							y: -1
						},
						radius: 0
					}
				};
			const pxFieldCoords = fieldToCanvas(waypoint.x, waypoint.y); // should be center?
			const psiRads = degreesToRadians(-waypoint.psi);
			const thRads = degreesToRadians(-waypoint.th);
			return {
				translationBox: {
					topLeft: {
						x: pxFieldCoords.x - halfRobotSideLengthPx,
						y: pxFieldCoords.y - halfRobotSideLengthPx
					},
					bottomRight: {
						x: pxFieldCoords.x + halfRobotSideLengthPx,
						y: pxFieldCoords.y + halfRobotSideLengthPx
					}
				},
				rotationCircle: {
					center: {
						x: pxFieldCoords.x + (halfRobotSideLengthPx + coreRadius) * Math.cos(psiRads),
						y: pxFieldCoords.y + (halfRobotSideLengthPx + coreRadius) * Math.sin(psiRads)
					},
					radius: coreRadius
				},
				headingCircle: {
					center: {
						x: pxFieldCoords.x + (halfRobotSideLengthPx - coreRadius) * Math.cos(thRads),
						y: pxFieldCoords.y + (halfRobotSideLengthPx - coreRadius) * Math.sin(thRads)
					},
					radius: coreRadius
				}
			};
		});
		return bounds;
	}

	function fieldToCanvas(x: number, y: number): { x: number; y: number } {
		if (!canvas) return { x: 0, y: 0 };
		return {
			x: x * (canvas.width / fieldLengthMeters),
			y: canvas.height - y * (canvas.height / fieldWidthMeters)
		};
	}

	function canvasToField(x: number, y: number): { x: number; y: number } {
		return {
			x: x * (fieldLengthMeters / canvas.width),
			y: (canvas.height - y) * (fieldWidthMeters / canvas.height)
		};
	}

	function clientToCanvasCoords(clientX: number, clientY: number) {
		const canvasBounds = canvas.getBoundingClientRect();
		return [
			((clientX - canvasBounds.left + canvas.scrollLeft) / canvasBounds.width) * canvasWidth,
			((clientY - canvasBounds.top + canvas.scrollTop) / canvasBounds.height) * canvasHeight // TODO for some reason goes ~0.43 above 643 but whatever
		];
	}

	function drawArrow(xPx: number, yPx: number, thetaRads: number) {
		ctx.translate(xPx, yPx);
		ctx.rotate(thetaRads);

		ctx.moveTo(0, 0);
		ctx.lineTo(halfRobotSideLengthPx, 0);
		ctx.moveTo(halfRobotSideLengthPx, 0);
		ctx.lineTo(halfRobotSideLengthPx - coreRadius, coreRadius);
		ctx.moveTo(halfRobotSideLengthPx, 0);
		ctx.lineTo(halfRobotSideLengthPx - coreRadius, -coreRadius);

		ctx.rotate(-thetaRads);
		ctx.translate(-xPx, -yPx);
	}

	function drawRobot(xPx: number, yPx: number, psiRads: number) {
		const cornerRadius = coreRadius;
		ctx.translate(xPx, yPx);
		ctx.rotate(psiRads);

		ctx.moveTo(halfRobotSideLengthPx - cornerRadius, -halfRobotSideLengthPx);
		ctx.arc(
			halfRobotSideLengthPx - cornerRadius,
			-halfRobotSideLengthPx + cornerRadius,
			cornerRadius,
			-Math.PI / 2,
			-Math.PI / 6
		);
		ctx.arc(halfRobotSideLengthPx + cornerRadius, 0, cornerRadius, -Math.PI / 6, Math.PI / 6);
		ctx.arc(
			halfRobotSideLengthPx - cornerRadius,
			halfRobotSideLengthPx - cornerRadius,
			cornerRadius,
			Math.PI / 6,
			Math.PI / 2
		);
		ctx.arc(
			-halfRobotSideLengthPx + cornerRadius,
			halfRobotSideLengthPx - cornerRadius,
			cornerRadius,
			Math.PI / 2,
			Math.PI
		);
		ctx.arc(
			-halfRobotSideLengthPx + cornerRadius,
			-halfRobotSideLengthPx + cornerRadius,
			cornerRadius,
			Math.PI,
			-Math.PI / 2
		);
		ctx.lineTo(halfRobotSideLengthPx - cornerRadius, -halfRobotSideLengthPx);

		ctx.rotate(-psiRads);
		ctx.translate(-xPx, -yPx);
	}

	// State function
	function drawPath(
		path: TrajectoryResponse,
		pathIdx: number,
		waypoints: SwerveTrajectoryWaypoint[]
	) {
		if (!drawMask[pathIdx]) return;
		if (ctx) {
			ctx.lineWidth = 3;
			// update path
			// ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.beginPath();
			ctx.strokeStyle = '#2bff79';
			let count = 0;
			for (const state of path.states) {
				count++;
				const fieldCoord = fieldToCanvas(state.pose.translation.x, state.pose.translation.y);
				ctx.arc(fieldCoord.x, fieldCoord.y, 2, 0, 2 * Math.PI);
			}
			ctx.stroke();
			ctx.beginPath();
			ctx.strokeStyle = '#f97316';
			const pxFieldCoords = waypoints.map((waypoint) => fieldToCanvas(waypoint.x, waypoint.y));
			waypoints.forEach((waypoint, idx) => {
				drawRobot(pxFieldCoords[idx].x, pxFieldCoords[idx].y, degreesToRadians(-waypoint.psi));
			});

			ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
			ctx.fill();
			ctx.stroke();

			ctx.beginPath();
			ctx.strokeStyle = '#38bdf8';
			ctx.lineCap = 'round';
			waypoints.forEach((waypoint, idx) => {
				drawArrow(pxFieldCoords[idx].x, pxFieldCoords[idx].y, degreesToRadians(-waypoint.th));
			});
			ctx.stroke();
		} else {
			console.info("Couldn't draw path, no ctx");
		}
	}

	function drawPreview(previewTarget: number[]) {
		// update preview
		if (waypointGroupToTransformIndex !== -1 && waypointToTransformIndex !== -1) {
			// assuming targetValue is valid
			ctx.beginPath();
			let pxFieldCoords;
			switch (transformMode) {
				case TransformMode.Translate:
					const psiRads = degreesToRadians(
						-waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].psi
					);
					drawRobot(previewTarget[0], previewTarget[1], psiRads);
					ctx.strokeStyle = '#f97316';
					ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
					ctx.fill();
					break;
				case TransformMode.Rotate:
					pxFieldCoords = fieldToCanvas(
						waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].x,
						waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].y
					);
					drawRobot(pxFieldCoords.x, pxFieldCoords.y, previewTarget[0]);
					ctx.strokeStyle = '#f97316';
					ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
					ctx.fill();
					break;
				case TransformMode.RotateHeading:
					pxFieldCoords = fieldToCanvas(
						waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].x,
						waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].y
					);
					ctx.strokeStyle = '#38bdf8';
					ctx.lineWidth = 3;
					ctx.lineCap = 'round';
					drawArrow(pxFieldCoords.x, pxFieldCoords.y, previewTarget[0]);
					break;
			}
			ctx.stroke();
		}
	}

	// Runs when component first spins up
	onMount(() => {
		ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

		canvas.addEventListener('dblclick', (ev: MouseEvent) => {
			const [canvasX, canvasY] = clientToCanvasCoords(ev.clientX, ev.clientY);
			const fieldCoords = canvasToField(canvasX, canvasY);
			waypoints[waypoints.length - 1].push({
				x: fieldCoords.x,
				y: fieldCoords.y,
				psi: 0,
				th: 0
			});
			triggerWaypointUpdate(waypoints.length - 1);
		});

		canvas.addEventListener('mousedown', (ev: MouseEvent) => {
			const [canvasX, canvasY] = clientToCanvasCoords(ev.clientX, ev.clientY);
			console.debug(`mousedown on canvas at (${canvasX}, ${canvasY})`);
			let targetWaypointIndex = -1,
				targetWaypointGroupIndex = -1;
			for (let i = 0; i < waypointBoundBoxes.length; i++) {
				for (let j = 0; j < waypointBoundBoxes[i].length; j++) {
					const bounds = waypointBoundBoxes[i][j];
					if (
						// in rotation circle
						Math.sqrt(
							Math.pow(canvasX - bounds.rotationCircle.center.x, 2) +
								Math.pow(canvasY - bounds.rotationCircle.center.y, 2)
						) <= bounds.rotationCircle.radius
					) {
						console.debug(`Rotate Waypoint ${i} ${j}`);
						targetWaypointGroupIndex = i;
						targetWaypointIndex = j;
						transformMode = TransformMode.Rotate;
						break;
					} else if (
						// in heading circle
						Math.sqrt(
							Math.pow(canvasX - bounds.headingCircle.center.x, 2) +
								Math.pow(canvasY - bounds.headingCircle.center.y, 2)
						) <= bounds.headingCircle.radius
					) {
						console.debug(`Rotate Waypoint Heading ${i} ${j}`);
						targetWaypointGroupIndex = i;
						targetWaypointIndex = j;
						transformMode = TransformMode.RotateHeading;
						break;
					} else if (
						// in translation box
						canvasX >= bounds.translationBox.topLeft.x &&
						canvasX <= bounds.translationBox.bottomRight.x &&
						canvasY >= bounds.translationBox.topLeft.y &&
						canvasY <= bounds.translationBox.bottomRight.y
					) {
						console.debug(`Translate Waypoint ${i}, ${j}`);
						targetWaypointGroupIndex = i;
						targetWaypointIndex = j;
						transformMode = TransformMode.Translate;
						break;
					}
				}
			}
			if (targetWaypointIndex === -1) console.debug("Didn't find waypoint you clicked on");
			waypointToTransformIndex = targetWaypointIndex;
			waypointGroupToTransformIndex = targetWaypointGroupIndex;
		});

		canvas.addEventListener('mousemove', (ev: MouseEvent) => {
			if (waypointToTransformIndex === -1) return;
			const waypoint = waypoints[waypointGroupToTransformIndex][waypointToTransformIndex];
			const canvasCoords = clientToCanvasCoords(ev.clientX, ev.clientY);

			switch (transformMode) {
				case TransformMode.Translate:
					targetValue = canvasCoords;
					break;
				case TransformMode.Rotate:
				case TransformMode.RotateHeading:
					const [canvasX, canvasY] = canvasCoords;
					const { x, y } = fieldToCanvas(waypoint.x, waypoint.y);
					targetValue = [Math.atan2(canvasY - y, canvasX - x)];
					break;
			}
		});

		canvas.addEventListener('mouseup', (ev: MouseEvent) => {
			console.debug('mouseup on canvas');
			if (waypointToTransformIndex === -1 || waypointGroupToTransformIndex === -1 || !targetValue)
				return;
			switch (transformMode) {
				case TransformMode.Translate:
					const newWaypointCoords = canvasToField(targetValue[0], targetValue[1]);
					console.debug(
						`waypoint ${waypointGroupToTransformIndex}, ${waypointToTransformIndex}: (${waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].x}, ${waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].y}) -> (${newWaypointCoords.x}, ${newWaypointCoords.y})`
					);
					waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].x = roundFloat(
						newWaypointCoords.x,
						3
					);
					waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].y = roundFloat(
						newWaypointCoords.y,
						3
					);
					break;
				case TransformMode.Rotate:
					const newWaypointPsi = -radiansToDegrees(targetValue[0]);
					console.debug(
						`waypoint ${waypointGroupToTransformIndex}, ${waypointToTransformIndex} ψ: ${waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].psi} -> ${newWaypointPsi}`
					);
					waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].psi = roundFloat(
						newWaypointPsi,
						3
					);
					break;
				case TransformMode.RotateHeading:
					const newWaypointTh = -radiansToDegrees(targetValue[0]);
					console.debug(
						`waypoint ${waypointGroupToTransformIndex}, ${waypointToTransformIndex} θ: ${waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].th} -> ${newWaypointTh}`
					);
					waypoints[waypointGroupToTransformIndex][waypointToTransformIndex].th = roundFloat(
						newWaypointTh,
						3
					);
					break;
			}
			waypointToTransformIndex = -1;
			waypoints = waypoints;
			triggerWaypointUpdate(waypointGroupToTransformIndex);
			waypointGroupToTransformIndex = -1;
		});

		if (ctx) {
			console.debug('Got rendering context for canvas');
			paths = paths;
		} else {
			console.error('No rendering context for canvas');
		}

		waypoints = waypoints;
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
