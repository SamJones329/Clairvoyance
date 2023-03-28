#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use geometry::Pose2d;
use serde::ser::SerializeStruct;
use trajectory::{Trajectory, trajectory_generator::generate_trajectory, TrajectoryConfig, TrajectoryState, TrajectoryConfigNoConstraints};

mod geometry;
mod trajectory;

#[tauri::command]
fn test_for_tauri() -> bool {
  println!("Hello from tauri!");
  return true;
}

// impl serde::Serialize for Pose2d {
//     fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
//     where
//         S: serde::Serializer {
//         let mut obj = serializer.serialize_struct("pose", 3)?;
//         obj.serialize_field("x", &self.translation().x());
//         obj.serialize_field("y", &self.translation().y());
//         obj.serialize_field("th", &self.rotation().radians());
//         obj.end()
//     }
// }
// impl serde::Serialize for TrajectoryState {
//     fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
//     where
//         S: serde::Serializer {
//         let mut obj = serializer.serialize_struct("state", 5)?;
//         obj.serialize_field("time", &self.t);
//         obj.serialize_field("velocity", &self.velocity);
//         obj.serialize_field("acceleration", &self.acceleration);
//         obj.serialize_field("pose", &self.pose);
//         obj.serialize_field("curvature", &self.curvature);
//         obj.end()
//     }
// }
// impl serde::Serialize for Trajectory {
//     fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
//     where
//         S: serde::Serializer {
//       let mut obj = serializer.serialize_struct("trajectory", 2)?;
//       obj.serialize_field("states", self.states());
//       obj.serialize_field("totalTimeSeconds", self.total_time());
//       obj.serialize_field("initialPose", self.init_pose());

//       obj.end()
//     }
// }
// impl serde::Deserialize for Pose2d {
//     fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
//     where
//         D: serde::Deserializer<'de> {
//         deserializer.deserialize_struct("pose", fields, visitor)
//     }
// }
#[tauri::command]
fn generate_trajectory_tauri(waypoints: Vec<Pose2d>, config: TrajectoryConfigNoConstraints) -> Trajectory {
  println!("Generating trajectory...");
  generate_trajectory(waypoints, config.to_trajectory_config())
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![test_for_tauri, generate_trajectory_tauri])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
