import { Router } from "express";
import { db, collegesTable } from "@workspace/db";

const router = Router();

// GET /colleges
router.get("/colleges", async (_req, res): Promise<void> => {
  const colleges = await db.select().from(collegesTable).orderBy(collegesTable.id);
  res.json(
    colleges.map((c) => ({
      id: c.id,
      name: c.name,
      shortName: c.shortName,
      location: c.location,
      isActive: c.isActive,
      studentCount: c.studentCount,
    }))
  );
});

export default router;
