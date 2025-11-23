import { z } from 'zod';

/**
 * Validation schema for creating a dataset bounty
 * 
 * Requirements:
 * - 5.1: Bounty name must not be empty
 * - 5.2: File names and blob IDs must have the same length
 * - 5.3: Reward amount must be a positive number
 * - 5.4: Total images must be a positive integer
 * - 5.5: Specific error messages for each validation failure
 */
export const createBountySchema = z.object({
  name: z.string()
    .min(1, "Bounty name is required")
    .refine(
      (val) => val.trim().length > 0,
      { message: "Bounty name cannot be only whitespace" }
    ),
  
  fileNames: z.array(z.string().min(1, "File name cannot be empty"))
    .min(1, "At least one file is required"),
  
  blobIds: z.array(z.string().min(1, "Blob ID cannot be empty"))
    .min(1, "At least one blob ID is required"),
  
  allowedLabels: z.array(z.string().min(1, "Label cannot be empty"))
    .min(1, "At least one allowed label is required"),
  
  totalImages: z.number({
    message: "Total images must be a number"
  })
    .int("Total images must be an integer")
    .positive("Total images must be a positive number"),
  
  rewardAmount: z.number({
    message: "Reward amount must be a number"
  })
    .positive("Reward amount must be a positive number")
}).refine(
  (data) => data.fileNames.length === data.blobIds.length,
  {
    message: "File names and blob IDs must have the same length",
    path: ["fileNames"] // Attach error to fileNames field
  }
);

export type CreateBountyFormData = z.infer<typeof createBountySchema>;

/**
 * Validation schema for submitting a label to a bounty
 * 
 * Requirements:
 * - Object ID must be a valid Sui object ID format
 * - File name must not be empty
 * - Label must not be empty
 */
export const submitLabelSchema = z.object({
  bountyObjectId: z.string()
    .min(1, "Bounty object ID is required")
    .regex(
      /^0x[a-fA-F0-9]+$/,
      "Bounty object ID must be a valid Sui object ID (starting with 0x)"
    ),
  
  fileName: z.string()
    .min(1, "File name is required")
    .refine(
      (val) => val.trim().length > 0,
      { message: "File name cannot be only whitespace" }
    ),
  
  label: z.string()
    .min(1, "Label is required")
    .refine(
      (val) => val.trim().length > 0,
      { message: "Label cannot be only whitespace" }
    )
});

export type SubmitLabelFormData = z.infer<typeof submitLabelSchema>;
