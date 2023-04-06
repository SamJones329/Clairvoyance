use std::ops::{Add, Sub, Neg};

use ndarray::ArrayView1;
use serde::{Serialize, Deserialize};


#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct Translation2d {
    x: f64,
    y: f64
}
impl Translation2d {
    pub const fn new(x: f64, y: f64) -> Self {
        Self {x,y}
    }
    pub fn from_vector(vector: &ArrayView1<f64>) -> Self {
        Self { x: vector[0], y: vector[1] }
    }
    pub const fn default() -> Self {
        Translation2d::new(0., 0.)
    }
    pub fn rotate_by(self, other: Rotation2d) -> Self {
        Self {
            x: self.x * other.cos() - self.y * other.sin(),
            y: self.x * other.sin() + self.y * other.cos()
        }
    }
    pub const fn x(&self) -> &f64 {
        &self.x
    }
    pub const fn y(&self) -> &f64 {
        &self.y
    }
    pub fn distance_to(self, other: &Translation2d) -> f64 {
        (self.x() - other.x()).hypot(self.y() - other.y())
    }
    pub fn scale_by(self, scalar: f64) -> Self {
        Self { x: self.x * scalar, y: self.y * scalar }
    }
}


impl Add for Translation2d {
    type Output = Self;

    fn add(self, rhs: Self) -> Self::Output {
        Self { x: self.x + rhs.x, y: self.y + rhs.y }
    }
}
impl Sub for Translation2d {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self::Output {
        self + -rhs
    }
}
impl Neg for Translation2d {
    type Output = Self;

    fn neg(self) -> Self::Output {
        Self {x: -self.x, y: -self.y}
    }
}


#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct Rotation2d {
    radians: f64
}
impl Rotation2d {
    pub fn from_degrees(degrees: f64) -> Self {
        Self { radians: degrees.to_radians() }
    }

    pub fn from_vector(x: f64, y: f64) -> Self {
        // const auto magnitude = gcem::hypot(x, y);
        let magnitude = x.hypot(y);
        let sine: f64;
        let cosine: f64;
        if magnitude > 1e-6 {
            sine = y / magnitude;
            cosine = x / magnitude;
        } else { // functionally zero
            sine = 0.0;
            cosine = 1.0;
        }
        Self { 
            radians: sine.atan2(cosine)
        }
    }

    pub const fn default() -> Self {
        Rotation2d{radians: 0.}
    }

    pub fn cos(self) -> f64 {
        self.radians.cos()
    }

    pub fn sin(self) -> f64 {
        self.radians.sin()
    }

    pub fn rotate_by(self, other: &Rotation2d) -> Self {
        Self::from_vector(
            self.cos() * other.cos() - self.sin() * other.sin(), 
            self.cos() * other.sin() + self.sin() * other.cos()
        )
    }

    pub const fn radians(&self) -> &f64 {
        &self.radians
    }
}
impl Add for Rotation2d {
    type Output = Self;

    fn add(self, rhs: Self) -> Self::Output {
        Self {
            radians: self.radians + rhs.radians
        }
    }
}
impl Sub for Rotation2d {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self::Output {
        self.rotate_by(&-rhs)
    }
}
impl Neg for Rotation2d {
    type Output = Self;

    fn neg(self) -> Self::Output {
        Self { radians: -self.radians }
    }
}


#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct Pose2d {
    translation: Translation2d,
    rotation: Rotation2d
}
impl Pose2d {
    pub const fn new(translation: Translation2d, rotation: Rotation2d) -> Self {
        Pose2d { translation, rotation }
    }
    pub const fn default() -> Self {
        Pose2d { translation: Translation2d::default(), rotation: Rotation2d::default() }
    }
    pub fn transform_by(self, other: &Transform2d) -> Self {
        Self {
            translation: self.translation + (other.translation.rotate_by(self.rotation)),
            rotation: other.rotation + self.rotation
        }
    }
    pub const fn translation(&self) -> &Translation2d {
        &self.translation
    }
    pub const fn rotation(&self) -> &Rotation2d {
        &self.rotation
    }
    pub fn relative_to(self, other: &Self) -> Self {
        let transform = Transform2d::between(other, &self);
        // var transform = new Transform2d(other, this);
        // return new Pose2d(transform.getTranslation(), transform.getRotation());
        Pose2d::new(transform.translation().clone(), transform.rotation().clone())
    }
    pub fn log(self, end: &Pose2d) -> Twist2d{
        let transform = end.relative_to(&self);

        let dtheta = transform.rotation().radians;
        let half_dtheta = dtheta / 2.0;

        let cos_minus_one = transform.rotation().cos() - 1.;

        let half_theta_by_tan_of_half_dtheta: f64;
        if cos_minus_one.abs() < 1E-9 {
            half_theta_by_tan_of_half_dtheta = 1.0 - 1.0 / 12.0 * dtheta * dtheta;
        } else {
            half_theta_by_tan_of_half_dtheta = -(half_dtheta * transform.rotation().sin()) / cos_minus_one;
        }

        let translation_part =
            transform
                .translation()
                .rotate_by(Rotation2d::from_vector(half_theta_by_tan_of_half_dtheta, -half_dtheta))
                .scale_by(half_theta_by_tan_of_half_dtheta.hypot(half_dtheta));

        Twist2d{
            dx: translation_part.x,
            dy: translation_part.y,
            dth: dtheta
        }
    }
}


#[derive(Clone, Copy)]
pub struct Transform2d {
    translation: Translation2d,
    rotation: Rotation2d
}
impl Transform2d {
    pub const fn new(translation: Translation2d, rotation: Rotation2d) -> Self {
        Self { translation, rotation }
    }
    pub fn between(start: &Pose2d, end: &Pose2d) -> Self {
        Self { 
            translation: (end.translation().clone() - start.translation().clone()).rotate_by(-start.rotation().clone()), 
            rotation: end.rotation().clone() - start.rotation().clone() }
    }
    pub const fn translation(&self) -> &Translation2d {
        &self.translation
    }
    pub const fn rotation(&self) -> &Rotation2d {
        &self.rotation
    }
}
impl Add for Transform2d {
    type Output = Self;

    fn add(self, rhs: Self) -> Self::Output {
        Self::between(
            &Pose2d::default(), 
            &Pose2d::default().transform_by(&self).transform_by(&rhs)
        )
    }
}

pub struct Twist2d {
    pub dx: f64,
    pub dy: f64,
    pub dth: f64
}