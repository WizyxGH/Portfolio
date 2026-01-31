import json

# Read the current projects.json
with open('_data/projects.json', 'r', encoding='utf-8') as f:
    projects = json.load(f)

# Create a mapping of current titles to their project data
projects_by_title = {p['title']: p for p in projects}

# New order as specified by the user
new_order = [
    "Le Guide du Golfe de Saint-Tropez",
    "Maxime Click",
    "Mon Gardien",
    "France Galop Live",
    "JOBBRR",
    "PAPA France",
    "Darknet",
    "PHOQ.tv",
    "Vaylune",
    "BioQuest",
    "Picsou-Soir",
    "WCA - World Cube Association",
    "What The Duck",
    "DuMILi",
    "Break Screen",
    "Direct Democracy",
    "I.N.D.U.C.K.S.",
    "Promodentaire",
    "Ballon Nike Academy Team",
    "Pizz'Ami",
    "Tom et Lola",
    "Planète Loto Live",
    "Run&Rerun",
    "Digital Unicorn",
    "Joyca, Trouve la règle"
]

# Reorder projects and update IDs
reordered_projects = []
for i, title in enumerate(new_order, start=1):
    if title in projects_by_title:
        project = projects_by_title[title]
        project['id'] = i
        reordered_projects.append(project)
    else:
        print(f"Warning: Project '{title}' not found in projects.json")

# Add any projects that weren't in the new order (like Danse à l'Opéra)
for project in projects:
    if project['title'] not in new_order:
        project['id'] = len(reordered_projects) + 1
        reordered_projects.append(project)
        print(f"Added project '{project['title']}' at the end with ID {project['id']}")

# Write back to projects.json
with open('_data/projects.json', 'w', encoding='utf-8') as f:
    json.dump(reordered_projects, f, ensure_ascii=False, indent=4)

print(f"\nSuccessfully reordered {len(reordered_projects)} projects!")
