use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct FileNode {
    name: String,
    path: String,
    #[serde(rename = "type")]
    node_type: String,
    children: Option<Vec<FileNode>>,
}

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

#[tauri::command]
async fn read_file_content(file_path: &str) -> Result<String, String> {
    use std::fs;
    
    match fs::read_to_string(file_path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[tauri::command]
async fn write_file_content(file_path: &str, content: &str) -> Result<(), String> {
    use std::fs;
    
    match fs::write(file_path, content) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to write file: {}", e)),
    }
}

#[tauri::command]
async fn get_folder_structure(folder_path: &str) -> Result<Vec<FileNode>, String> {
    use std::fs;
    
    fn read_dir_recursive(path: &PathBuf) -> Result<Vec<FileNode>, String> {
        let mut nodes = Vec::new();
        
        let entries = match fs::read_dir(path) {
            Ok(entries) => entries,
            Err(e) => return Err(format!("Failed to read directory: {}", e)),
        };
        
        for entry in entries {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => continue,
            };
            
            let path = entry.path();
            let name = match path.file_name() {
                Some(n) => n.to_string_lossy().to_string(),
                None => continue,
            };
            
            // Skip hidden files and common ignore patterns
            if name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist" {
                continue;
            }
            
            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => continue,
            };
            
            if metadata.is_dir() {
                let children = read_dir_recursive(&path).ok();
                nodes.push(FileNode {
                    name,
                    path: path.to_string_lossy().to_string(),
                    node_type: "folder".to_string(),
                    children,
                });
            } else {
                nodes.push(FileNode {
                    name,
                    path: path.to_string_lossy().to_string(),
                    node_type: "file".to_string(),
                    children: None,
                });
            }
        }
        
        // Sort: folders first, then files, alphabetically
        nodes.sort_by(|a, b| {
            match (&a.node_type == "folder", &b.node_type == "folder") {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
            }
        });
        
        Ok(nodes)
    }
    
    let path = PathBuf::from(folder_path);
    read_dir_recursive(&path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            create_project_folder, 
            validate_project_folder,
            read_file_content,
            write_file_content,
            get_folder_structure
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
