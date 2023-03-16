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
    waypoints: SwerveTrajectoryWaypoint[];
    path: TrajectoryResponse | null;
}[] = [
    {
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

export {initialPathTables, initialTrajectoryConfig, type TrajectoryState, type TrajectoryRequest, type TrajectoryResponse, type Pose, type SwerveTrajectoryWaypoint}