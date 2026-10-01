// LoTW upload through the operator's own TQSL install. The callsign certificate and its key never
// leave TQSL: the webview hands over an ADIF file and a Station Location name, and TQSL signs and
// uploads it in batch mode. A dedicated command rather than tauri-plugin-shell so the webview can
// run this one binary with these flags and nothing else.

use serde::Serialize;
use std::path::PathBuf;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize)]
pub struct Location {
    name: String,
    call: Option<String>,
    dxcc: Option<u32>,
    grid: Option<String>,
}

#[derive(Serialize)]
pub struct UploadResult {
    /// TQSL's exit code, read in src/lib/utils/tqsl.ts.
    code: i32,
    /// stdout and stderr together: TQSL reports per-QSO problems there.
    output: String,
}

fn env_path(key: &str) -> Option<PathBuf> {
    std::env::var_os(key).filter(|v| !v.is_empty()).map(PathBuf::from)
}

// Where TQSL keeps station_data. TQSLDIR overrides it on every platform, as it does for TQSL itself.
fn config_dir() -> Option<PathBuf> {
    if let Some(dir) = env_path("TQSLDIR") {
        return Some(dir);
    }
    if cfg!(windows) {
        env_path("APPDATA").map(|d| d.join("TrustedQSL"))
    } else {
        env_path("HOME").map(|d| d.join(".tqsl"))
    }
}

// The installers put TQSL in the same few places, and none of them adds it to PATH on macOS or
// Windows. Linux packages do, so a bare name is the last resort there.
fn binary() -> Result<PathBuf, String> {
    let mut candidates: Vec<PathBuf> = Vec::new();
    if cfg!(target_os = "macos") {
        candidates.push("/Applications/TrustedQSL/tqsl.app/Contents/MacOS/tqsl".into());
        if let Some(home) = env_path("HOME") {
            candidates.push(home.join("Applications/TrustedQSL/tqsl.app/Contents/MacOS/tqsl"));
        }
    } else if cfg!(windows) {
        for key in ["ProgramFiles(x86)", "ProgramFiles"] {
            if let Some(dir) = env_path(key) {
                candidates.push(dir.join("TrustedQSL").join("tqsl.exe"));
            }
        }
    } else {
        candidates.push("/usr/bin/tqsl".into());
        candidates.push("/usr/local/bin/tqsl".into());
    }
    if let Some(found) = candidates.into_iter().find(|p| p.is_file()) {
        return Ok(found);
    }
    if cfg!(target_os = "linux") {
        return Ok("tqsl".into());
    }
    Err("TQSL is not installed where its installer puts it. Install it from www.arrl.org/tqsl-download.".into())
}

#[tauri::command]
pub fn tqsl_locations() -> Result<Vec<Location>, String> {
    let path = config_dir()
        .ok_or("Could not work out where TQSL keeps its settings.")?
        .join("station_data");
    // No file is no locations yet, not an error: TQSL only writes it once one has been saved.
    let content = match std::fs::read_to_string(&path) {
        Ok(c) => c,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(vec![]),
        Err(e) => return Err(format!("Could not read {}: {e}", path.display())),
    };
    let doc = roxmltree::Document::parse(&content).map_err(|e| format!("TQSL's station_data is not valid XML: {e}"))?;
    let text = |node: roxmltree::Node, tag: &str| {
        node.children()
            .find(|c| c.has_tag_name(tag))
            .and_then(|c| c.text())
            .map(|t| t.trim().to_string())
            .filter(|t| !t.is_empty())
    };
    Ok(doc
        .descendants()
        .filter(|n| n.has_tag_name("StationData"))
        .filter_map(|n| {
            Some(Location {
                name: n.attribute("name")?.to_string(),
                call: text(n, "CALL"),
                dxcc: text(n, "DXCC").and_then(|d| d.parse().ok()),
                grid: text(n, "GRIDSQUARE"),
            })
        })
        .collect())
}

// Async and off to a blocking thread: a sync command runs on the main thread, and a signing and
// upload round trip would freeze the window for as long as LoTW takes to answer.
#[tauri::command]
pub async fn tqsl_upload(adif: String, location: String, callsign: String) -> Result<UploadResult, String> {
    tauri::async_runtime::spawn_blocking(move || upload(adif, location, callsign))
        .await
        .map_err(|e| e.to_string())?
}

fn upload(adif: String, location: String, callsign: String) -> Result<UploadResult, String> {
    let tqsl = binary()?;
    let stamp = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0);
    let file = std::env::temp_dir().join(format!("down-the-log-lotw-{}-{stamp}.adi", std::process::id()));
    std::fs::write(&file, adif).map_err(|e| format!("Could not write the log for TQSL: {e}"))?;

    let output = Command::new(&tqsl)
        // -x: batch, exit when done. -d: no date range dialog. -u: upload rather than save a .tq8.
        // -a compliant: skip duplicates and out-of-range QSOs instead of asking.
        // -f update: let each QSO's MY_ fields (grid, state…) override the Station Location, so one
        // location per callsign covers every activation.
        .args(["-x", "-d", "-u", "-a", "compliant", "-f", "update"])
        .arg("-l")
        .arg(&location)
        .arg("-c")
        .arg(&callsign)
        .arg(&file)
        .output();
    let _ = std::fs::remove_file(&file);
    let output = output.map_err(|e| format!("Could not run {}: {e}", tqsl.display()))?;

    let mut text = String::from_utf8_lossy(&output.stdout).into_owned();
    text.push_str(&String::from_utf8_lossy(&output.stderr));
    Ok(UploadResult {
        // No code means TQSL was killed by a signal, which is no upload we can vouch for.
        code: output.status.code().unwrap_or(-1),
        output: text.trim().to_string(),
    })
}
