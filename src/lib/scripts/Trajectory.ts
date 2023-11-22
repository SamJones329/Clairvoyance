import { degreesToRadians, radiansToDegrees, parseAndRound } from '$lib/scripts/math';
import { camelCaseToTitleCase, toCamelCase } from '$lib/scripts/text-manipulation';
import { invoke } from '@tauri-apps/api/tauri';

interface RobotConfig {
	/** Width of robot in meters */
	width: number;
	/** Length of robot in meters */
	length: number;
	/** Wheelbase of robot in meters */
	wheelbase: number;
	/** Track width of robot in meters */
	trackWidth: number;
}

/** Autonomous Routine */
interface Auto {
	title: string;
	paths: {
		waypoints: Waypoint[];
		path: Path;
		config: PathConfig;
		hidden: boolean;
	}[];
	config: AutoConfig;
}

interface AutoConfig {
	maxVelocity: number;
	maxAcceleration: number;
	reversed: boolean;
}

interface PathConfig {
	startVelocity?: number;
	endVelocity?: number;
	maxVelocity?: number;
	maxAcceleration?: number;
	reversed?: boolean;
}

interface Waypoint {
	/** X value of waypoint in meters */
	x: number;
	/** Y value of waypoint in meters */
	y: number;
	/** Heading of waypoint in degrees */
	th?: number;
	/** Orientation of waypoint in degrees */
	psi?: number;
	/** Whether the robot should stop at this waypoint, indicates a breakpoint */
	stop?: boolean;
	/** Whether the waypoint is hidden on the UI */
	hidden: boolean;
	/** Command to execute at this waypoint */
	// action: string;
}

interface Pose {
	translation: {
		x: number;
		y: number;
	};
	rotation: {
		radians: number;
	};
}

interface PathRequest {
	poses: Pose[];
	config: {
		startVelocity: number;
		endVelocity: number;
		maxVelocity: number;
		maxAcceleration: number;
		reversed: boolean;
	};
}

interface PathState {
	time: number;
	velocity: number;
	acceleration: number;
	pose: Pose;
	curvature: number;
}

interface Path {
	states: PathState[];
	totalTimeSeconds: number;
	initialPose: Pose;
}

let ON_TAURI = false;
let getPath = fetchPath;

async function initTauriTrajectoryApi() {
	ON_TAURI =
		(await invoke('test_for_tauri')
			.then((val) => (typeof val === 'boolean' ? val : false))
			.catch((err) => {
				console.error(`Error invoking Tauri: ${err}`);
				return false;
			})) ?? false;
	console.info(
		ON_TAURI
			? 'Was able to invoke tauri function, will use Rust trajectory generation'
			: 'Was not able to invoke tauri function, will use TrajectoryAPI'
	);
	if (ON_TAURI) {
		getPath = (waypoints, config) =>
			invoke<Path>('generate_trajectory_tauri', {
				waypoints: waypointsToPoses(waypoints),
				config: {
					max_acceleration: config.maxAcceleration,
					max_velocity: config.maxVelocity,
					reversed: config.reversed,
					start_velocity: 0,
					end_velocity: 0
				}
			});
	}
}

const onTauri = () => ON_TAURI;

