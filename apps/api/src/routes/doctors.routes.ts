import express, { Router } from "express";
import {
  createDoctor,
  getDoctors,
  getDoctor,
  getDoctorAvailability,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctors.controller";

const router: Router = express.Router();

router.post("/createDoctor", createDoctor);
router.get("/getDoctors", getDoctors);
router.get("/getDoctorById/:id", getDoctor);
router.get("/getDoctorAvailability/:id", getDoctorAvailability);
router.patch("/updateDoctor/:id", updateDoctor);
router.delete("/deleteDoctor/:id", deleteDoctor);

export default router;
