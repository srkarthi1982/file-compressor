/**
 * File Compressor - compress large files quickly.
 *
 * Design goals:
 * - Similar to File Converter, but focused on compression.
 * - Track original vs compressed sizes + chosen method/level.
 * - Store references for download + potential cleanup later.
 */

import { defineTable, column, NOW } from "astro:db";

export const FileCompressionJobs = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),

    inputFileName: column.text({ optional: true }),
    inputFileUrl: column.text({ optional: true }),
    outputFileName: column.text({ optional: true }),
    outputFileUrl: column.text({ optional: true }),

    // compression parameters
    algorithm: column.text({ optional: true }),            // "zip", "gzip", "brotli", etc.
    level: column.text({ optional: true }),                // "fast", "balanced", "max"
    settingsJson: column.text({ optional: true }),         // any extra config

    // stats
    originalSizeBytes: column.number({ optional: true }),
    compressedSizeBytes: column.number({ optional: true }),

    status: column.text({ optional: true }),               // "queued", "processing", "completed", "failed"
    errorMessage: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
    completedAt: column.date({ optional: true }),
  },
});

export const tables = {
  FileCompressionJobs,
} as const;
