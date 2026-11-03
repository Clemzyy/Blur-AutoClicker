use std::io;

const APP_NAME: &str = "BlurAutoClicker";
const RUN_KEY: &str = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run";

pub fn get_autostart_enabled() -> bool {
    if crate::portable::is_portable() {
        return false;
    }
    use winreg::enums::HKEY_CURRENT_USER;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let Ok(run_key) = hkcu.open_subkey(RUN_KEY) else {
        return false;
    };
    let Ok(value) = run_key.get_value::<String, _>(APP_NAME) else {
        return false;
    };
    // An entry left by another copy of the app (moved, reinstalled elsewhere)
    // would start that copy, not this one: show it as off so that turning it
    // on rewrites it with this exe.
    let Ok(exe_path) = std::env::current_exe() else {
        return true;
    };
    value.eq_ignore_ascii_case(&autostart_command(&exe_path))
}

fn autostart_command(exe_path: &std::path::Path) -> String {
    format!("\"{}\" --autostart", exe_path.display())
}

pub fn set_autostart_enabled(enabled: bool) -> io::Result<()> {
    if crate::portable::is_portable() {
        log::info!("[Autostart] Skipping registry write in portable mode");
        return Ok(());
    }
    use winreg::enums::{HKEY_CURRENT_USER, KEY_WRITE};
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let run_key = hkcu.open_subkey_with_flags(RUN_KEY, KEY_WRITE)?;

    if enabled {
        let exe_path = std::env::current_exe()?;
        run_key.set_value(APP_NAME, &autostart_command(&exe_path))?;
    } else {
        let _ = run_key.delete_value(APP_NAME);
    }

    Ok(())
}
