const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkConnection(supabase) {
  try {
    const { data, error } = await supabase.from('tasks').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function runSetup() {
  console.log('🚀 CONFIGURACIÓN AUTOMÁTICA DE SUPABASE\n');

  // Verificar variables de entorno
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Variables de entorno faltantes!');
    console.log('\n💡 Necesitas crear un archivo .env con:');
    console.log('EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase');
    console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica');
    console.log('\n📖 Consulta el archivo SISTEMA_SIMPLE_SUPABASE.md para más detalles');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );

  // Verificar conexión
  console.log('🔄 Verificando conexión a Supabase...');
  const connected = await checkConnection(supabase);
  
  if (!connected) {
    console.error('❌ No se puede conectar a Supabase');
    console.log('💡 Verifica tus credenciales en el archivo .env');
    process.exit(1);
  }
  
  console.log('✅ Conexión exitosa a Supabase\n');

  // Instrucciones para el usuario
  console.log('📋 PARA COMPLETAR LA CONFIGURACIÓN:');
  console.log('\n1️⃣  Ve a tu proyecto en supabase.com');
  console.log('2️⃣  Navega a SQL Editor');
  console.log('3️⃣  Ejecuta estos archivos en orden:');
  console.log('     a) scripts/setup_simple_auth.sql');
  console.log('     b) scripts/configure_test_data.sql');
  
  console.log('\n🎯 USUARIOS DE PRUEBA QUE SE CREARÁN:');
  console.log('   • manager@taskapp.com (password: test123)');
  console.log('   • supervisor@taskapp.com (password: test123)');
  console.log('   • senior@taskapp.com (password: test123)');
  console.log('   • junior@taskapp.com (password: test123)');

  console.log('\n📖 Para instrucciones detalladas, lee: SISTEMA_SIMPLE_SUPABASE.md');
  console.log('\n⚡ ¡Una vez ejecutados los scripts, tu app estará lista!');
}

runSetup().catch(console.error); 