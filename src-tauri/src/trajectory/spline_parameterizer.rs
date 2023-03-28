use std::fmt;

use crate::geometry::Pose2d;

use super::Spline;

pub type PoseWithCurvature = (Pose2d, f64);

struct StackContents {
    t0: f64,
    t1: f64
}

const MAX_DX: f64 = 0.127;
const MAX_DY: f64 = 0.00127;
const MAX_DTH: f64 = 0.0872;
const MAX_ITERATIONS: i16 = 5000;

#[derive(Debug, Clone)]
pub struct MalformedSplineError;
impl fmt::Display for MalformedSplineError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Could not parameterize a malformed spline. This means that you probably had two or more adjacent waypoints that were very close together with headings in opposing directions.")
    }
}

/**
 * Parameterizes the spline. This method breaks up the spline into various
 * arcs until their dx, dy, and dtheta are within specific tolerances.
 *
 * @param spline The spline to parameterize.
 * @param t0 Starting internal spline parameter. It is recommended to leave
 * this as default.
 * @param t1 Ending internal spline parameter. It is recommended to leave this
 * as default.
 *
 * @return A vector of poses and curvatures that represents various points on
 * the spline.
 */
pub fn parameterize<const dim: usize>(spline: &Spline<dim>) -> Result<Vec<PoseWithCurvature>, MalformedSplineError> {
    const t0: f64 = 0.0;
    const t1: f64 = 0.0;

    let mut spline_points = Vec::<PoseWithCurvature>::new();

    // The parameterization does not add the initial point. Let's add that.
    spline_points.push(spline.get_point(t0));

    // We use an "explicit stack" to simulate recursion, instead of a recursive
    // function call This give us greater control, instead of a stack overflow
    // std::stack<StackContents> stack;
    // stack.emplace(StackContents{t0, t1});
    let mut stack = Vec::<StackContents>::new();

    let mut current: StackContents;
    let mut start: PoseWithCurvature;
    let mut end: PoseWithCurvature;
    let mut iterations = 0;

    while !stack.is_empty() {
      current = stack.pop().unwrap();
      start = spline.get_point(current.t0);
      end = spline.get_point(current.t1);

      let twist = start.0.log(&end.0);

      if twist.dy.abs() > MAX_DY ||
          twist.dx.abs() > MAX_DY ||
          twist.dth.abs() > MAX_DTH {
        stack.push(StackContents{t0: (current.t0 + current.t1) / 2., t1: current.t1});
        stack.push(StackContents{t0: current.t0, t1: (current.t0 + current.t1) / 2.});
      } else {
        spline_points.push(spline.get_point(current.t1));
      }
      
      iterations += 1;
      if iterations >= MAX_ITERATIONS {
        return Err(MalformedSplineError);
      }
    }

    Ok(spline_points)
  }