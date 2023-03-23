import { degreesToRadians } from '$lib/scripts/math';
import { toCamelCase } from './text-manipulation';

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
    x: number,
    /** Y value of waypoint in meters */
    y: number,
    /** Heading of waypoint in degrees */
    th: number,
    /** Orientation of waypoint in degrees */
    psi: number
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

interface TrajectoryContainer {
    title: string,
    waypoints: SwerveTrajectoryWaypoint[],
    path: TrajectoryResponse | null;
}

const initialPathTables: TrajectoryContainer[] = [
    {
        title: "Default",
        waypoints: [
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
        ],
        path: null
    },
    {
        title: "Default",
        waypoints: [
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
        ],
        path: null
    },
    {
        title: "Default",
        waypoints: [
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
        ],
        path: null
    },
    {
        title: "Default",
        waypoints: [
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
        ],
        path: null
    },
    {
        title: "Default",
        waypoints: [
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
        ],
        path: null
    }
];

const initialTrajectoryConfig = {
    startVelocity: 0,
        endVelocity: 0,
        maxVelocity: 4.5,
        maxAcceleration: 3.5,
        reversed: false
}

async function getPath(
    waypoints: SwerveTrajectoryWaypoint[],
    startVelocity: number,
    endVelocity: number,
    maxVelocity: number,
    maxAcceleration: number,
    reversed: boolean
): Promise<TrajectoryResponse | null> {
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
                    poses: waypoints.map((waypoint) => {
                        return {
                            translation: {
                                x: waypoint.x,
                                y: waypoint.y
                            },
                            rotation: {
                                radians: degreesToRadians(waypoint.th)
                            }
                        } as Pose;
                    }),
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
        console.log('got data');
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

/**
 * Creates a string representation of the path that is valid Java code.
 * @param points 
 * @param name 
 * @returns 
 */
function pathToString(points: SwerveTrajectoryWaypoint[], name?: string) {
    let output = (name ? `public static final SwerveTrajectoryWaypoint[] ${toCamelCase(name)} = ` : '') + 'new SwerveTrajectoryWaypoint[] {'
    for(const point of points) {
        output += `\n\tnew SwerveTrajectoryWaypoint(\n\t\tnew Translation2d(${point.x}, ${point.y}),\n\t\tRotation2d.fromDegrees(${point.psi}),\n\t\tRotation2d.fromDegrees(${point.th})),`
    }
    return output.slice(0,-1) + "\n};"
}

/**
 * Extracts trajectory waypoints from path code of the format generated by @function pathToString
 * @param pathCode 
 */
function stringToPaths(pathCode: string): TrajectoryContainer[] {
    const paths = pathCode.match(/\w+\s*=\s*new\s+SwerveTrajectoryWaypoint\[\]\s*\{(?:\s|\w|[(),.])+\};/g)
    console.log(`Found ${paths?.length ?? 0} to import`)
    const points: TrajectoryContainer[] = []
    if(!paths) return points
    for(const path of paths) {
        console.log(path)
        const title = path.match(/(?<=\s*)\w+(?=\s*=)/g)?.[0] ?? "noTitleFound"
        console.log(title)
        const ptMatches = path.matchAll(/(?:\s*new\s+SwerveTrajectoryWaypoint\s*\(\s*new\s+Translation2d\s*\((?<translationX>\d*\.\d+|\d+\.?)\s*,\s*(?<translationY>\d*\.\d+|\d+\.?)\s*\)\s*,\s*(?:Rotation2d\.fromDegrees|new\s+Rotation2d)\s*\((?<orientataion>\d*\.\d+|\d+\.?)\s*\)\s*,\s*(?:Rotation2d\.fromDegrees|new\s+Rotation2d)\s*\((?<heading>\d*\.\d+|\d+\.?)\s*\)\s*\))+/g)
        const waypoints: SwerveTrajectoryWaypoint[] = []
        for(const match of ptMatches) {
            console.log(match)
            if(match.groups)
                waypoints.push({
                    x: parseFloat(match.groups['translationX']),
                    y: parseFloat(match.groups['translationY']),
                    th: parseFloat(match.groups['heading']),
                    psi: parseFloat(match.groups['orientation']),
                })
            else 
                waypoints.push({
                    x: 0,
                    y: 0,
                    th: 0,
                    psi: 0
                })
        }
        console.log(ptMatches)
        points.push({
            title, waypoints, path: null
        })
    }
    return points
}

export {getPath, pathToString, stringToPaths, initialPathTables, initialTrajectoryConfig, type TrajectoryState, type TrajectoryRequest, type TrajectoryResponse, type Pose, type SwerveTrajectoryWaypoint}