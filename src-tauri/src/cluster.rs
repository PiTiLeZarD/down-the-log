// DX cluster connections for the desktop build. A cluster is a telnet stream, and neither the webview
// nor the phones can open a raw socket, so each enabled cluster gets a thread here that logs in,
// forwards every line to the webview over a Channel, and reconnects when the link drops. Parsing the
// spots is left to src/lib/utils/spots/cluster.ts, where it's tested.

use serde::Serialize;
use std::collections::HashMap;
use std::io::{ErrorKind, Read, Write};
use std::net::{Shutdown, TcpStream, ToSocketAddrs};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use tauri::ipc::Channel;
use tauri::State;

#[derive(Clone, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum ClusterEvent {
  Status { connected: bool, message: String },
  Line { text: String },
}

struct Connection {
  stop: Arc<AtomicBool>,
  // A second handle on the reader's socket: writing a spot and shutting the link down both happen
  // from command threads while the reader is blocked in read().
  writer: Arc<Mutex<Option<TcpStream>>>,
}

impl Connection {
  fn close(&self) {
    self.stop.store(true, Ordering::SeqCst);
    if let Some(stream) = self.writer.lock().unwrap().as_ref() {
      let _ = stream.shutdown(Shutdown::Both);
    }
  }
}

#[derive(Default)]
pub struct Clusters(Mutex<HashMap<String, Connection>>);

#[tauri::command]
pub fn cluster_connect(
  id: String,
  host: String,
  port: u16,
  login: String,
  password: Option<String>,
  commands: Vec<String>,
  on_event: Channel<ClusterEvent>,
  clusters: State<Clusters>,
) {
  let stop = Arc::new(AtomicBool::new(false));
  let writer = Arc::new(Mutex::new(None));
  let previous = clusters.0.lock().unwrap().insert(id, Connection { stop: stop.clone(), writer: writer.clone() });
  if let Some(previous) = previous {
    previous.close();
  }
  thread::spawn(move || {
    let login = Login { name: &login, password: password.as_deref(), commands: &commands };
    run(&host, port, &login, &on_event, &stop, &writer)
  });
}

#[tauri::command]
pub fn cluster_disconnect(id: String, clusters: State<Clusters>) {
  if let Some(connection) = clusters.0.lock().unwrap().remove(&id) {
    connection.close();
  }
}

#[tauri::command]
pub fn cluster_send(id: String, line: String, clusters: State<Clusters>) -> Result<(), String> {
  let map = clusters.0.lock().unwrap();
  let connection = map.get(&id).ok_or("that cluster isn't connected")?;
  let guard = connection.writer.lock().unwrap();
  let mut stream = guard.as_ref().ok_or("that cluster isn't connected")?;
  stream.write_all(format!("{line}\r\n").as_bytes()).map_err(|e| e.to_string())
}

fn status(on_event: &Channel<ClusterEvent>, connected: bool, message: String) {
  let _ = on_event.send(ClusterEvent::Status { connected, message });
}

// Waits in one-second steps so a disconnect doesn't sit behind the backoff.
fn wait(seconds: u64, stop: &AtomicBool) {
  for _ in 0..seconds {
    if stop.load(Ordering::SeqCst) {
      return;
    }
    thread::sleep(Duration::from_secs(1));
  }
}

// Who to log in as, and what to tell the cluster once logged in: `set/skimmer`, a filter, anything
// it would otherwise forget between connections.
struct Login<'a> {
  name: &'a str,
  password: Option<&'a str>,
  commands: &'a [String],
}

fn run(
  host: &str,
  port: u16,
  login: &Login,
  on_event: &Channel<ClusterEvent>,
  stop: &AtomicBool,
  writer: &Mutex<Option<TcpStream>>,
) {
  let mut delay = 5;
  while !stop.load(Ordering::SeqCst) {
    let started = Instant::now();
    let reason = match session(host, port, login, on_event, stop, writer) {
      Ok(()) => "disconnected".to_string(),
      Err(e) => e,
    };
    *writer.lock().unwrap() = None;
    if stop.load(Ordering::SeqCst) {
      break;
    }
    // A link that stayed up a while dropped for its own reasons; one that keeps failing straight
    // away is backed off up to five minutes so a dead host isn't hammered.
    if started.elapsed() > Duration::from_secs(60) {
      delay = 5;
    }
    status(on_event, false, format!("{reason}, retrying in {delay}s"));
    wait(delay, stop);
    delay = (delay * 2).min(300);
  }
  status(on_event, false, "disconnected".to_string());
}

