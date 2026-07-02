'use client';
import { supabase } from './supabase';

export interface Profile {
  id: string;
  user_name: string;
  preset: string | null;
  enabled_features: Record<string, boolean>;
  onboarding_completed: boolean;
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function createProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, user_name: '', preset: null, enabled_features: {}, onboarding_completed: false })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function completeOnboarding(userId: string, patch: { user_name: string; preset: string; enabled_features: Record<string, boolean> }): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...patch, onboarding_completed: true })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
