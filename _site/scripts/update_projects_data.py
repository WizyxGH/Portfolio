
import json
import os
from PIL import Image

# Configuration paths
PROJECTS_FILE = r'c:\Users\starl\Documents\Projets\Portfolio\_data\projects.json'
IMAGE_BASE_PATH = r'c:\Users\starl\Documents\Projets\Portfolio'

# Icon Mapping
TECH_ICONS = {
    'React': 'bx bxl-react',
    'Vue.js': 'bx bxl-vuejs',
    'Figma': 'bx bxl-figma',
    'WordPress': 'bx bxl-wordpress',
    'HTML': 'bx bxl-html5',
    'CSS': 'bx bxl-css3',
    'JavaScript': 'bx bxl-javascript',
    'Tailwind CSS': 'bx bxl-tailwind-css',
    'Python': 'bx bxl-python',
    'PHP': 'bx bxl-php',
    'SQL': 'bx bxl-postgresql',
    'IA': 'bx bx-brain',
    'Three.js': 'bx bx-cube',
    'Blender': 'bx bxl-blender',
    'Adobe Premiere': 'bx bxs-video',
    'Adobe After Effects': 'bx bxs-movie-play',
    'Adobe Illustrator': 'bx bxs-pen',
    'Adobe Photoshop': 'bx bxl-adobe',
    'Svelte': 'bx bxl-svelte',
    'Next.js': 'bx bxl-react', # Often uses React logo or similar
    'Node.js': 'bx bxl-nodejs',
    'Git': 'bx bxl-git',
    'Sass': 'bx bxl-sass',
    'Bootstrap': 'bx bxl-bootstrap',
    'Angular': 'bx bxl-angular'
}

DEFAULT_ICON = 'bx bx-code-alt'

def update_projects():
    if not os.path.exists(PROJECTS_FILE):
        print(f"Error: File not found at {PROJECTS_FILE}")
        return

    with open(PROJECTS_FILE, 'r', encoding='utf-8') as f:
        projects = json.load(f)

    updated_projects = []
    
    for project in projects:
        # 1. Update Technologies
        if 'technologies' in project:
            new_techs = []
            for tech in project['technologies']:
                if isinstance(tech, str):
                    icon = TECH_ICONS.get(tech, DEFAULT_ICON)
                    new_techs.append({'name': tech, 'icon': icon})
                else:
                    # Already an object, maybe update icon if missing?
                    if 'icon' not in tech:
                         tech['icon'] = TECH_ICONS.get(tech.get('name'), DEFAULT_ICON)
                    new_techs.append(tech)
            project['technologies'] = new_techs

        # 2. Update Image Dimensions
        if 'image' in project:
            img_rel_path = project['image']
            # Remove {{ site.baseurl }} if present (simple check)
            if img_rel_path.startswith('{{ site.baseurl }}'):
                img_rel_path = img_rel_path.replace('{{ site.baseurl }}', '')
            
            # Construct absolute path
            # Assuming img_rel_path starts with /, remove it for path join
            clean_path = img_rel_path.lstrip('/')
            img_abs_path = os.path.join(IMAGE_BASE_PATH, clean_path)

            if os.path.exists(img_abs_path):
                try:
                    with Image.open(img_abs_path) as img:
                        width, height = img.size
                        project['width'] = width
                        project['height'] = height
                        print(f"Updated dimensions for {project['title']}: {width}x{height}")
                except Exception as e:
                    print(f"Error reading image {img_abs_path}: {e}")
            else:
                print(f"Image not found: {img_abs_path}")

        updated_projects.append(project)

    with open(PROJECTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated_projects, f, indent=4, ensure_ascii=False)
    
    print("Projects updated successfully.")

if __name__ == "__main__":
    update_projects()
