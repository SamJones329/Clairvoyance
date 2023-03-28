use crate::geometry::{Pose2d, Translation2d, Rotation2d, Transform2d};
use crate::trajectory::TrajectoryConfig;

use super::{Spline, Trajectory, trajectory_parameterizer};
use super::spline_helper::quintic_splines_from_waypoints;
use super::spline_parameterizer::{PoseWithCurvature, self, MalformedSplineError};

pub fn spline_points_from_splines<const degree: usize>(splines: &Vec<Spline<degree>>) -> Result<Vec<PoseWithCurvature>, MalformedSplineError> {
    // Create the vector of spline points.
    let mut spline_points = Vec::<PoseWithCurvature>::new();

    // Add the first point to the vector.
    spline_points.push(splines[0].get_point(0.));

    // Iterate through the vector and parameterize each spline, adding the
    // parameterized points to the final vector.
    for spline in splines {
        let points = spline_parameterizer::parameterize(&spline);

        // Append the array of poses to the vector. We are removing the first
        // point because it's a duplicate of the last point from the previous
        // spline.
        if points.is_ok() {
            spline_points.append(&mut points.unwrap());
        } else {
            return Err(points.unwrap_err());
        }
    }

    Ok(spline_points)
}

/**
 * Generates a trajectory from the given waypoints and config. This method
 * uses quintic hermite splines -- therefore, all points must be represented
 * by Pose2d objects. Continuous curvature is guaranteed in this method.
 *
 * @param waypoints List of waypoints..
 * @param config    The configuration for the trajectory.
 * @return The generated trajectory.
 */
pub fn generate_trajectory(waypoints: Vec<Pose2d>, config: TrajectoryConfig) -> Trajectory {
    
    let mut new_waypoints = waypoints.to_vec();
    // auto newWaypoints = waypoints;
    let flip = Transform2d::new(Translation2d::default(), Rotation2d::from_degrees(180.));
    if config.reversed {
        for i in 0..new_waypoints.len() {
            new_waypoints[i] = new_waypoints[i].transform_by(&flip);
        }
    }
    let points_result = spline_points_from_splines::<5>(&quintic_splines_from_waypoints(new_waypoints));
    if points_result.is_err() {
        return Trajectory::do_nothing();
    }
    let mut points = points_result.unwrap();
  
    // After trajectory generation, flip theta back so it's relative to the
    // field. Also fix curvature.
    if config.reversed {
        for i in 0..points.len() {
            points[i] = (points[i].0.transform_by(&flip), -points[i].1)
        }
    }
  
    let result = trajectory_parameterizer::time_parameterize_trajectory(
        &points, config.constraints, config.start_velocity,
        config.end_velocity, config.max_velocity, config.max_acceleration,
        config.reversed);
    if result.is_err() {

        return Trajectory::do_nothing();
    }
    result.unwrap()
}