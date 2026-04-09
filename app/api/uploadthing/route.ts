import { createUploadthing } from "uploadthing/next";
import { createRouteHandler } from "uploadthing/next";
import { z } from "zod";
import crypto from "crypto";

const f = createUploadthing();

const uploadRouter = {
  

  knightLicenseSubmission: f({
  blob: { maxFileCount: 1, maxFileSize: "32MB" },
})
  .input(
    z.object({
      userId: z.string(),
      email: z.string().email(),
      fullName: z.string(),
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

    if (files.length === 0) {
      throw new Error("No file uploaded");
    }

    const file = files[0];

    if (!ALLOWED_LICENSE_TYPES.includes(file.type)) {
      throw new Error("Unsupported license file type");
    }

    const random = crypto.randomBytes(8).toString("hex");

    return {
      ...input,
      file: {
        ...file,
        name: `uploads/${input.userId}/license-${random}-${file.name}`,
      },
    };
  })
  .onUploadComplete(({ metadata, file }) => {
    return {
      fileUrl: file.ufsUrl,
      uploadedBy: metadata.userId,
      email: metadata.email,
      
    };
  }),

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
    staffReportSubmission: f({
    blob: { maxFileCount: 1, maxFileSize: "16MB" },
  })
    .input(
      z.object({
        userId: z.string(),
        committeeId: z.string(),
      })
    )
    .middleware(async ({ input, files }) => {
      const file = files[0];
      const random = crypto.randomBytes(4).toString("hex");
      
      return {
        ...input,
        file: {
          ...file,
          name: `reports/${input.committeeId}/report-${random}-${file.name}`,
        },
      };
    })
    .onUploadComplete(({ metadata, file }) => {
      return { fileUrl: file.ufsUrl, metadata };
    }),

};

export type OurFileRouter = typeof uploadRouter;

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});