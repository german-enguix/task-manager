import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configuración para Expo/React Native
    storage: undefined, // Usaremos el storage por defecto de Expo
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Configuración adicional para React Native
export const supabaseConfig = {
  url: supabaseUrl,
  key: supabaseAnonKey,
}

// Helper para verificar la conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('tasks').select('count').limit(1)
    if (error) throw error
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('❌ Supabase connection failed:', error)
    return false
  }
} 