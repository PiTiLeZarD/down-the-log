// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod tqsl;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_notification::init())
    .invoke_handler(tauri::generate_handler![tqsl::tqsl_locations, tqsl::tqsl_upload])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
