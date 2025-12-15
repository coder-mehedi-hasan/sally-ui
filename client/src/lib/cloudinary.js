const CLOUD_NAME = "drnhinzi9";
const UPLOAD_PRESET = "sally_files";
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

/**
 * Upload a single file to Cloudinary (unsigned) – WEB
 */
export async function uploadSingle(file) {
    const formData = new FormData();

    // For web, append File directly
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error?.message || "Upload failed");
    }

    return {
        url: data.secure_url,
        kind: "file",
        mime: file.type || "application/octet-stream",
        size: file.size ?? data.bytes ?? null,
    };
}

/**
 * Upload multiple files in parallel – WEB
 */
export async function uploadMultipleToCloudinary(files) {
    return Promise.all(files.map(uploadSingle));
}
