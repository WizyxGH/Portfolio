import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) => z.object({
    id: z.number().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    image: image().optional(),
    image_alt: z.string().optional(),
    og_image: z.string().optional(),
    type: z.string().optional(),
    context: z.string().optional(),
    date: z.string().optional(),
    projectLink: z.string().optional(),
    technologies: z.array(z.any()).optional(),
    tags: z.array(z.any()).optional()
  }).passthrough()
});

export const collections = {
  projects,
};
