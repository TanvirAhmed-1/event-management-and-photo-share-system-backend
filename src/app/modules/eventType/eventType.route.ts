import { Router } from "express";
import auth from "../../middlewares/auth";
import validateData from "../../middlewares/validateData";
import { EventTypeController } from "./eventType.controller";
import { EventTypeValidation } from "./eventType.validation";

const router = Router();

// Public / Authenticated discovery
router.get("/", EventTypeController.getAllEventTypes);
router.get("/:id", EventTypeController.getEventTypeById);

// Admin & Super Admin Management
router.post(
  "/",
  auth("ADMIN", "SUPER_ADMIN"),
  validateData(EventTypeValidation.createEventTypeSchema),
  EventTypeController.createEventType
);

router.patch(
  "/:id",
  auth("ADMIN", "SUPER_ADMIN"),
  validateData(EventTypeValidation.updateEventTypeSchema),
  EventTypeController.updateEventType
);

router.delete(
  "/:id",
  auth("ADMIN", "SUPER_ADMIN"),
  EventTypeController.deleteEventType
);

router.patch(
  "/:id/toggle-active",
  auth("ADMIN", "SUPER_ADMIN"),
  EventTypeController.toggleActiveEventType
);

router.put(
  "/:id/fields",
  auth("ADMIN", "SUPER_ADMIN"),
  validateData(EventTypeValidation.updateFieldsSchema),
  EventTypeController.syncEventTypeFields
);

export const EventTypeRoutes = router;

