import { degreesToRadians, radiansToDegrees, parseAndRound } from '$lib/scripts/math';
import { camelCaseToTitleCase, toCamelCase } from '$lib/scripts/text-manipulation';

interface Pose {
	translation: {
		x: number;
		y: number;
	};
	rotation: {
		radians: number;
	};
}

interface SwerveTrajectoryWaypoint {
	/** X value of waypoint in meters */
	x: number;
	/** Y value of waypoint in meters */
	y: number;
	/** Heading of waypoint in degrees */
	th: number;
	/** Orientation of waypoint in degrees */
	psi: number;
}

interface TrajectoryRequest {
	poses: Pose[];
	config: {
		startVelocity: number;
		endVelocity: number;
		maxVelocity: number;
		maxAcceleration: number;
		reversed: boolean;
	};
}

interface TrajectoryState {
	time: number;
	velocity: number;
	acceleration: number;
	pose: Pose;
	curvature: number;
}

interface TrajectoryResponse {
	states: TrajectoryState[];
	totalTimeSeconds: number;
	initialPose: Pose;
}

interface TrajectoryConfig {
	startVelocity: number;
	endVelocity: number;
	maxVelocity: number;
	maxAcceleration: number;
	reversed: boolean;
}

interface TrajectoryContainer {
	title: string;
	waypoints: SwerveTrajectoryWaypoint[][];
	paths: TrajectoryResponse[];
	drawMask: boolean[];
	config: TrajectoryConfig;
}

function getDoNothingTrajectory() {
	return {
		states: [],
		totalTimeSeconds: 0,
		initialPose: {
			translation: {
				x: 0,
				y: 0
			},
			rotation: {
				radians: 0
			}
		}
	};
}

function getDefaultPath(): TrajectoryContainer {
	return {
		title: 'Default',
		waypoints: [
			[
				{
					x: 1,
					y: 1,
					th: 0,
					psi: 0
				},
				{
					x: 2,
					y: 2,
					th: 0,
					psi: 0
				}
			]
		],
		paths: [getDoNothingTrajectory()],
		drawMask: [true],
		config: getDefaultTrajectoryConfig()
	};
}

function getDefaultTrajectoryConfig(): TrajectoryConfig {
	return {
		startVelocity: 0,
		endVelocity: 0,
		maxVelocity: 4.5,
		maxAcceleration: 3.5,
		reversed: false
	};
}

function waypointsToPoses(waypoints: SwerveTrajectoryWaypoint[]) {
	return waypoints.map((waypoint) => {
		return {
			translation: {
				x: waypoint.x,
				y: waypoint.y
			},
			rotation: {
				radians: degreesToRadians(waypoint.th)
			}
		} as Pose;
	});
}

async function fetchPath(
	waypoints: SwerveTrajectoryWaypoint[],
	config: TrajectoryConfig
): Promise<TrajectoryResponse> {
	if (waypoints.length < 2) {
		return new Promise((resolve) => resolve(getDoNothingTrajectory()));
	}
	const { startVelocity, endVelocity, maxVelocity, maxAcceleration, reversed } = config;
	try {
		const response = await fetch(
			'https://trajectoryapi.fly.dev/api/trajectory/trajectoryfrompoints',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				},
				body: JSON.stringify({
					poses: waypointsToPoses(waypoints),
					config: {
						startVelocity,
						endVelocity,
						maxVelocity,
						maxAcceleration,
						reversed
					}
				} as TrajectoryRequest)
			}
		);
		const data = await response.json();
		if (data?.status === 500) {
			console.warn(
				'500 server error from trajectory request, probably have some waypoints too close to one another'
			);
			return getDoNothingTrajectory();
		}
		return data;
	} catch (error) {
		console.error('Error:', error);
		return getDoNothingTrajectory();
	}
}

/**
 * Creates a string representation of the path that is valid Java code.
 * @param points
 * @param name
 * @returns
 */
function pathToString(
	points: SwerveTrajectoryWaypoint[][],
	config: TrajectoryConfig,
	name?: string
) {
	const camelCaseName = toCamelCase(name ?? 'default');
	let output = `public static final TrajectoryConfig ${camelCaseName}Config = new TrajectoryConfig(\n\t${
		config.maxVelocity
	}, ${config.maxAcceleration}\n).setKinematics(Constants.SwerveConstants.SwerveKinematics)${
		config.reversed ? '\n.setReversed(true)' : ''
	};\n`;
	output +=
		(name ? `public static final SwerveTrajectoryWaypoint[] ${camelCaseName} = ` : '') +
		'new SwerveTrajectoryWaypoint[] {';
	for (const pointGroup of points) {
		for (const point of pointGroup) {
			if (!point) output += `\n\tnull,`;
			else
				output += `\n\tnew SwerveTrajectoryWaypoint(\n\t\tnew Translation2d(${point.x}, ${point.y}),\n\t\tRotation2d.fromDegrees(${point.psi}),\n\t\tRotation2d.fromDegrees(${point.th})),`;
		}
		output += '\n\tnull,';
	}
	return output.slice(0, -8) + '\n};\n';
}

