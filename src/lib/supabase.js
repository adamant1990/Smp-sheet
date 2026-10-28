import { createClient } from '@supabase/supabase-js';

export const ADMIN_EMAIL = 'radik1022@yandex.ru';
export const supabase = createClient(
  'https://sqbbedojjvxldomslyiw.supabase.co',
  'sb_publishable_0jp5jGZoWpvrTerwQUjq-A_i7qJY252',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);
