import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * File upload/storage utilities for Nous
 * Uses Convex built-in file storage
 */

// Generate an upload URL for the client
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get a public URL for a stored file
export const getFileUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Get multiple file URLs at once
export const getFileUrls = query({
  args: {
    storageIds: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const urls = await Promise.all(
      args.storageIds.map(async (id) => ({
        storageId: id,
        url: await ctx.storage.getUrl(id),
      }))
    );
    return urls;
  },
});

// Delete a stored file
export const deleteFile = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    return { success: true };
  },
});

// Helper type for attachments
export const attachmentValidator = v.object({
  storageId: v.id("_storage"),
  url: v.optional(v.string()),
  type: v.string(),
  mimeType: v.optional(v.string()),
  name: v.optional(v.string()),
  size: v.optional(v.number()),
});
