use ndarray::{Array2, arr2, Array1, arr1, s};
use serde::{Serialize, Deserialize};

use crate::geometry::{Translation2d, Pose2d, Rotation2d};

use self::spline_parameterizer::PoseWithCurvature;

pub struct MinMaxAcceleration {
    pub min_acceleration: f64,
    pub max_acceleration: f64
}

pub trait TrajectoryConstraint {
    fn max_velocity(&self, pose: &Pose2d, curvature: f64, velocity: f64) -> f64;
    fn min_max_acceleration(&self, pose: &Pose2d, curvature: f64, speed: f64) -> MinMaxAcceleration;
}

#[derive(Deserialize)]
pub struct TrajectoryConfigNoConstraints {
    pub max_velocity: f64,
    pub max_acceleration: f64,
    pub start_velocity: f64,
    pub end_velocity: f64,
    pub reversed: bool,
}
impl TrajectoryConfigNoConstraints {
    pub const fn to_trajectory_config(self) -> TrajectoryConfig {
        let mut config = TrajectoryConfig::new(self.max_velocity, self.max_acceleration);
        config.start_velocity = self.start_velocity;
        config.end_velocity = self.end_velocity;
        config.reversed = self.reversed;
        config
    }
}

pub struct TrajectoryConfig {
    pub max_velocity: f64,
    pub max_acceleration: f64,
    pub start_velocity: f64,
    pub end_velocity: f64,
    pub reversed: bool,
    pub constraints: Vec<Box<dyn TrajectoryConstraint>>
}
impl TrajectoryConfig {
    pub const fn new(max_velocity: f64, max_acceleration: f64) -> Self {
        TrajectoryConfig { max_velocity, max_acceleration, 
            start_velocity: 0., 
            end_velocity: 0., 
            reversed: false, 
            constraints: Vec::<Box<dyn TrajectoryConstraint>>::new() }
    }
}

#[derive(Debug)]
pub struct ControlVector<const SIZE: usize> {
    x: [f64; SIZE],
    y: [f64; SIZE]
}
impl<const SIZE: usize> ControlVector<SIZE> {
    fn x(&self) -> &[f64; SIZE] {
        &self.x
    }
    fn y(&self) -> &[f64; SIZE] {
        &self.y
    }
}

pub type QuinticControlVector = ControlVector<3>;
impl QuinticControlVector {
    pub fn from_point_and_scalar(scalar: f64, point: &Pose2d) -> Self {
        Self {
            x: [point.translation().x().clone(), scalar * point.rotation().cos(), 0.0],
            y: [point.translation().y().clone(), scalar * point.rotation().sin(), 0.0]
        }
    }
}

pub fn control_vector_from_arrays(init_vector: [f64; 3], final_vector: [f64; 3]) -> Array1<f64> {
    arr1(&[init_vector[0], init_vector[1], init_vector[2], final_vector[0], final_vector[1], final_vector[2]])
}

fn make_hermite_basis() -> Array2<f64> {
    arr2(
        &[[-06.0, -03.0, -00.5,  06.0, -03.0,  00.5],
         [15.0,  08.0,  01.5, -15.0,  07.0, -01.0],
        [-10.0, -06.0, -01.5,  10.0, -04.0,  00.5],
         [00.0,  00.0,  00.5,  00.0,  00.0,  00.0],
         [00.0,  01.0,  00.0,  00.0,  00.0,  00.0],
         [01.0,  00.0,  00.0,  00.0,  00.0,  00.0]]
    )
}

