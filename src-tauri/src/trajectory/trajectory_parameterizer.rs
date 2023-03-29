/**
   * Parameterize the trajectory by time. This is where the velocity profile is
   * generated.
   *
   * The derivation of the algorithm used can be found here:
   * <http://www2.informatik.uni-freiburg.de/~lau/students/Sprunk2008.pdf>
   *
   * @param points Reference to the spline points.
   * @param constraints A vector of various velocity and acceleration
   * constraints.
   * @param startVelocity The start velocity for the trajectory.
   * @param endVelocity The end velocity for the trajectory.
   * @param maxVelocity The max velocity for the trajectory.
   * @param maxAcceleration The max acceleration for the trajectory.
   * @param reversed Whether the robot should move backwards. Note that the
   * robot will still move from a -> b -> ... -> z as defined in the waypoints.
   *
   * @return The trajectory.
   */
//   static Trajectory TimeParameterizeTrajectory(
//     const std::vector<PoseWithCurvature>& points,
//     const std::vector<std::unique_ptr<TrajectoryConstraint>>& constraints,
//     units::meters_per_second_t startVelocity,
//     units::meters_per_second_t endVelocity,
//     units::meters_per_second_t maxVelocity,
//     units::meters_per_second_squared_t maxAcceleration, bool reversed);

use std::{fmt, f32::INFINITY};

use super::{Trajectory, spline_parameterizer::PoseWithCurvature, TrajectoryConstraint, TrajectoryState};

const EPSILON: f64 = 1E-6;

/**
 * Represents a constrained state that is used when time parameterizing a
 * trajectory. Each state has the pose, curvature, distance from the start of
 * the trajectory, max velocity, min acceleration and max acceleration.
 */
#[derive(Clone, Copy)]
pub struct ConstrainedState {
    pub pose: PoseWithCurvature,
    pub distance: f64,
    pub max_velocity: f64,
    pub min_acceleration: f64,
    pub max_acceleration: f64
}
impl ConstrainedState {
    pub const fn from_pose(pose: PoseWithCurvature) -> Self {
        Self {
            pose,
            distance: 0.,
            max_velocity: 0.,
            min_acceleration: 0.,
            max_acceleration: 0.
        }
    }
}

#[derive(Debug)]
pub struct ParameterizerError {
    iteration: usize
}
impl fmt::Display for ParameterizerError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Something went wrong at iteration {} of time parameterization.", self.iteration)
    }
}

#[derive(Debug)]
pub struct AccelerationLimitError;
impl fmt::Display for AccelerationLimitError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "The constraint's min acceleration was greater than its max acceleration. To debug this, remove all constraints from the config and add each one individually. If the offending constraint was packaged with WPILib, please file a bug report.")
    }
}

pub fn enforce_acceleration_limits(
    reverse: bool,
    constraints: &Vec<Box<dyn TrajectoryConstraint>>,
    state: &mut ConstrainedState
) -> Result<(), AccelerationLimitError> {
    let mut min_acceleration = f64::NEG_INFINITY;
    let mut max_acceleration = f64::INFINITY;
    for constraint in constraints {
        let factor = if reverse {-1.0} else {1.0};

        let min_max_accel = constraint.min_max_acceleration(
            &state.pose.0, state.pose.1, state.max_velocity * factor);

        if min_max_accel.min_acceleration > min_max_accel.max_acceleration {
            return Err(AccelerationLimitError);
        }

        state.min_acceleration = state.min_acceleration.max(
            if reverse {-min_max_accel.max_acceleration} else {min_max_accel.min_acceleration});

        state.max_acceleration = state.max_acceleration.min(
            if reverse {-min_max_accel.min_acceleration} else {min_max_accel.max_acceleration});
    }
    Ok(())
}

