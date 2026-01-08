import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabase 클라이언트 초기화 (앱 시작 시 즉시 초기화)
let supabaseClient: SupabaseClient | null = null;

function initializeSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  // 환경 변수 읽기 (우선순위 순서)
  // 1. process.env (Expo가 자동으로 .env 파일을 로드)
  // 2. Constants.expoConfig.extra (app.json의 extra 섹션)
  // 3. Constants.manifest?.extra (구버전 호환)
  const SUPABASE_URL = 
    process.env.EXPO_PUBLIC_SUPABASE_URL || 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
    Constants.manifest?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
    (global as any).__EXPO_PUBLIC_SUPABASE_URL;
    
  const SUPABASE_ANON_KEY = 
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    Constants.manifest?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    (global as any).__EXPO_PUBLIC_SUPABASE_ANON_KEY;


  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // 더미 클라이언트 생성 (에러 방지, 실제 사용 시 에러 발생)
    supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
    return supabaseClient;
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return supabaseClient;
}

// 앱 시작 시 즉시 초기화
initializeSupabaseClient();

// Proxy를 사용하여 초기화된 클라이언트 접근
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = initializeSupabaseClient();
    const value = client[prop as keyof SupabaseClient];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
