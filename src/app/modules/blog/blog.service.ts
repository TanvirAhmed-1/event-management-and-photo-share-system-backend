import prisma from "../../utils/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const estimateReadingTime = (html: string): number => {
  const plain = html.replace(/<[^>]+>/g, " ").trim();
  const words = plain ? plain.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
};

const createBlog = async (payload: any, authorId: string) => {
  const baseSlug = slugify(payload.slug || payload.title) || `post-${Date.now()}`;
  const existing = await prisma.blogPost.findUnique({ where: { slug: baseSlug } });
  const finalSlug = existing ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

  const isPublished = payload.isPublished !== undefined ? Boolean(payload.isPublished) : true;
  const readingTimeMin = estimateReadingTime(payload.content || "");

  return prisma.blogPost.create({
    data: {
      title: payload.title,
      slug: finalSlug,
      excerpt: payload.excerpt || null,
      content: payload.content,
      coverImage: payload.coverImage || null,
      category: payload.category || "Event Planning",
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      metaTitle: payload.metaTitle || payload.title,
      metaDescription: payload.metaDescription || payload.excerpt || null,
      readingTimeMin,
      isPublished,
      publishedAt: isPublished ? new Date() : null,
      authorId,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });
};

const getAllBlogs = async (includeDrafts = false, category?: string, search?: string) => {
  const where: any = {};
  if (!includeDrafts) {
    where.isPublished = true;
  }
  if (category && category !== "all") {
    where.category = category;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  return prisma.blogPost.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { id: true, name: true } },
    },
  });
};

const getBlogBySlug = async (slugOrId: string, includeDrafts = false) => {
  const blog = await prisma.blogPost.findFirst({
    where: {
      OR: [{ slug: slugOrId }, { id: slugOrId }],
      ...(includeDrafts ? {} : { isPublished: true }),
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });

  if (!blog) {
    throw new AppError(httpStatus.NOT_FOUND, "Blog article not found");
  }

  return blog;
};

const updateBlog = async (id: string, payload: any) => {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Blog article not found");
  }

  const data: any = { ...payload };
  if (payload.content) {
    data.readingTimeMin = estimateReadingTime(payload.content);
  }
  if (payload.isPublished === true && !existing.publishedAt) {
    data.publishedAt = new Date();
  }

  return prisma.blogPost.update({
    where: { id },
    data,
    include: {
      author: { select: { id: true, name: true } },
    },
  });
};

const togglePublishBlog = async (id: string) => {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Blog article not found");
  }

  const nextState = !existing.isPublished;
  return prisma.blogPost.update({
    where: { id },
    data: {
      isPublished: nextState,
      publishedAt: nextState ? existing.publishedAt || new Date() : existing.publishedAt,
    },
  });
};

const deleteBlog = async (id: string) => {
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Blog article not found");
  }
  return prisma.blogPost.delete({ where: { id } });
};

export const BlogService = {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  togglePublishBlog,
  deleteBlog,
};
