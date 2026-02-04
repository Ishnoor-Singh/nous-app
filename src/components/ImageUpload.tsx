"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, X, Upload, Loader2 } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

interface UploadedFile {
  storageId: Id<"_storage">;
  url: string;
  type: string;
  mimeType: string;
  name: string;
  size: number;
}

interface ImageUploadProps {
  onUpload: (file: UploadedFile) => void;
  onRemove?: () => void;
  preview?: string | null;
  className?: string;
  compact?: boolean; // For inline chat input
}

export default function ImageUpload({
  onUpload,
  onRemove,
  preview,
  className = "",
  compact = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload the file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await response.json();

      // Create local preview URL
      const localUrl = URL.createObjectURL(file);

      onUpload({
        storageId,
        url: localUrl, // Temporary local URL, will be resolved by Convex
        type: "image",
        mimeType: file.type,
        name: file.name,
        size: file.size,
      });
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Compact mode for chat input
  if (compact) {
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={handleClick}
          disabled={isUploading}
          className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-50"
          title="Add image"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ImageIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    );
  }

  // Full mode with preview
  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-xl overflow-hidden"
          >
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-48 object-cover rounded-xl"
            />
            {onRemove && (
              <button
                onClick={onRemove}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClick}
            disabled={isUploading}
            className="w-full p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 transition-colors flex flex-col items-center gap-2 text-white/50 hover:text-white/70"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8" />
                <span className="text-sm">Click to upload an image</span>
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// Compact preview for showing attached images before sending
export function ImagePreviewBadge({
  url,
  onRemove,
}: {
  url: string;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative inline-block"
    >
      <img
        src={url}
        alt="Attached"
        className="w-16 h-16 object-cover rounded-lg"
      />
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
