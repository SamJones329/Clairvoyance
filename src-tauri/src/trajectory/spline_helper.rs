use crate::geometry::Pose2d;
use crate::trajectory::QuinticHermiteSpline;
use crate::trajectory::QuinticControlVector;

pub fn quintic_splines_from_waypoints(waypoints: Vec<Pose2d>) -> Vec<QuinticHermiteSpline> {
    let mut splines = Vec::<QuinticHermiteSpline>::with_capacity(waypoints.capacity() - 1);
    for i in 0..waypoints.len() {
        let p0 = waypoints[i];
        let p1 = waypoints[i + 1];

        // This just makes the splines look better.
        let scalar = 1.2 * p0.translation().distance_to(p1.translation());

        let control_vector_a = QuinticControlVector::from_point_and_scalar(scalar, &p0);
        let control_vector_b = QuinticControlVector::from_point_and_scalar(scalar, &p1);

        splines.push(QuinticHermiteSpline::new(
            *control_vector_a.x(), 
            *control_vector_b.x(), 
            *control_vector_a.y(), 
            *control_vector_b.y()
        ))
    }
    splines
}