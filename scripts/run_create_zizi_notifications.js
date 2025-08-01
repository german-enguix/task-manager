const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase (usa las mismas variables de entorno que tu proyecto)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('❌ Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLScript() {
  try {
    console.log('🚀 Starting Zizi notifications creation...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create_zizi_notifications.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 SQL script loaded, executing...');
    
    // Ejecutar el script SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('❌ Error executing SQL script:', error);
      return;
    }
    
    console.log('✅ SQL script executed successfully');
    console.log('📊 Result:', data);
    
    // Verificar las notificaciones creadas
    console.log('\n🔍 Verifying created notifications...');
    
    const { data: notifications, error: queryError } = await supabase
      .from('work_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (queryError) {
      console.error('❌ Error querying notifications:', queryError);
      return;
    }
    
    console.log(`✅ Found ${notifications.length} recent notifications:`);
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} (${notif.type}) - ${notif.is_read ? 'READ' : 'UNREAD'}`);
    });
    
  } catch (error) {
    console.error('❌ Error running script:', error);
  }
}

// Ejecutar el script
runSQLScript().then(() => {
  console.log('\n🎉 Zizi notifications setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 