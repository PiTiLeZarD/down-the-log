// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cluster;
mod tqsl;

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::webview::DownloadEvent;
use tauri::WebviewWindowBuilder;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_opener::init())
    .manage(cluster::Clusters::default())
    .invoke_handler(tauri::generate_handler![
      tqsl::tqsl_locations,
      tqsl::tqsl_upload,
      cluster::cluster_connect,
      cluster::cluster_disconnect,
      cluster::cluster_send
    ])
    .setup(|app| {
      // The window is built here rather than from tauri.conf.json ("create": false) so it can take a
      // download handler: the webview saves an export to Downloads with no UI of its own, so the
      // saved file is revealed in Finder / Explorer instead. macOS reports no path on Finished, so
      // the destination chosen on Requested is remembered against the (unique, blob:) URL.
      let pending = Mutex::new(HashMap::<String, PathBuf>::new());
      WebviewWindowBuilder::from_config(app.handle(), &app.config().app.windows[0])?
        .on_download(move |_, event| {
          match event {
            DownloadEvent::Requested { url, destination } => {
              pending.lock().unwrap().insert(url.to_string(), destination.clone());
            }
            DownloadEvent::Finished { url, path, success } => {
              let saved = pending.lock().unwrap().remove(url.as_str());
              if let (true, Some(file)) = (success, path.or(saved)) {
                let _ = tauri_plugin_opener::reveal_item_in_dir(file);
              }
            }
            _ => {}
          }
          true
        })
        .build()?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
