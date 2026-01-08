import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';
import { API_BASE } from './api';

WebBrowser.maybeCompleteAuthSession();

export interface User {
  id: string;
  email?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nickname?: string;
  age_range?: string;
  aesthetic_level?: string;
  role?: string;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: {
    nickname?: string;
    age_range?: string;
    aesthetic_level?: string;
  }
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
  return data;
}

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

const ageRangeMap = {
  'teen': 'teen',
  'adult': 'adult',
} as const;

export async function signUp(
  email: string, 
  password: string, 
  nickname?: string,
  ageRange?: string,
  aestheticLevel?: string
) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (authError) {
    if (authError.message.includes('Database error')) {
      const triggerError = new Error('Database Trigger 오류가 발생했습니다. Supabase의 users 테이블 Trigger 설정을 확인해주세요.');
      (triggerError as any).originalError = authError;
      throw triggerError;
    }
    throw authError;
  }
  
  if (!authData.user) {
    return authData;
  }
  
  if (nickname || ageRange || aestheticLevel) {
    const updateData: any = {};
    if (nickname) updateData.nickname = nickname;
    if (ageRange) {
      updateData.age_range = ageRange;
    }
    if (aestheticLevel) updateData.aesthetic_level = aestheticLevel;
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let retries = 3;
    while (retries > 0) {
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', authData.user.id);
      
      if (!error) break;
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  return authData;
}

export async function signInWithGoogle() {
  const redirectTo = Linking.createURL('/mypage/login');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw error;
  }

  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    );

    if (result.type === 'success' && result.url) {
      if (result.url.includes('error=')) {
        const errorMatch = result.url.match(/error=([^&]+)/);
        const error = errorMatch ? decodeURIComponent(errorMatch[1]) : '알 수 없는 오류';
        throw new Error(`OAuth 오류: ${error}`);
      }
      
      const hashIndex = result.url.indexOf('#');
      if (hashIndex !== -1) {
        const fragment = result.url.substring(hashIndex + 1);
        
        const params: Record<string, string> = {};
        fragment.split('&').forEach((param) => {
          const [key, value] = param.split('=');
          if (key && value) {
            params[key] = decodeURIComponent(value);
          }
        });
        
        if (params.access_token && params.refresh_token) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (sessionData?.session) {
            return sessionData;
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      if (sessionData?.session) {
        return sessionData;
      }
      
      return null;
    } else if (result.type === 'cancel') {
      return null;
    }
  }
  
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

// services/auth.ts

export async function withdrawAccount(accessToken: string) {
  const res = await fetch(`${API_BASE}/auth/withdraw`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  console.log(API_BASE);
  if (!res.ok) {
    throw new Error("탈퇴 실패");
  }

  return res.json();
}