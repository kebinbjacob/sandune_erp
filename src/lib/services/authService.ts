import { supabase } from '@/lib/supabase/client';
import { AppUser } from './userService';

export async function loginWithEmail(email: string, password?: string): Promise<AppUser> {
  if (!password) {
    throw new Error('Password is required.');
  }

  // 1. Authenticate with Supabase Auth FIRST to establish the secure session for RLS
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: password || '', // Fallback to avoid type errors
  });

  if (authError || !authData?.user) {
    console.error('Supabase Auth error:', authError);
    throw new Error('Invalid email or password.');
  }

  // 2. Fetch user profile from app_users by auth_id (now that we have an authenticated session)
  const { data, error } = await supabase
    .from('app_users')
    .select('*, employees(*)')
    .eq('auth_id', authData.user.id)
    .single();

  if (error || !data) {
    await supabase.auth.signOut();
    throw new Error('User profile not found or access denied by RLS. Please check your email.');
  }

  if (data.status !== 'Active') {
    await supabase.auth.signOut();
    throw new Error('Your account is currently suspended. Please contact your administrator.');
  }

  // 3. Update last login timestamp and set on returned user object
  const now = new Date().toISOString();
  await supabase
    .from('app_users')
    .update({ last_login: now })
    .eq('id', data.id);

  data.last_login = now;

  return data as AppUser;
}
