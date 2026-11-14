import { Router } from "express";
import auth from "../../middlewares/auth";
import validateData from "../../middlewares/validateData";
import { BlogController } from "./blog.controller";
import { BlogValidation } from "./blog.validation";

const router = Router();

// Public
router.get("/", BlogController.getAllBlogs);
router.get("/:slug", BlogController.getBlogBySlug);

// Admin Management
router.post(
  "/",
  auth("SUPER_ADMIN"),
  validateData(BlogValidation.createBlogSchema),
  BlogController.createBlog
);

router.patch(
  "/:id",
  auth("SUPER_ADMIN"),
  validateData(BlogValidation.updateBlogSchema),
  BlogController.updateBlog
);

router.patch(
  "/:id/toggle-publish",
  auth("SUPER_ADMIN"),
  BlogController.togglePublishBlog
);

router.delete("/:id", auth("SUPER_ADMIN"), BlogController.deleteBlog);

export const BlogRoutes = router;
