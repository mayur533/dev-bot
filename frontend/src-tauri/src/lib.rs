use std::path::PathBuf;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn create_project_folder(project_path: &str, project_name: &str) -> Result<String, String> {
    use std::fs;
    
    let full_path = PathBuf::from(project_path).join(project_name);
    
    match fs::create_dir_all(&full_path) {
        Ok(_) => Ok(full_path.to_string_lossy().to_string()),
        Err(e) => Err(format!("Failed to create project folder: {}", e)),
    }
}

#[tauri::command]
async fn validate_project_folder(project_path: &str) -> Result<bool, String> {
    use std::fs;
    
    let path = PathBuf::from(project_path);
    
    // Check if path exists and is a directory
    match fs::metadata(&path) {
        Ok(metadata) => {
            if metadata.is_dir() {
                Ok(true)
            } else {
                Err("Selected path is not a directory".to_string())
            }
        }
        Err(_) => Err("Directory does not exist".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, create_project_folder, validate_project_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
