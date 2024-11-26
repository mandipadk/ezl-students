// Client-side environment variables (safe to expose)
const requiredPublicEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

// Server-side environment variables (never exposed to client)
const requiredServerEnvVars = [
  'EMAIL_SERVICE_URL',
  'CANVAS_SERVICE_URL',
  'CALENDAR_SERVICE_URL',
  'VECTOR_DB_SERVICE_URL'
] as const;

// Validate and get client-side environment variables
const getPublicConfig = () => {
  // In development, we want to validate all environment variables
  if (process.env.NODE_ENV === 'development') {
    requiredPublicEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        console.warn(`Warning: Missing public environment variable: ${envVar}`);
      }
    });
  }

  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    }
  } as const;
};

// Validate and get server-side environment variables
const getServerConfig = () => {
  if (typeof window === 'undefined') {
    requiredServerEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        console.warn(`Warning: Missing server environment variable: ${envVar}`);
      }
    });
  }

  return {
    services: {
      email: process.env.EMAIL_SERVICE_URL ?? '',
      canvas: process.env.CANVAS_SERVICE_URL ?? '',
      calendar: process.env.CALENDAR_SERVICE_URL ?? '',
      vectorDb: process.env.VECTOR_DB_SERVICE_URL ?? ''
    }
  } as const;
};

// Export configurations
export const publicConfig = getPublicConfig();
export const serverConfig = getServerConfig(); 