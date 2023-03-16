<script lang="ts">
	import fieldImg from '$lib/assets/field-image.png';
	import { degreesToRadians, radiansToDegrees } from '$lib/scripts/math';
	import type { SwerveTrajectoryWaypoint, TrajectoryResponse } from '$lib/scripts/TrajectoryTypes';
	import { onMount, afterUpdate } from 'svelte';

	enum TransformMode {
		Translate,
		Rotate,
		RotateHeading
	}

	// constants
	const fieldLengthMeters = 16.4846;
	const fieldWidthMeters = 8.1026;
	const robotSideLengthMeters = 0.889;
	const canvasWidth = 1323;
	const canvasHeight = 643;
	const robotSideLengthPx = robotSideLengthMeters * (canvasWidth / fieldLengthMeters);
	const halfRobotSideLengthPx = robotSideLengthPx / 2;
	const coreRadius = 10;

	// state variables
	export let waypoints: SwerveTrajectoryWaypoint[];
	export let path: TrajectoryResponse;
	export let triggerWaypointUpdate: () => void;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let waypointToTransformIndex = -1;
	let transformMode: TransformMode = TransformMode.Translate;
	let targetValue: number[];

	// state variable reactions
	$: waypointBoundBoxes = getWaypointBoundBoxes(waypoints);
	$: drawPath(path, waypoints, targetValue);

	// helper functions
	function getWaypointBoundBoxes(waypoints: SwerveTrajectoryWaypoint[]) {
		console.log('updating bounds');
		console.log(waypoints);
		const bounds = [];
		for (const waypoint of waypoints) {
			const pxFieldCoords = fieldToCanvas(waypoint.x, waypoint.y); // should be center?
			const psiRads = degreesToRadians(-waypoint.psi);
			const thRads = degreesToRadians(-waypoint.th);
			bounds.push({
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
			});
		}
		console.log(bounds);
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
			((clientY - canvasBounds.top) / canvasBounds.height) * canvasHeight // TODO for some reason goes ~0.43 above 643 but whatever
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
		waypoints: SwerveTrajectoryWaypoint[],
		previewTarget: number[]
	) {
		console.log('drawing path');
		if (ctx) {
			// update path
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.beginPath();
			ctx.strokeStyle = '#2bff79';
			let count = 0;
			for (const state of path.states) {
				count++;
				const fieldCoord = fieldToCanvas(state.pose.translation.x, state.pose.translation.y);
				ctx.arc(fieldCoord.x, fieldCoord.y, 2, 0, 2 * Math.PI);
			}
			ctx.stroke();
			console.log(`counted ${count} states`);
			ctx.beginPath();
			ctx.strokeStyle = '#f97316';
			const pxFieldCoords = waypoints.map((waypoint) => fieldToCanvas(waypoint.x, waypoint.y));
			waypoints.forEach((waypoint, idx) => {
				drawRobot(pxFieldCoords[idx].x, pxFieldCoords[idx].y, degreesToRadians(-waypoint.psi));
			});

			ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
			ctx.fill();

			// update preview
			if (waypointToTransformIndex !== -1) {
				// assuming targetValue is valid
				switch (transformMode) {
					case TransformMode.Translate:
						const psiRads = degreesToRadians(-waypoints[waypointToTransformIndex].psi);
						drawRobot(previewTarget[0], previewTarget[1], psiRads);
						break;
					case TransformMode.Rotate:
						const pxFieldCoords = fieldToCanvas(
							waypoints[waypointToTransformIndex].x,
							waypoints[waypointToTransformIndex].y
						);
						drawRobot(pxFieldCoords.x, pxFieldCoords.y, previewTarget[0]);
						break;
					case TransformMode.RotateHeading:
						break;
				}
			}
			ctx.stroke();

			ctx.beginPath();
			ctx.strokeStyle = '#38bdf8';
			ctx.lineWidth = 3;
			ctx.lineCap = 'round';
			if (waypointToTransformIndex !== -1 && transformMode === TransformMode.RotateHeading) {
				const pxFieldCoords = fieldToCanvas(
					waypoints[waypointToTransformIndex].x,
					waypoints[waypointToTransformIndex].y
				);
				drawArrow(pxFieldCoords.x, pxFieldCoords.y, previewTarget[0]);
			}
			waypoints.forEach((waypoint, idx) => {
				drawArrow(pxFieldCoords[idx].x, pxFieldCoords[idx].y, degreesToRadians(-waypoint.th));
			});
			ctx.stroke();
		} else {
			console.log("couldn't draw path, no ctx");
		}
	}

	// Runs when component first spins up
	onMount(() => {
		ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
		console.log(`initialPose:`, path.initialPose);

		canvas.addEventListener('mousedown', (ev: MouseEvent) => {
			const [canvasX, canvasY] = clientToCanvasCoords(ev.clientX, ev.clientY);
			console.log(`mousedown on canvas at (${canvasX}, ${canvasY})`);
			let targetWaypointIndex = -1;
			for (let i = 0; i < waypointBoundBoxes.length; i++) {
				const bounds = waypointBoundBoxes[i];
				if (
					// in rotation circle
					Math.sqrt(
						Math.pow(canvasX - bounds.rotationCircle.center.x, 2) +
							Math.pow(canvasY - bounds.rotationCircle.center.y, 2)
					) <= bounds.rotationCircle.radius
				) {
					console.log(`Rotate Waypoint ${i}`);
					targetWaypointIndex = i;
					transformMode = TransformMode.Rotate;
					break;
				} else if (
					// in heading circle
					Math.sqrt(
						Math.pow(canvasX - bounds.headingCircle.center.x, 2) +
							Math.pow(canvasY - bounds.headingCircle.center.y, 2)
					) <= bounds.headingCircle.radius
				) {
					console.log(`Rotate Waypoint Heading ${i}`);
					targetWaypointIndex = i;
					transformMode = TransformMode.RotateHeading;
					break;
				} else if (
					// in translation box
					canvasX >= bounds.translationBox.topLeft.x &&
					canvasX <= bounds.translationBox.bottomRight.x &&
					canvasY >= bounds.translationBox.topLeft.y &&
					canvasY <= bounds.translationBox.bottomRight.y
				) {
					console.log(`Translate Waypoint ${i}`);
					targetWaypointIndex = i;
					transformMode = TransformMode.Translate;
					break;
				}
			}
			if (targetWaypointIndex === -1) console.log("Didn't find waypoint you clicked on");
			waypointToTransformIndex = targetWaypointIndex;
		});

		canvas.addEventListener('mousemove', (ev: MouseEvent) => {
			if (waypointToTransformIndex === -1) return;
			const waypoint = waypoints[waypointToTransformIndex];
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
			console.log('mouseup');
			if (waypointToTransformIndex === -1 || !targetValue) return;
			switch (transformMode) {
				case TransformMode.Translate:
					const newWaypointCoords = canvasToField(targetValue[0], targetValue[1]);
					console.log(
						`waypoint ${waypointToTransformIndex}: (${waypoints[waypointToTransformIndex].x}, ${waypoints[waypointToTransformIndex].y}) -> (${newWaypointCoords.x}, ${newWaypointCoords.y})`
					);
					waypoints[waypointToTransformIndex].x = newWaypointCoords.x;
					waypoints[waypointToTransformIndex].y = newWaypointCoords.y;
					break;
				case TransformMode.Rotate:
					const newWaypointPsi = -radiansToDegrees(targetValue[0]);
					console.log(
						`waypoint ${waypointToTransformIndex} ψ: ${waypoints[waypointToTransformIndex].psi} -> ${newWaypointPsi}`
					);
					waypoints[waypointToTransformIndex].psi = newWaypointPsi;
					break;
				case TransformMode.RotateHeading:
					const newWaypointTh = -radiansToDegrees(targetValue[0]);
					console.log(
						`waypoint ${waypointToTransformIndex} θ: ${waypoints[waypointToTransformIndex].th} -> ${newWaypointTh}`
					);
					waypoints[waypointToTransformIndex].th = newWaypointTh;
					break;
			}
			waypointToTransformIndex = -1;
			waypoints = waypoints;
			triggerWaypointUpdate();
		});

		if (ctx) {
			console.log('drawing');
			ctx.lineWidth = 5;
			drawPath(path, waypoints, targetValue);
		} else {
			console.error('no ctx');
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
