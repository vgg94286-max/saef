import { createUploadthing } from "uploadthing/next";
import { createRouteHandler } from "uploadthing/next";
import { z } from "zod";
import crypto from "crypto";

const f = createUploadthing();

const uploadRouter = {
  clubSubmission: f({
    image: { maxFileCount: 10, maxFileSize: "32MB" }, // club images
    blob: { maxFileCount: 1, maxFileSize: "32MB" },   // license
  })
    .input(
      z.object({
        userId: z.string(),
        clubName: z.string(),
        licenseExpiry: z.string(),
        email: z.string().email(),
      })
    )
    .middleware(async ({ input, files }) => {
      const ALLOWED_LICENSE_TYPES = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ];

      if (files.length === 0)
        throw new Error("No files uploaded");

      const renamedFiles = files.map((file) => {
        const random = crypto.randomBytes(8).toString("hex");

        const isLicense = ALLOWED_LICENSE_TYPES.includes(file.type);

        if (!isLicense && !file.type.startsWith("image/")) {
          throw new Error("Unsupported file type");
        }

        const prefix = isLicense ? "license" : "club";

        return {
          ...file,
          name: `uploads/${input.userId}/${prefix}-${random}-${file.name}`,
        };
      });

      return {
        ...input,
        files: renamedFiles,
      };
    })
    .onUploadComplete(({ metadata, file }) => {
      return {
        fileUrl: file.ufsUrl,
        uploadedBy: metadata.userId,
        clubName: metadata.clubName,
        licenseExpiry: metadata.licenseExpiry,
        email: metadata.email,
      };
    }),
};

export type OurFileRouter = typeof uploadRouter;

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});