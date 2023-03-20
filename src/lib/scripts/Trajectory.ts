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

const initialPathTables: {
    title: string,
    waypoints: SwerveTrajectoryWaypoint[];
    path: TrajectoryResponse | null;
}[] = [
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

function pathToString(points: SwerveTrajectoryWaypoint[], name?: string) {
    let output = (name ? `public static final ${toCamelCase(name)} = ` : '') + 'new SwerveTrajectoryWaypoint[] {'
    for(const point of points) {
        output += `\n\tnew SwerveTrajectoryWaypoint(\n\t\tnew Translation2d(${point.x}, ${point.y}),\n\t\tRotation2d.fromDegrees(${point.psi}),\n\t\tRotation2d.fromDegrees(${point.th})),`
    }
    return output.slice(0,-1) + "\n};"
}

export {getPath, pathToString, initialPathTables, initialTrajectoryConfig, type TrajectoryState, type TrajectoryRequest, type TrajectoryResponse, type Pose, type SwerveTrajectoryWaypoint}