pub struct Spline<const DEGREE: usize> {
    coefficients: Array2<f64>
}
impl<const DEGREE: usize> Spline<DEGREE> {
    /**
     * Gets the pose and curvature at some point t on the spline.
     *
     * @param t The point t
     * @return The pose and curvature at that point.
     */
    pub fn get_point(&self, t: f64) -> PoseWithCurvature {
        let mut polynomial_bases = Array1::<f64>::zeros(DEGREE+1);

        // Populate the polynomial bases
        let mut i = 0;
        while i <= DEGREE {
            polynomial_bases[i] = t.powf((DEGREE - i) as f64);
            i += 1;
        }

        // This simply multiplies by the coefficients. We need to divide out t some
        // n number of times where n is the derivative we want to take.
        let combined = self.coefficients.dot(&polynomial_bases);

        let dx: f64;
        let dy: f64; 
        let ddx: f64; 
        let ddy: f64;

        // If t = 0, all other terms in the equation cancel out to zero. We can use
        // the last x^0 term in the equation.
        if t == 0.0 {
            dx = self.coefficients[[2, DEGREE - 1]];
            dy = self.coefficients[[3, DEGREE - 1]];
            ddx = self.coefficients[[4, DEGREE - 2]];
            ddy = self.coefficients[[5, DEGREE - 2]];
        } else {
            // Divide out t for first derivative.
            dx = combined[2] / t;
            dy = combined[3] / t;

            // Divide out t for second derivative.
            ddx = combined[4] / t / t;
            ddy = combined[5] / t / t;
        }

        // Find the curvature.
        let curvature =
            (dx * ddy - ddx * dy) / ((dx * dx + dy * dy) * dx.hypot(dy));
        
        let point = (
            Pose2d::new(Translation2d::from_vector(&combined.slice(s![0..2 as i32])), Rotation2d::from_vector(dx, dy)),
            curvature
        );

        point
    }
}

pub type QuinticHermiteSpline = Spline<5>; // 6x6 coefficients
impl QuinticHermiteSpline {
    pub fn new(x_init_control_vector: [f64; 3], x_final_control_vector: [f64; 3], y_init_control_vector: [f64; 3], y_final_control_vector: [f64; 3]) -> Self {
        let hermite = make_hermite_basis();
        let x = control_vector_from_arrays(x_init_control_vector, x_final_control_vector);
        let y = control_vector_from_arrays(y_init_control_vector, y_final_control_vector);
        let mut coefficients = Array2::<f64>::zeros((6,6));
        
        // TODO check this
        coefficients.row_mut(0).assign(&hermite.dot(&x));
        coefficients.row_mut(1).assign(&hermite.dot(&y));

        // Populate Row 2 and Row 3 with the derivatives of the equations above.
        // Then populate row 4 and 5 with the second derivatives.
        let mut i = 0;
        while i < 6 {
            // Here, we are multiplying by (5 - i) to manually take the derivative. The
            // power of the term in index 0 is 5, index 1 is 4 and so on. To find the
            // coefficient of the derivative, we can use the power rule and multiply
            // the existing coefficient by its power.
            let k = 5. - i as f64;
            coefficients[[2,i]] = coefficients[[0,i]] * k;
            coefficients[[3,i]] = coefficients[[1,i]] * k;
            i += 1;
        }

        i = 0;
        while i < 6 {
            // Here, we are multiplying by (4 - i) to manually take the derivative. The
            // power of the term in index 0 is 4, index 1 is 3 and so on. To find the
            // coefficient of the derivative, we can use the power rule and multiply
            // the existing coefficient by its power.
            let k = 4. - i as f64;
            coefficients[[4,i]] = coefficients[[2,i]] * k;
            coefficients[[5,i]] = coefficients[[3,i]] * k;
            i += 1;
        }

        Self {
            coefficients
        }
    }
}

#[derive(Clone, Copy, Serialize, Debug)]
pub struct TrajectoryState {
    pub t: f64,
    pub velocity: f64,
    pub acceleration: f64,
    pub pose: Pose2d,
    pub curvature: f64
}
// impl TrajectoryState { TODO
//     pub fn interpolate(self, end: &Self, i: f64) -> Self {
//         todo!()
//     }
// }

#[derive(Serialize, Debug)]
pub struct Trajectory {
    states: Vec<TrajectoryState>,
    total_time: f64
}
impl Trajectory {
    pub const fn do_nothing() -> Self {
        Self { states: Vec::<TrajectoryState>::new(), total_time: 0. }
    }
    pub fn new(states: Vec<TrajectoryState>) -> Self {
        let last = states.last();
        if last.is_some() {
            let last_time = last.unwrap().t;
            return Self { states, total_time: last_time }
        } else {
            return Self::do_nothing()
        }
    }
    pub const fn total_time(&self) -> &f64 {
        &self.total_time
    }
    pub fn num_states(&self) -> usize {
        self.states.len()
    }
    pub const fn states(&self) -> &Vec<TrajectoryState> {
        &self.states
    }
    pub fn init_pose(&self) -> &Pose2d {
        &self.states[0].pose
    }
}

pub mod spline_helper;
pub mod spline_parameterizer;
pub mod trajectory_generator;
pub mod trajectory_parameterizer;