function getDoNothingPath(): Path {
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

function getDefaultAuto(): Auto {
	return {
		title: 'Default',
		paths: [
			{
				waypoints: [
					{
						x: 1,
						y: 1,
						th: 0,
						psi: 0,
						hidden: false
					}
				],
				path: getDoNothingPath(),
				config: {},
				hidden: false
			}
		],
		config: getDefaultAutoConfig()
	};
}

function getDefaultAutoConfig(): AutoConfig {
	return {
		maxVelocity: 4.5,
		maxAcceleration: 3.5,
		reversed: false
	};
}

function waypointsToPoses(waypoints: Waypoint[]) {
	return waypoints.map((waypoint) => {
		return {
			translation: {
				x: waypoint.x,
				y: waypoint.y
			},
			rotation:
				waypoint?.th != null
					? {
							radians: degreesToRadians(waypoint.th)
					  }
					: undefined
		} as Pose;
	});
}

async function fetchPath(waypoints: Waypoint[], config: AutoConfig): Promise<Path> {
	if (waypoints.length < 2) {
		return new Promise((resolve) => resolve(getDoNothingPath()));
	}
	const { maxVelocity, maxAcceleration, reversed } = config;
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
						startVelocity: 0,
						endVelocity: 0,
						maxVelocity,
						maxAcceleration,
						reversed
					}
				} as PathRequest)
			}
		);
		const data = await response.json();
		if (data?.status === 500) {
			console.warn(
				'500 server error from trajectory request, probably have some waypoints too close to one another'
			);
			return getDoNothingPath();
		}
		return data;
	} catch (error) {
		console.error('Error:', error);
		return getDoNothingPath();
	}
}

/**
 * Creates a string representation of the path that is valid Java code.
 * @param points
 * @param name
 * @returns
 */
function pathToString(trajectory: Auto) {
	const { paths, config, title: name } = trajectory;
	const points = paths[0].waypoints;
	const camelCaseName = toCamelCase(name ?? 'default');
	let output = `public static final TrajectoryConfig ${camelCaseName}Config = new TrajectoryConfig(\n\t${
		config.maxVelocity
	}, ${config.maxAcceleration}\n).setKinematics(Constants.SwerveConstants.SwerveKinematics)${
		config.reversed ? '\n.setReversed(true)' : ''
	};\n`;
	output +=
		(name ? `public static final SwerveTrajectoryWaypoint[] ${camelCaseName} = ` : '') +
		'new SwerveTrajectoryWaypoint[] {';
	for (const point of points) {
		// for (const point of pointGroup) {
		if (!point) output += `\n\tnull,`;
		else
			output += `\n\tnew SwerveTrajectoryWaypoint(\n\t\tnew Translation2d(${point.x}, ${point.y}),\n\t\tRotation2d.fromDegrees(${point.psi}),\n\t\tRotation2d.fromDegrees(${point.th})),`;
		// }
		// output += '\n\tnull,';
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
function stringToPaths(pathCode: string): Auto[] {
	const pathCodeWithoutComments = pathCode.replace(/\/\/.*/g, '');
	const paths = pathCodeWithoutComments.match(
		/SwerveTrajectoryWaypoint\s*\[\s*\]\s*\w+\s*=\s*(?:new\s+SwerveTrajectoryWaypoint\[\]\s*)?\{(?:\s|\d|\w|[-+*(),./])+\};/g
	);
	console.log(paths);

	if (!paths) return [];

	console.debug(`%cImporting ${paths.length} Path Groups`, 'color: cyan');

	const points: Auto[] = [];
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
		const waypoints: Waypoint[] = [];
		let curPts = 0;
		for (const point of ptMatches) {
			console.log(point);
			if (point[0] === 'null') {
				console.debug(`%cGot a subpath with ${curPts} points`, 'color: white');
				waypoints[waypoints.length - 1].stop = true;
				curPts = 0;
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

			waypoints.push({
				x,
				y,
				th,
				psi,
				hidden: false
			});
		}
		if (curPts > 0) {
			waypoints[waypoints.length - 1].stop = true;
			console.debug(`%cGot a subpath with ${curPts} points`, 'color: white');
		}
		points.push({
			title,
			paths: [{ waypoints, path: getDoNothingPath(), config: {}, hidden: false }],
			config: getDefaultAutoConfig()
		});
	}
	return points;
}

export {
	initTauriTrajectoryApi,
	onTauri,
	waypointsToPoses,
	getPath,
	pathToString,
	stringToPaths,
	getDefaultAuto,
	getDefaultAutoConfig,
	getDoNothingPath,
	type PathState,
	type PathRequest,
	type Path,
	type Pose,
	type Waypoint,
	type Auto,
	type AutoConfig,
	type RobotConfig
};
