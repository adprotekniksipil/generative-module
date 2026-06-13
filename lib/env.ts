const IS_PRODUCTION = process.env.NODE_ENV === "production";

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (IS_PRODUCTION) {
      throw new Error(`FATAL: Environment variable ${key} is required in production`);
    }
    console.warn(`[env] Warning: ${key} is not set`);
    return "";
  }
  return value;
}

function optional(key: string, fallback = ""): string {
  return process.env[key] || fallback;
}

export const env = {
  NODE_ENV: optional("NODE_ENV", "development"),
  IS_PRODUCTION,

  // Firebase (client)
  FIREBASE_API_KEY: required("NEXT_PUBLIC_FIREBASE_API_KEY"),
  FIREBASE_AUTH_DOMAIN: required("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  FIREBASE_PROJECT_ID: required("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),

  // Firebase (admin)
  FIREBASE_PRIVATE_KEY: required("FIREBASE_PRIVATE_KEY"),
  FIREBASE_CLIENT_EMAIL: required("FIREBASE_CLIENT_EMAIL"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: required("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: required("CLOUDINARY_API_SECRET"),

  // AI
  GOOGLE_API_KEY: required("GOOGLE_GENERATIVE_AI_API_KEY"),
} as const;
