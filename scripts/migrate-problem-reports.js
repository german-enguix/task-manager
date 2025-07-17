const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function runProblemReportsMigration() {
  console.log('🚀 Ejecutando migración de reportes de problemas...\n');

  // Verificar variables de entorno
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('❌ Variables de entorno faltantes!');
    console.log('\n💡 Necesitas crear un archivo .env con:');
    console.log('EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase');
    console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica');
    console.log('\n📖 Consulta el archivo SISTEMA_SIMPLE_SUPABASE.md para más detalles');
    process.exit(1);
  }

  // Usar service key si está disponible, sino anon key
  const keyToUse = serviceKey || anonKey;
  const isUsingServiceKey = !!serviceKey;

  console.log(`🔑 Usando ${isUsingServiceKey ? 'SERVICE KEY (admin)' : 'ANON KEY (limitada)'}`);

  const supabase = createClient(supabaseUrl, keyToUse);

  try {
    console.log('📋 Verificando conexión a Supabase...');
    
    // Verificar conexión
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Error de conexión a Supabase:', testError.message);
      console.log('\n💡 Verifica que:');
      console.log('   1. Las credenciales en .env sean correctas');
      console.log('   2. Tu proyecto de Supabase esté activo');
      console.log('   3. Las tablas básicas ya estén creadas');
      process.exit(1);
    }

    console.log('✅ Conexión establecida correctamente\n');

    // Verificar si la tabla ya existe
    console.log('🔍 Verificando si la tabla task_problem_reports ya existe...');
    
    const { data: existingTable, error: tableCheckError } = await supabase
      .from('task_problem_reports')
      .select('count')
      .limit(1);

    if (!tableCheckError) {
      console.log('✅ La tabla task_problem_reports ya existe. Migración no necesaria.');
      console.log('\n🎉 Reportes de problemas ya están configurados correctamente!');
      console.log('\n💡 Puedes usar la funcionalidad inmediatamente en la app.');
      return;
    }

    if (!isUsingServiceKey) {
      console.log('⚠️  La tabla no existe y no tienes service key configurada.');
      console.log('\n📋 OPCIONES:');
      console.log('1. Agregar SUPABASE_SERVICE_KEY=tu_service_key al archivo .env');
      console.log('2. O ejecutar manualmente en Supabase Dashboard → SQL Editor');
      return;
    }

    // Si tenemos service key, ejecutar el SQL automáticamente
    console.log('🔨 Ejecutando script SQL automáticamente...');

    const sqlCommands = [
      // 1. Crear enum para tipos de reporte
      `DO $$ BEGIN
          CREATE TYPE problem_report_type AS ENUM (
              'blocking_issue', 'missing_tools', 'unsafe_conditions', 'technical_issue',
              'access_denied', 'material_shortage', 'weather_conditions', 'other'
          );
       EXCEPTION
          WHEN duplicate_object THEN
              RAISE NOTICE 'El tipo problem_report_type ya existe, continuando...';
       END $$;`,

      // 2. Crear enum para severidad
      `DO $$ BEGIN
          CREATE TYPE problem_severity AS ENUM ('low', 'medium', 'high', 'critical');
       EXCEPTION
          WHEN duplicate_object THEN
              RAISE NOTICE 'El tipo problem_severity ya existe, continuando...';
       END $$;`,

      // 3. Crear tabla
      `CREATE TABLE IF NOT EXISTS task_problem_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        report_type problem_report_type NOT NULL,
        severity problem_severity NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        reported_at TIMESTAMPTZ DEFAULT NOW(),
        resolved_at TIMESTAMPTZ,
        resolved_by UUID REFERENCES auth.users(id),
        resolution TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`,

      // 4. Habilitar RLS
      `ALTER TABLE task_problem_reports ENABLE ROW LEVEL SECURITY;`,

      // 5. Crear políticas
      `CREATE POLICY IF NOT EXISTS "task_problem_reports_select_own_tasks" ON task_problem_reports
        FOR SELECT USING (
          task_id IN (
            SELECT id FROM tasks 
            WHERE assigned_to = auth.uid()
          )
        );`,

      `CREATE POLICY IF NOT EXISTS "task_problem_reports_insert_own_tasks" ON task_problem_reports
        FOR INSERT WITH CHECK (
          auth.uid() = user_id AND
          task_id IN (
            SELECT id FROM tasks 
            WHERE assigned_to = auth.uid()
          )
        );`,

      `CREATE POLICY IF NOT EXISTS "task_problem_reports_update_own" ON task_problem_reports
        FOR UPDATE USING (auth.uid() = user_id);`,

      `CREATE POLICY IF NOT EXISTS "task_problem_reports_delete_own" ON task_problem_reports
        FOR DELETE USING (auth.uid() = user_id);`,

      // 6. Crear índices
      `CREATE INDEX IF NOT EXISTS idx_task_problem_reports_task_id ON task_problem_reports(task_id);`,
      `CREATE INDEX IF NOT EXISTS idx_task_problem_reports_user_id ON task_problem_reports(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_task_problem_reports_created_at ON task_problem_reports(reported_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_task_problem_reports_severity ON task_problem_reports(severity);`,
      `CREATE INDEX IF NOT EXISTS idx_task_problem_reports_type ON task_problem_reports(report_type);`,

      // 7. Crear función para updated_at
      `CREATE OR REPLACE FUNCTION update_task_problem_reports_updated_at()
       RETURNS TRIGGER AS $$
       BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
       END;
       $$ LANGUAGE plpgsql;`,

      // 8. Crear trigger
      `DROP TRIGGER IF EXISTS trigger_update_task_problem_reports_updated_at ON task_problem_reports;
       CREATE TRIGGER trigger_update_task_problem_reports_updated_at
         BEFORE UPDATE ON task_problem_reports
         FOR EACH ROW EXECUTE FUNCTION update_task_problem_reports_updated_at();`,

      // 9. Comentarios para documentación
      `COMMENT ON TABLE task_problem_reports IS 'Reportes de problemas en tareas';`,

      // 10. Función helper
      `CREATE OR REPLACE FUNCTION get_problem_report_types_info()
       RETURNS TABLE(
         type problem_report_type,
         title TEXT,
         description TEXT,
         icon TEXT,
         suggested_severity problem_severity
       ) AS $$
       BEGIN
         RETURN QUERY VALUES
           ('blocking_issue'::problem_report_type, 'Problema que bloquea la tarea', 'No puedo continuar con la tarea debido a este problema', 'block-helper', 'high'::problem_severity),
           ('missing_tools'::problem_report_type, 'Herramientas faltantes', 'Faltan herramientas o equipos necesarios para la tarea', 'toolbox-outline', 'medium'::problem_severity),
           ('unsafe_conditions'::problem_report_type, 'Condiciones inseguras', 'Las condiciones de trabajo no son seguras', 'shield-alert-outline', 'critical'::problem_severity),
           ('technical_issue'::problem_report_type, 'Problema técnico', 'Error técnico o mal funcionamiento de equipos', 'tools', 'medium'::problem_severity),
           ('access_denied'::problem_report_type, 'Acceso denegado', 'No tengo acceso a la ubicación o recursos necesarios', 'lock-outline', 'high'::problem_severity),
           ('material_shortage'::problem_report_type, 'Falta de materiales', 'Materiales insuficientes o faltantes', 'package-variant', 'medium'::problem_severity),
           ('weather_conditions'::problem_report_type, 'Condiciones climáticas', 'El clima impide realizar la tarea de forma segura', 'weather-lightning-rainy', 'medium'::problem_severity),
           ('other'::problem_report_type, 'Otro problema', 'Problema no categorizado en las opciones anteriores', 'alert-circle-outline', 'low'::problem_severity);
       END;
       $$ LANGUAGE plpgsql;`
    ];

    // Ejecutar cada comando SQL
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`📝 Ejecutando comando ${i + 1}/${sqlCommands.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        if (error) {
          // Intentar con método alternativo
          const { error: error2 } = await supabase
            .from('_sql_exec')
            .insert({ query: command });
          
          if (error2) {
            console.log(`⚠️  Comando ${i + 1} podría requerir ejecución manual:`, error.message);
          }
        }
      } catch (err) {
        console.log(`⚠️  Comando ${i + 1} ejecutado (verificación manual recomendada)`);
      }
    }

    // Verificar que la tabla se creó correctamente
    console.log('\n🔍 Verificando creación de tabla...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('task_problem_reports')
      .select('count')
      .limit(1);

    if (finalError) {
      console.log('⚠️  No se pudo verificar automáticamente. Verifica manualmente en Supabase Dashboard.');
      console.log('\n📋 Si algunos comandos fallaron, ejecuta el script completo en SQL Editor:');
      console.log('scripts/create_problem_reports_table.sql');
    } else {
      console.log('✅ ¡Tabla creada exitosamente!');
      console.log('\n🎉 Reportes de problemas configurados correctamente!');
      console.log('\n💡 Puedes usar la funcionalidad inmediatamente en la app.');
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    
    if (error.message.includes('JWT')) {
      console.log('\n💡 Error de autenticación. Verifica tu service key.');
    } else if (error.message.includes('permission')) {
      console.log('\n💡 Error de permisos. Verifica que la service key sea correcta.');
    }
    
    console.log('\n📋 Si hay errores, ejecuta manualmente en Supabase Dashboard:');
    console.log('scripts/create_problem_reports_table.sql');
  }
}

// Ejecutar migración
if (require.main === module) {
  runProblemReportsMigration();
}

module.exports = { runProblemReportsMigration }; 