pub fn time_parameterize_trajectory(
    points: &Vec<PoseWithCurvature>, 
    constraints: Vec<Box<dyn TrajectoryConstraint>>, 
    start_velocity: f64, 
    end_velocity: f64, 
    max_velocity: f64, 
    max_acceleration: f64,
    reversed: bool) -> Result<Trajectory, ParameterizerError> {

    let mut constrained_states = Vec::<ConstrainedState>::with_capacity(points.len());

    constrained_states.push(ConstrainedState {
        pose: points.first().unwrap().clone(),
        distance: 0.,
        max_velocity: start_velocity,
        min_acceleration: -max_acceleration,
        max_acceleration
    });
    
    let mut predecessor = 0;
    
    // Forward pass
    for i in 0..points.len() {
        let mut cur_state = ConstrainedState::from_pose(points[i]);
    
        // Begin constraining based on predecessor
        let ds = cur_state.pose.0.translation().distance_to(
            constrained_states[predecessor].pose.0.translation());
        cur_state.distance = ds + constrained_states[predecessor].distance;
    
        // We may need to iterate to find the maximum end velocity and common
        // acceleration, since acceleration limits may be a function of velocity.
        loop {
            // Enforce global max velocity and max reachable velocity by global
            // acceleration limit. v_f = √(v_i² + 2ad).
        
            cur_state.max_velocity = max_velocity.min(
                (
                    constrained_states[predecessor].max_velocity 
                    * constrained_states[predecessor].max_velocity 
                    + constrained_states[predecessor].max_acceleration 
                    * ds * 2.0
                ).sqrt()
            );
        
            cur_state.min_acceleration = -max_acceleration;
            cur_state.max_acceleration = max_acceleration;
        
            // At this point, the constrained state is fully constructed apart from
            // all the custom-defined user constraints.
            for constraint in &constraints {
                cur_state.max_velocity = cur_state.max_velocity.min(
                    constraint.max_velocity(&cur_state.pose.0,
                                            cur_state.pose.1,
                                            max_velocity));
            }
    
            // Now enforce all acceleration limits.
            let accel = enforce_acceleration_limits(reversed, &constraints, &mut cur_state);
            if accel.is_err() {
                return Err(ParameterizerError{iteration: i});
            }
        
            if ds < EPSILON {
                break;
            }
        
            // If the actual acceleration for this state is higher than the max
            // acceleration that we applied, then we need to reduce the max
            // acceleration of the predecessor and try again.
            let actual_acceleration =
                (cur_state.max_velocity * cur_state.max_velocity -
                    constrained_states[predecessor].max_velocity * constrained_states[predecessor].max_velocity) /
                (ds * 2.0);
        
            // If we violate the max acceleration constraint, let's modify the
            // predecessor.
            if cur_state.max_acceleration < actual_acceleration - 1E-6 {
                constrained_states[predecessor].max_acceleration = cur_state.max_acceleration;
            } else {
                // Constrain the predecessor's max acceleration to the current
                // acceleration.
                if actual_acceleration > constrained_states[predecessor].min_acceleration + 1E-6 {
                    constrained_states[predecessor].max_acceleration = actual_acceleration;
                }
                // If the actual acceleration is less than the predecessor's min
                // acceleration, it will be repaired in the backward pass.
                break;
            }
        }
        constrained_states.push(cur_state);
        predecessor = i;
    }
    
    
    // Backward pass
    let last = points.len();
    let mut i = last;
    let mut successor: ConstrainedState = ConstrainedState {
        pose: constrained_states.last().unwrap().pose.clone(),
        distance: constrained_states.last().unwrap().distance,
        max_velocity: end_velocity,
        min_acceleration: -max_acceleration,
        max_acceleration
    };
    while i >= 1 {
        let ds =
            constrained_states[i].distance - successor.distance;  // negative
    
        loop {
            // Enforce max velocity limit (reverse)
            // v_f = √(v_i² + 2ad), where v_i = successor.
            let new_max_velocity = (
                successor.max_velocity 
                * successor.max_velocity 
                + successor.min_acceleration 
                * ds * 2.0
            ).sqrt();
        
            // No more limits to impose! This state can be finalized.
            if new_max_velocity >= constrained_states[i].max_velocity {
                break;
            }
        
            constrained_states[i].max_velocity = new_max_velocity;
        
            // Check all acceleration constraints with the new max velocity.
            let res = enforce_acceleration_limits(reversed, &constraints, &mut constrained_states[i]);
            if res.is_err() {
                return Err(ParameterizerError{iteration: i});
            }

            if ds > -EPSILON {
                break;
            }
        
            // If the actual acceleration for this state is lower than the min
            // acceleration, then we need to lower the min acceleration of the
            // successor and try again.
            let actual_acceleration =
                (constrained_states[i].max_velocity * constrained_states[i].max_velocity -
                    successor.max_velocity * successor.max_velocity) /
                (ds * 2.0);
            if constrained_states[i].min_acceleration > actual_acceleration + 1E-6 {
                constrained_states[last.min(i)].min_acceleration = constrained_states[i].min_acceleration;
            } else {
                constrained_states[last.min(i)].min_acceleration = actual_acceleration;
                break;
            }
        }
        successor = constrained_states[i];
        i -= 1;
    }
    
    // Now we can integrate the constrained states forward in time to obtain our
    // trajectory states.
    
    let mut states = Vec::<TrajectoryState>::with_capacity(points.len());
    let mut t = 0.;
    let mut s = 0.;
    let mut v = 0.;
    
    for i in 0..constrained_states.len() {
        let state = constrained_states[i];
    
        // Calculate the change in position between the current state and the
        // previous state.
        let ds = state.distance - s;
    
        // Calculate the acceleration between the current state and the previous
        // state.
        let accel =
            (state.max_velocity * state.max_velocity - v * v) / (ds * 2.);
    
        // Calculate dt.
        let mut dt = 0.;
        if i > 0 {
            states[i - 1].acceleration = if reversed { -accel } else { accel };
            if accel.abs() > 1E-6 {
                // v_f = v_0 + at
                dt = (state.max_velocity - v) / accel;
            } else if v.abs() > 1E-6 {
                // delta_x = vt
                dt = ds / v;
            } else {
                return Err(ParameterizerError{iteration: i});
            }
        }
    
        v = state.max_velocity;
        s = state.distance;
    
        t += dt;
    
        states.push( TrajectoryState {
            t, 
            velocity: if reversed  {-v} else {v}, 
            acceleration: if reversed {-accel} else {accel},
            pose: state.pose.0, 
            curvature: state.pose.1});
    }
    
    Ok(Trajectory::new(states))
}