fn session(
  host: &str,
  port: u16,
  login: &Login,
  on_event: &Channel<ClusterEvent>,
  stop: &AtomicBool,
  writer: &Mutex<Option<TcpStream>>,
) -> Result<(), String> {
  let address = (host, port)
    .to_socket_addrs()
    .map_err(|e| format!("can't resolve {host}: {e}"))?
    .next()
    .ok_or(format!("can't resolve {host}"))?;
  let mut reader = TcpStream::connect_timeout(&address, Duration::from_secs(10)).map_err(|e| e.to_string())?;
  // Short, so the loop notices a disconnect request; a quiet cluster is not an error.
  reader.set_read_timeout(Some(Duration::from_secs(1))).map_err(|e| e.to_string())?;
  let mut stream = reader.try_clone().map_err(|e| e.to_string())?;
  *writer.lock().unwrap() = Some(reader.try_clone().map_err(|e| e.to_string())?);
  status(on_event, true, format!("connected to {host}"));

  let mut prompts = Prompts { login: login.name, password: login.password, logged_in: false, password_sent: false };
  // The commands go once the cluster shows its prompt ("VK4ALE de G6NHU-2 ... dxspider >"); a
  // cluster with no prompt gets them a few seconds after the login instead.
  let mut commands_at: Option<Instant> = None;
  let mut commands_sent = login.commands.is_empty();
  let mut pending: Vec<u8> = Vec::new();
  let mut buffer = [0u8; 4096];
  while !stop.load(Ordering::SeqCst) {
    if !commands_sent && commands_at.is_some_and(|at| Instant::now() >= at) {
      for command in login.commands {
        stream.write_all(format!("{command}\r\n").as_bytes()).map_err(|e| e.to_string())?;
      }
      commands_sent = true;
    }
    let read = match reader.read(&mut buffer) {
      Ok(0) => return Err("closed by the cluster".to_string()),
      Ok(n) => n,
      Err(e) if matches!(e.kind(), ErrorKind::WouldBlock | ErrorKind::TimedOut) => continue,
      Err(e) => return Err(e.to_string()),
    };
    pending.extend(strip_telnet(&buffer[..read]));
    while let Some(end) = pending.iter().position(|&b| b == b'\n') {
      let line: Vec<u8> = pending.drain(..=end).collect();
      let text = String::from_utf8_lossy(&line).trim().to_string();
      if text.is_empty() {
        continue;
      }
      if let Some(reply) = prompts.answer(&text) {
        stream.write_all(reply.as_bytes()).map_err(|e| e.to_string())?;
      }
      commands_at = commands_due(&prompts, &text, commands_at);
      let _ = on_event.send(ClusterEvent::Line { text });
    }
    // Login and password prompts wait on the same line for the answer, with no newline after them.
    let partial = String::from_utf8_lossy(&pending).trim().to_string();
    if let Some(reply) = prompts.answer(&partial) {
      stream.write_all(reply.as_bytes()).map_err(|e| e.to_string())?;
      pending.clear();
    }
    commands_at = commands_due(&prompts, &partial, commands_at);
  }
  let _ = reader.shutdown(Shutdown::Both);
  Ok(())
}

fn commands_due(prompts: &Prompts, text: &str, due: Option<Instant>) -> Option<Instant> {
  if !prompts.logged_in {
    return None;
  }
  if text.ends_with('>') {
    return Some(Instant::now());
  }
  due.or(Some(Instant::now() + Duration::from_secs(5)))
}

struct Prompts<'a> {
  login: &'a str,
  password: Option<&'a str>,
  logged_in: bool,
  password_sent: bool,
}

impl Prompts<'_> {
  // DXSpider asks "login:", CC Cluster "Please enter your call:", AR-Cluster "...callsign:".
  fn answer(&mut self, text: &str) -> Option<String> {
    let lower = text.to_lowercase();
    let asking = lower.ends_with(':') || lower.ends_with('>');
    if !self.logged_in && asking && (lower.contains("login") || lower.contains("call")) {
      self.logged_in = true;
      return Some(format!("{}\r\n", self.login));
    }
    if self.logged_in && !self.password_sent && asking && lower.contains("password") {
      self.password_sent = true;
      return Some(format!("{}\r\n", self.password.unwrap_or("")));
    }
    None
  }
}

// Drops telnet negotiation (IAC sequences) without answering it: every cluster tried works as a
// plain line stream. shortcut: a sequence split across two reads leaks a byte or two into a line;
// keep the parse state across reads if that ever shows up in a spot.
fn strip_telnet(bytes: &[u8]) -> Vec<u8> {
  const IAC: u8 = 255;
  const SB: u8 = 250;
  const SE: u8 = 240;
  let mut out = Vec::with_capacity(bytes.len());
  let mut i = 0;
  while i < bytes.len() {
    if bytes[i] != IAC {
      out.push(bytes[i]);
      i += 1;
      continue;
    }
    match bytes.get(i + 1) {
      Some(&IAC) => {
        out.push(IAC);
        i += 2;
      }
      Some(&SB) => {
        i += 2;
        while i + 1 < bytes.len() && !(bytes[i] == IAC && bytes[i + 1] == SE) {
          i += 1;
        }
        i += 2;
      }
      Some(251..=254) => i += 3,
      _ => i += 2,
    }
  }
  out
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn strips_negotiation_and_keeps_text() {
    assert_eq!(strip_telnet(&[255, 251, 1, b'h', b'i', 255, 255, b'!']), b"hi\xff!".to_vec());
    assert_eq!(strip_telnet(&[b'a', 255, 250, 24, 1, 255, 240, b'b']), b"ab".to_vec());
  }

  #[test]
  fn answers_login_then_password_once() {
    let mut prompts = Prompts { login: "VK2ABC", password: Some("pw"), logged_in: false, password_sent: false };
    assert_eq!(prompts.answer("Hello from the cluster"), None);
    assert_eq!(prompts.answer("Please enter your call:").as_deref(), Some("VK2ABC\r\n"));
    assert_eq!(prompts.answer("login:"), None);
    assert_eq!(prompts.answer("password:").as_deref(), Some("pw\r\n"));
    assert_eq!(prompts.answer("password:"), None);
  }
}