/**
 * Given a WPILib angle string, returns the angle in degrees
 * @param angleStr a string containg an angle either in radians, or wrapped in a
 * WPILib rotation2d constructor such as new Rotation2d(angleRadians),
 * Rotation2d.fromDegrees(angleDegrees), or Rotation2d.fromRadians(angleRadians)
 * The string can contain the mathematical operations +, -, *, /, and parentheses,
 * as well as the constants Math.PI and fieldWidth
 */
function parseWpilibAngle(angleStr: string) {
	let angle: number;
	if (/(?:new)?Rotation2d(?:\.fromRadians)?\(/g.test(angleStr)) {
		angleStr = angleStr.slice(angleStr.indexOf('(') + 1, -1);
		angle = radiansToDegrees(parseAndRound(angleStr));
	} else if (/Rotation2d\.fromDegrees/g.test(angleStr)) {
		angleStr = angleStr.slice(angleStr.indexOf('(') + 1, -1);
		angle = parseAndRound(angleStr);
	} else {
		angle = radiansToDegrees(parseAndRound(angleStr));
	}
	return angle;
}

/**
 * Extracts trajectory waypoints from path code of the format generated by @function pathToString
 * @param pathCode
 */
function stringToPaths(pathCode: string): TrajectoryContainer[] {
	const pathCodeWithoutComments = pathCode.replace(/\/\/.*/g, '');
	const paths = pathCodeWithoutComments.match(
		/SwerveTrajectoryWaypoint\s*\[\s*\]\s*\w+\s*=\s*(?:new\s+SwerveTrajectoryWaypoint\[\]\s*)?\{(?:\s|\d|\w|[-+*(),./])+\};/g
	);
	console.log(paths);

	if (!paths) return [];

	console.debug(`%cImporting ${paths.length} Path Groups`, 'color: cyan');

	const points: TrajectoryContainer[] = [];
	for (const path of paths) {
		// remove comments

		let title = path.match(/\s*\w+(?:\w|\d)?(?=\s*=)/g)?.[0].trim() ?? 'noTitleFound';
		title = camelCaseToTitleCase(title);
		const splitPath = path.split(/(?:\s*|,)?\s*new\s*SwerveTrajectoryWaypoint\(\s*/g);
		console.log(splitPath);
		if (!splitPath) {
			console.warn(`%cNo points found for path ${title}`, 'color: yellow');
			continue;
		}
		const ptMatches = [];
		for (const part of splitPath) {
			if (part.includes('=')) continue;
			let cleanPart = part.replace(/null|\s/g, '');
			if (cleanPart.endsWith(')')) cleanPart = cleanPart.slice(0, -1);
			else if (cleanPart.endsWith(')};')) cleanPart = cleanPart.slice(0, -3);
			else if (cleanPart.endsWith('),')) cleanPart = cleanPart.slice(0, -2);
			ptMatches.push(cleanPart.split(','));
			if (part.includes('null')) {
				ptMatches.push(['null']);
			}
		}
		console.log(ptMatches);
		// const ptMatches = pathWithoutComments.matchAll(
		// 	/(?:\s*new\s+SwerveTrajectoryWaypoint\s*\(\s*new\s+Translation2d\s*\((?<translationX>-?\d*\.\d+|\d+\.?)\s*,\s*(?<translationY>-?\d*\.\d+|\d+\.?)\s*\)\s*,\s*(?<orientation_constructor>Rotation2d\.fromDegrees|new\s+Rotation2d|Rotation2d\.fromRadians)\s*\((?<orientation>-?\d*\.\d+|\d+\.?)\s*\)\s*,\s*(?<heading_constructor>Rotation2d\.fromDegrees|new\s+Rotation2d|Rotation2d\.fromRadians)\s*\((?<heading>-?\d*\.\d+|\d+\.?)\s*\)\s*\)|null)+/g
		// );
		const waypoints: SwerveTrajectoryWaypoint[][] = [];
		let curPts: SwerveTrajectoryWaypoint[] = [];
		for (const point of ptMatches) {
			console.log(point);
			if (point[0] === 'null') {
				console.debug(`%cGot a subpath with ${curPts.length} points`, 'color: white');
				waypoints.push(curPts);
				curPts = [];
				continue;
			}

			if (point.length !== 4) {
				console.warn(`%cGot a point with ${point.length} values`, 'color: yellow');
				continue;
			}

			const x = parseAndRound(point[0]);
			const y = parseAndRound(point[1]);
			const psi = parseWpilibAngle(point[2]);
			const th = parseWpilibAngle(point[3]);

			curPts.push({
				x,
				y,
				th,
				psi
			});
		}
		if (curPts.length > 0) {
			waypoints.push(curPts);
			console.debug(`%cGot a subpath with ${curPts.length} points`, 'color: white');
		}
		points.push({
			title,
			waypoints,
			paths: [],
			drawMask: waypoints.map(() => true),
			config: getDefaultTrajectoryConfig()
		});
	}
	return points;
}

export {
	waypointsToPoses,
	fetchPath,
	pathToString,
	stringToPaths,
	getDefaultPath,
	getDefaultTrajectoryConfig,
	getDoNothingTrajectory,
	type TrajectoryState,
	type TrajectoryRequest,
	type TrajectoryResponse,
	type Pose,
	type SwerveTrajectoryWaypoint,
	type TrajectoryContainer,
	type TrajectoryConfig
};
