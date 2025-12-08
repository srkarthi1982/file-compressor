import { defineAction, ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { FileCompressionJobs, and, db, eq } from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

export const server = {
  createCompressionJob: defineAction({
    input: z.object({
      inputFileName: z.string().optional(),
      inputFileUrl: z.string().optional(),
      outputFileName: z.string().optional(),
      outputFileUrl: z.string().optional(),
      algorithm: z.string().optional(),
      level: z.string().optional(),
      settingsJson: z.string().optional(),
      originalSizeBytes: z.number().optional(),
      compressedSizeBytes: z.number().optional(),
      status: z.string().optional(),
      errorMessage: z.string().optional(),
      completedAt: z.date().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const [job] = await db
        .insert(FileCompressionJobs)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          inputFileName: input.inputFileName,
          inputFileUrl: input.inputFileUrl,
          outputFileName: input.outputFileName,
          outputFileUrl: input.outputFileUrl,
          algorithm: input.algorithm,
          level: input.level,
          settingsJson: input.settingsJson,
          originalSizeBytes: input.originalSizeBytes,
          compressedSizeBytes: input.compressedSizeBytes,
          status: input.status ?? "queued",
          errorMessage: input.errorMessage,
          createdAt: now,
          completedAt: input.completedAt,
        })
        .returning();

      return { success: true, data: { job } };
    },
  }),

  updateCompressionJob: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        outputFileName: z.string().optional(),
        outputFileUrl: z.string().optional(),
        algorithm: z.string().optional(),
        level: z.string().optional(),
        settingsJson: z.string().optional(),
        originalSizeBytes: z.number().optional(),
        compressedSizeBytes: z.number().optional(),
        status: z.string().optional(),
        errorMessage: z.string().optional(),
        completedAt: z.date().optional(),
      })
      .refine(
        (input) =>
          input.outputFileName !== undefined ||
          input.outputFileUrl !== undefined ||
          input.algorithm !== undefined ||
          input.level !== undefined ||
          input.settingsJson !== undefined ||
          input.originalSizeBytes !== undefined ||
          input.compressedSizeBytes !== undefined ||
          input.status !== undefined ||
          input.errorMessage !== undefined ||
          input.completedAt !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [existing] = await db
        .select()
        .from(FileCompressionJobs)
        .where(and(eq(FileCompressionJobs.id, input.id), eq(FileCompressionJobs.userId, user.id)));

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Compression job not found.",
        });
      }

      const [job] = await db
        .update(FileCompressionJobs)
        .set({
          ...(input.outputFileName !== undefined ? { outputFileName: input.outputFileName } : {}),
          ...(input.outputFileUrl !== undefined ? { outputFileUrl: input.outputFileUrl } : {}),
          ...(input.algorithm !== undefined ? { algorithm: input.algorithm } : {}),
          ...(input.level !== undefined ? { level: input.level } : {}),
          ...(input.settingsJson !== undefined ? { settingsJson: input.settingsJson } : {}),
          ...(input.originalSizeBytes !== undefined
            ? { originalSizeBytes: input.originalSizeBytes }
            : {}),
          ...(input.compressedSizeBytes !== undefined
            ? { compressedSizeBytes: input.compressedSizeBytes }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.errorMessage !== undefined ? { errorMessage: input.errorMessage } : {}),
          ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
        })
        .where(eq(FileCompressionJobs.id, input.id))
        .returning();

      return { success: true, data: { job } };
    },
  }),

  listCompressionJobs: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const jobs = await db
        .select()
        .from(FileCompressionJobs)
        .where(eq(FileCompressionJobs.userId, user.id));

      return { success: true, data: { items: jobs, total: jobs.length } };
    },
  }),
};
