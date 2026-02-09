import json
import os
from PIL import Image

# Config
PROJECTS_FILE = r"c:\Users\starl\Documents\Projets\Portfolio\_data\projects.json"
BASE_DIR = r"c:\Users\starl\Documents\Projets\Portfolio"

def update_dimensions():
    with open(PROJECTS_FILE, 'r', encoding='utf-8') as f:
        projects = json.load(f)
    
    updated = False
    for project in projects:
        image_rel_path = project.get('image')
        if not image_rel_path:
            continue
            
        # Clean path (remove leading slash if present for joining)
        if image_rel_path.startswith('/'):
            clean_path = image_rel_path[1:]
        else:
            clean_path = image_rel_path
            
        full_path = os.path.join(BASE_DIR, clean_path.replace('/', os.sep))
        
        if os.path.exists(full_path):
            try:
                with Image.open(full_path) as img:
                    width, height = img.size
                    
                    # Update if missing or changed
                    if project.get('width') != width or project.get('height') != height:
                        project['width'] = width
                        project['height'] = height
                        updated = True
                        print(f"Updated {project['title']}: {width}x{height}")
            except Exception as e:
                print(f"Error processing {full_path}: {e}")
        else:
            print(f"Image not found: {full_path}")

    if updated:
        with open(PROJECTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(projects, f, indent=4, ensure_ascii=False)
        print("projects.json updated successfully.")
    else:
        print("No changes needed for projects.json.")

if __name__ == "__main__":
    update_dimensions()
