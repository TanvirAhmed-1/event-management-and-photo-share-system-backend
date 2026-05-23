import { Router } from "express";
import { EventController } from "./event.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.post("/", auth(), EventController.createEvent);
router.get("/", auth(), EventController.getAllEvents);
router.get("/:id", auth(), EventController.getEventById);
router.patch("/:id", auth(), EventController.updateEvent);
router.delete("/:id", auth(), EventController.deleteEvent);
router.patch("/admin/events/:id/toggle-active", auth(), EventController.toggleEventActiveAdmin);

export const EventRoutes = router;
