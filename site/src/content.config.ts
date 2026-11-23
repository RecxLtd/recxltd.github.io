import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const services = defineCollection({
  loader: file('src/data/services.yaml'),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    paragraphs: z.array(z.string()).min(1),
  }),
});

const testimonials = defineCollection({
  loader: file('src/data/testimonials.yaml'),
  schema: z.object({
    section: z.enum(['services', 'apexsec', 'team', 'about']),
    order: z.number(),
    quote: z.string(),
    source: z.string(),
  }),
});

const staff = defineCollection({
  loader: file('src/data/staff.yaml'),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    linkedin: z.url(),
    bio: z.string(),
  }),
});

const clients = defineCollection({
  loader: file('src/data/clients.yaml'),
  schema: z.object({
    order: z.number(),
    name: z.string(),
    url: z.url(),
    logo: z.string(),
    scale: z.number().positive().default(1),
  }),
});

export const collections = { services, testimonials, staff, clients };
