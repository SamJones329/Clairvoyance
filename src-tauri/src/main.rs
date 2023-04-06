#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use geometry::Pose2d;
use trajectory::{Trajectory, trajectory_generator::generate_trajectory, TrajectoryConfigNoConstraints};

mod geometry;
mod trajectory;

#[tauri::command]
fn test_for_tauri() -> bool {
  println!("Hello from tauri!");
  return true;
}

#[tauri::command]
fn generate_trajectory_tauri(waypoints: Vec<Pose2d>, config: TrajectoryConfigNoConstraints) -> Trajectory {
  println!("Generating trajectory with the following parameters:\n\tPath Type: Quintic Hermite Splines\n\tnumPts: {}\n\tMax V(m/s): {}\n\tMax A(m/s/s): {}\n\tStart V(m/s): {}\n\tEnd V(m/s): {}\n\tReversed?: {}", waypoints.len(), config.max_velocity, config.max_acceleration, config.start_velocity, config.end_velocity, config.reversed);
  println!("Points:\n{:?}\n", waypoints);
  generate_trajectory(waypoints, config.to_trajectory_config())
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![test_for_tauri, generate_trajectory_tauri])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
