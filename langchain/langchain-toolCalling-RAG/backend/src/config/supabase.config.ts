import { registerAs } from '@nestjs/config';

export interface SupabaseConfig {
  url: string;
  key: string;
  bucket: string;
}

export const supabaseConfig = registerAs('supabase', (): SupabaseConfig => ({
  url: process.env.SUPABASE_URL ?? '',
  key: process.env.SUPABASE_KEY ?? process.env.SUPABASE_ANON_KEY ?? '',
  bucket:
    process.env.SUPABASE_STORAGE_BUCKET ??
    process.env.SUPABASE_BUCKET ??
    'documents',
}));

export default supabaseConfig;
