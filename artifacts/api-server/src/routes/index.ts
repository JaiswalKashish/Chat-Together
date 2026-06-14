import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import verificationRouter from "./verification";
import collegesRouter from "./colleges";
import communitiesRouter from "./communities";
import eventsRouter from "./events";
import ridesRouter from "./rides";
import bookingsRouter from "./bookings";
import chatRouter from "./chat";
import trustedContactsRouter from "./trusted_contacts";
import trackingRouter from "./tracking";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(verificationRouter);
router.use(collegesRouter);
router.use(communitiesRouter);
router.use(eventsRouter);
router.use(ridesRouter);
router.use(bookingsRouter);
router.use(chatRouter);
router.use(trustedContactsRouter);
router.use(trackingRouter);
router.use(dashboardRouter);

export default router;
