import { getCollection } from 'astro:content';

export async function GET() {
  const allProjects = await getCollection('projects');
  
  const projectsJson = allProjects.map((project) => {
    return {
      id: project.data.id,
      title: project.data.title,
      slug: project.id, // Content collections use the filename without extension as id
      description: project.data.description || "",
      image: project.data.image || "",
      og_image: project.data.og_image || "",
      type: project.data.type || "",
      is_study: project.data.is_study || false,
      date: project.data.date || "",
      client: project.data.client || "",
      role: project.data.role || "",
      duration: project.data.duration || "",
      website: project.data.website || "",
      tools: project.data.tools || [],
      tags: project.data.tags || [],
      // For search, include raw markdown body. Remove basic markdown syntax for cleaner searching.
      text: project.body ? project.body.replace(/[#*_>\[\]]/g, '').trim() : ""
    };
  });

  return new Response(JSON.stringify(projectsJson), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
