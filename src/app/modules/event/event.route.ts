import { Router } from "express";
import { EventController } from "./event.controller";
import auth from "../../middlewares/auth";
import validateData from "../../middlewares/validateData";
import { EventValidation } from "./event.validation";

const router = Router();

// 1. Basic CRUD & Listing
router.post(
  "/",
  auth(),
  validateData(EventValidation.createEventSchema),
  EventController.createEvent
);
router.get("/", auth(), EventController.getAllEvents);
router.get("/:id", auth(), EventController.getEventById);

// 2. Wizard & Planning Step Endpoints
router.patch(
  "/:id",
  auth(),
  validateData(EventValidation.updateEventDetailsSchema),
  EventController.updateEventDetails
);

router.put(
  "/:id/services",
  auth(),
  validateData(EventValidation.selectServicesSchema),
  EventController.selectServices
);

router.put(
  "/:id/food",
  auth(),
  validateData(EventValidation.selectFoodSchema),
  EventController.selectFood
);

router.get("/:id/budget-preview", auth(), EventController.previewEventBudget);

router.post(
  "/:id/confirm",
  auth(),
  validateData(EventValidation.confirmEventSchema),
  EventController.confirmEvent
);

router.patch(
  "/:id/guest-count",
  auth(),
  validateData(EventValidation.updateGuestCountSchema),
  EventController.updateGuestCount
);

// 3. Deletion & Admin Controls
router.delete("/:id", auth(), EventController.deleteEvent);
router.patch("/admin/events/:id/toggle-active", auth(), EventController.toggleEventActiveAdmin);

export const EventRoutes = router;
