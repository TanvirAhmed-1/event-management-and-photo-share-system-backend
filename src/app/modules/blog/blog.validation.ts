import { z } from "zod";

const createBlogSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    slug: z.string().min(2).optional(),
    excerpt: z.string().optional(),
    content: z.string().min(10, "Blog content cannot be empty"),
    coverImage: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    isPublished: z.boolean().optional(),
  }),
});

const updateBlogSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    slug: z.string().min(2).optional(),
    excerpt: z.string().optional(),
    content: z.string().min(10).optional(),
    coverImage: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    isPublished: z.boolean().optional(),
  }),
});

export const BlogValidation = {
  createBlogSchema,
  updateBlogSchema,
};
