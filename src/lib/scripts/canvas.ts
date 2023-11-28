import type { Auto, Path, Waypoint } from './Trajectory';
import { fieldLengthMeters, fieldWidthMeters } from '$lib/assets/field-data.json';
import { degreesToRadians, radiansToDegrees, roundFloat } from '$lib/scripts/math';

const robotSideLengthMeters = 0.889;
const canvasWidth = 1323;
const canvasHeight = 643;
const cornerRadius = 10;
const robotSideLengthPx = robotSideLengthMeters * (canvasWidth / fieldLengthMeters);
const halfRobotSideLengthPx = robotSideLengthPx / 2;

interface Circle {
	center: { x: number; y: number };
	radius: number;
}

interface Box {
	topLeft: { x: number; y: number };
	bottomRight: { x: number; y: number };
}

class AutoCanvas {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	}

	public draw(auto: Auto, preview: Waypoint | null | undefined) {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		for (const path of auto.paths) {
			for (const waypoint of path.waypoints) {
				if (waypoint.hidden) continue;
				this.drawWaypoint(waypoint);
			}
			this.drawPath(path.path);
		}

		if (preview) {
			this.drawWaypoint(preview);
		}
	}

	private drawWaypoint(waypoint: Waypoint) {
		this.ctx.beginPath();
		this.ctx.strokeStyle = '#f97316';
		this.ctx.lineWidth = 3;
		const { x, y } = this.fieldToCanvas(waypoint.x, waypoint.y);
		if (waypoint.psi != null) {
			this.drawPose(x, y, this.fieldToCanvasAngle(waypoint.psi));
		} else {
			this.drawTranslation(x, y, this.fieldToCanvasAngle(waypoint.th ?? 0));
		}
		this.ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
		this.ctx.fill();
		this.ctx.stroke();

		this.ctx.beginPath();
		this.ctx.strokeStyle = '#38bdf8';
		this.ctx.lineCap = 'round';
		this.drawArrow(x, y, this.fieldToCanvasAngle(waypoint.th ?? 0));
		this.ctx.stroke();
	}

	private drawPose(xPx: number, yPx: number, psiRads: number) {
		this.ctx.translate(xPx, yPx);
		this.ctx.rotate(psiRads);

		this.ctx.moveTo(halfRobotSideLengthPx - cornerRadius, -halfRobotSideLengthPx);
		this.ctx.arc(
			halfRobotSideLengthPx - cornerRadius,
			-halfRobotSideLengthPx + cornerRadius,
			cornerRadius,
			-Math.PI / 2,
			-Math.PI / 6
		);
		this.ctx.arc(halfRobotSideLengthPx + cornerRadius, 0, cornerRadius, -Math.PI / 6, Math.PI / 6);
		this.ctx.arc(
			halfRobotSideLengthPx - cornerRadius,
			halfRobotSideLengthPx - cornerRadius,
			cornerRadius,
			Math.PI / 6,
			Math.PI / 2
		);
		this.ctx.arc(
			-halfRobotSideLengthPx + cornerRadius,
			halfRobotSideLengthPx - cornerRadius,
			cornerRadius,
			Math.PI / 2,
			Math.PI
		);
		this.ctx.arc(
			-halfRobotSideLengthPx + cornerRadius,
			-halfRobotSideLengthPx + cornerRadius,
			cornerRadius,
			Math.PI,
			-Math.PI / 2
		);
		this.ctx.lineTo(halfRobotSideLengthPx - cornerRadius, -halfRobotSideLengthPx);

		this.ctx.rotate(-psiRads);
		this.ctx.translate(-xPx, -yPx);
	}

	private drawTranslation(xPx: number, yPx: number, thRads: number) {
		this.ctx.translate(xPx, yPx);
		this.ctx.rotate(thRads);

		this.ctx.moveTo(halfRobotSideLengthPx - cornerRadius, -halfRobotSideLengthPx);
		this.ctx.arc(
			halfRobotSideLengthPx - cornerRadius,
			-halfRobotSideLengthPx + cornerRadius,
			cornerRadius,
			-Math.PI / 2,
			-Math.PI / 6
		);
		// this.ctx.arc(halfRobotSideLengthPx + cornerRadius, 0, cornerRadius, -Math.PI / 6, Math.PI / 6);
		this.ctx.arc(
			halfRobotSideLengthPx - cornerRadius,
			halfRobotSideLengthPx - cornerRadius,
			cornerRadius,
			Math.PI / 6,
			Math.PI / 2
		);
		this.ctx.arc(
			-halfRobotSideLengthPx + cornerRadius,
			halfRobotSideLengthPx - cornerRadius,
			cornerRadius,
			Math.PI / 2,
			Math.PI
		);
		this.ctx.arc(
			-halfRobotSideLengthPx + cornerRadius,
			-halfRobotSideLengthPx + cornerRadius,
			cornerRadius,
			Math.PI,
			-Math.PI / 2
		);
		this.ctx.lineTo(halfRobotSideLengthPx - cornerRadius, -halfRobotSideLengthPx);

		this.ctx.rotate(-thRads);
		this.ctx.translate(-xPx, -yPx);
	}

	private drawPath(path: Path) {
		if (!path.states.length) {
			console.log('no path');
			return;
		}
		this.ctx.lineWidth = 3;
		// update path
		// ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		this.ctx.moveTo(path.states[0].pose.translation.x, path.states[0].pose.translation.y);
		this.ctx.beginPath();
		this.ctx.strokeStyle = '#2bff79';
		for (const state of path.states) {
			const { x, y } = this.fieldToCanvas(state.pose.translation.x, state.pose.translation.y);
			this.ctx.lineTo(x, y);
		}
		this.ctx.stroke();
	}

	private drawArrow(xPx: number, yPx: number, thetaRads: number) {
		this.ctx.translate(xPx, yPx);
		this.ctx.rotate(thetaRads);

		this.ctx.moveTo(0, 0);
		this.ctx.lineTo(halfRobotSideLengthPx, 0);
		this.ctx.moveTo(halfRobotSideLengthPx, 0);
		this.ctx.lineTo(halfRobotSideLengthPx - cornerRadius, cornerRadius);
		this.ctx.moveTo(halfRobotSideLengthPx, 0);
		this.ctx.lineTo(halfRobotSideLengthPx - cornerRadius, -cornerRadius);

		this.ctx.rotate(-thetaRads);
		this.ctx.translate(-xPx, -yPx);
	}

	public fieldToCanvas(x: number, y: number): { x: number; y: number } {
		if (!this.canvas) return { x: 0, y: 0 };
		return {
			x: x * (this.canvas.width / fieldLengthMeters),
			y: this.canvas.height - y * (this.canvas.height / fieldWidthMeters)
		};
	}

	public canvasToField(x: number, y: number): { x: number; y: number } {
		return {
			x: roundFloat(x * (fieldLengthMeters / this.canvas.width), 3),
			y: roundFloat((this.canvas.height - y) * (fieldWidthMeters / this.canvas.height), 3)
		};
	}

	/**
	 *
	 * @param angleRadians Canvas angle in radians (CW+)
	 * @returns Field angle in degrees (CCW+)
	 */
	public canvasToFieldAngle(angleRadians: number) {
		return roundFloat(-radiansToDegrees(angleRadians), 3);
	}

	/**
	 *
	 * @param angleDegrees Field angle in degrees (CCW+)
	 * @returns Canvas angle in radians (CW+)
	 */
	public fieldToCanvasAngle(angleDegrees: number) {
		return roundFloat(-degreesToRadians(angleDegrees), 3);
	}

	public clientToCanvasCoords(clientX: number, clientY: number) {
		const canvasBounds = this.canvas.getBoundingClientRect();
		return [
			((clientX - canvasBounds.left + this.canvas.scrollLeft) / canvasBounds.width) * canvasWidth,
			((clientY - canvasBounds.top + this.canvas.scrollTop) / canvasBounds.height) * canvasHeight // TODO for some reason goes ~0.43 above 643 but whatever
		];
	}

	/**
	 * Get waypoint bound boxes for waypoints on this canvas
	 * @param auto The auto to get the bound boxes for
	 * @returns A 2D array of bound boxes for each waypoint in each path,
	 * where bounds[i][j] is the bound box for the jth waypoint in the ith
	 * path (auto.paths[i].waypoints[j])
	 */
	public getWaypointBoundBoxes(
		auto: Auto
	): { translationBox: Box; rotationCircle: Circle; headingCircle: Circle }[][] {
		const bounds = [];
		for (const path of auto.paths) {
			bounds.push(
				path.waypoints.map((waypoint) => {
					if (waypoint.hidden)
						return {
							translationBox: {
								topLeft: {
									x: 0,
									y: 0
								},
								bottomRight: {
									x: 0,
									y: 0
								}
							},
							rotationCircle: {
								center: { x: 0, y: 0 },
								radius: 0
							},
							headingCircle: {
								center: { x: 0, y: 0 },
								radius: 0
							}
						};
					const pxFieldCoords = this.fieldToCanvas(waypoint.x, waypoint.y); // should be center?
					const bounds = {
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
							center: { x: 0, y: 0 },
							radius: 0
						},
						headingCircle: {
							center: { x: 0, y: 0 },
							radius: 0
						}
					};

					if (waypoint.psi != null) {
						const psiRads = degreesToRadians(-waypoint.psi);
						bounds.rotationCircle.center.x =
							pxFieldCoords.x + (halfRobotSideLengthPx + cornerRadius) * Math.cos(psiRads);
						bounds.rotationCircle.center.y =
							pxFieldCoords.y + (halfRobotSideLengthPx + cornerRadius) * Math.sin(psiRads);
						bounds.rotationCircle.radius = cornerRadius;
					}

					if (waypoint.th != null) {
						const thRads = degreesToRadians(-waypoint.th);
						bounds.headingCircle.center.x =
							pxFieldCoords.x + (halfRobotSideLengthPx - cornerRadius) * Math.cos(thRads);
						bounds.headingCircle.center.y =
							pxFieldCoords.y + (halfRobotSideLengthPx - cornerRadius) * Math.sin(thRads);
						bounds.headingCircle.radius = cornerRadius;
					}

					return bounds;
				})
			);
		}
		return bounds;
	}

	public isPointInCircle(canvasX: number, canvasY: number, circle: Circle) {
		return (
			Math.sqrt(Math.pow(canvasX - circle.center.x, 2) + Math.pow(canvasY - circle.center.y, 2)) <=
			circle.radius
		);
	}

	public isPointInBox(canvasX: number, canvasY: number, box: Box) {
		return (
			canvasX >= box.topLeft.x &&
			canvasX <= box.bottomRight.x &&
			canvasY >= box.topLeft.y &&
			canvasY <= box.bottomRight.y
		);
	}
}

export default AutoCanvas;

export { AutoCanvas, canvasWidth, canvasHeight };
