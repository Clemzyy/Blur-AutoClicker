//! Tracks the input the engine is holding down, so it can be released when a
//! run ends without reaching its own key-up / button-up: app exit while a
//! click is held, or a panic in the worker. Windows does not release input
//! injected with SendInput when the injecting process dies.

use std::sync::atomic::{AtomicU32, Ordering};

use windows_sys::Win32::UI::Input::KeyboardAndMouse::{KEYEVENTF_KEYUP, VK_SHIFT};

use super::keyboard::send_key_event;
use super::mouse::send_mouse_event;

const KEY_HELD: u32 = 1 << 31;
const KEY_SHIFT: u32 = 1 << 16;

/// MOUSEEVENTF_*UP flag of the held button, 0 when none is held.
static HELD_MOUSE_UP: AtomicU32 = AtomicU32::new(0);
/// KEY_HELD | KEY_SHIFT (when Shift was pressed with it) | virtual key.
static HELD_KEY: AtomicU32 = AtomicU32::new(0);

pub fn mouse_pressed(up_flag: u32) {
    HELD_MOUSE_UP.store(up_flag, Ordering::SeqCst);
}

pub fn mouse_released() {
    HELD_MOUSE_UP.store(0, Ordering::SeqCst);
}

pub fn key_pressed(vk: u16, with_shift: bool) {
    let shift = if with_shift { KEY_SHIFT } else { 0 };
    HELD_KEY.store(KEY_HELD | shift | u32::from(vk), Ordering::SeqCst);
}

pub fn key_released() {
    HELD_KEY.store(0, Ordering::SeqCst);
}

/// Sends the up event for anything still held. Safe to call from any thread
/// and more than once: the state is cleared before sending.
pub fn release_held_input() {
    let up_flag = HELD_MOUSE_UP.swap(0, Ordering::SeqCst);
    if up_flag != 0 {
        send_mouse_event(up_flag);
    }
    let key = HELD_KEY.swap(0, Ordering::SeqCst);
    if key & KEY_HELD != 0 {
        send_key_event((key & 0xFFFF) as u16, KEYEVENTF_KEYUP);
        if key & KEY_SHIFT != 0 {
            send_key_event(VK_SHIFT, KEYEVENTF_KEYUP);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn key_state_round_trips_vk_and_shift() {
        key_pressed(0x41, true);
        let key = HELD_KEY.load(Ordering::SeqCst);
        assert_eq!(key & 0xFFFF, 0x41);
        assert_ne!(key & KEY_SHIFT, 0);
        assert_ne!(key & KEY_HELD, 0);
        key_released();
        assert_eq!(HELD_KEY.load(Ordering::SeqCst), 0);
    }
}
