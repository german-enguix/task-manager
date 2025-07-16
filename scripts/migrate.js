// Script de migración ejecutable
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Datos mock simplificados para la migración
const mockTags = [
  { id: 'tag-safety', name: 'Seguridad', color: '#ff5722', category: 'Operaciones' },
  { id: 'tag-urgent', name: 'Urgente', color: '#f44336', category: 'Prioridad' },
  { id: 'tag-maintenance', name: 'Mantenimiento', color: '#2196f3', category: 'Operaciones' },
  { id: 'tag-inspection', name: 'Inspección', color: '#9c27b0', category: 'Calidad' },
  { id: 'tag-quality', name: 'Control de Calidad', color: '#4caf50', category: 'Calidad' },
  { id: 'tag-training', name: 'Capacitación', color: '#ff9800', category: 'RRHH' },
  { id: 'tag-equipment', name: 'Equipamiento', color: '#607d8b', category: 'Operaciones' },
  { id: 'tag-compliance', name: 'Cumplimiento', color: '#795548', category: 'Legal' },
  { id: 'tag-documentation', name: 'Documentación', color: '#3f51b5', category: 'Administración' },
  { id: 'tag-environmental', name: 'Ambiental', color: '#8bc34a', category: 'Sostenibilidad' },
  { id: 'tag-security', name: 'Seguridad Industrial', color: '#e91e63', category: 'Operaciones' },
  { id: 'tag-routine', name: 'Rutina', color: '#9e9e9e', category: 'Frecuencia' },
];

const mockTasks = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    title: 'Inspección de Seguridad - Planta Principal',
    description: 'Realizar inspección completa de seguridad en todas las áreas de la planta principal, verificando equipos de protección, salidas de emergencia y sistemas de ventilación.',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date('2025-01-15T18:00:00'),
    estimatedDuration: 120,
    projectName: 'Modernización Línea de Producción A',
    location: 'Planta Industrial Norte - Área Principal',
    tags: [
      { name: 'Seguridad' },
      { name: 'Inspección' },
      { name: 'Urgente' }
    ],
         subtasks: [
       {
         id: '550e8400-e29b-41d4-a716-446655440020',
         title: 'Verificar extintores',
         description: 'Revisar presión y fechas de vencimiento de todos los extintores',
         isCompleted: true,
         order: 1,
         createdAt: new Date('2025-01-12T09:00:00'),
         completedAt: new Date('2025-01-12T10:30:00')
       },
       {
         id: '550e8400-e29b-41d4-a716-446655440021',
         title: 'Inspeccionar salidas de emergencia',
         description: 'Verificar que todas las salidas estén despejadas y señalizadas',
         isCompleted: true,
         order: 2,
         createdAt: new Date('2025-01-12T09:00:00'),
         completedAt: new Date('2025-01-12T11:00:00')
       },
       {
         id: '550e8400-e29b-41d4-a716-446655440022',
         title: 'Revisar sistemas de ventilación',
         description: 'Comprobar funcionamiento de extractores y ventiladores',
         isCompleted: false,
         order: 3,
         createdAt: new Date('2025-01-12T09:00:00')
       },
       {
         id: '550e8400-e29b-41d4-a716-446655440023',
         title: 'Verificar iluminación de emergencia',
         description: 'Probar todas las luces de emergencia y baterías de respaldo',
         isCompleted: false,
         order: 4,
         createdAt: new Date('2025-01-12T09:00:00')
       }
     ]
  },
     {
     id: '550e8400-e29b-41d4-a716-446655440011',
     title: 'Mantenimiento Preventivo - Maquinaria',
    description: 'Realizar mantenimiento preventivo programado de toda la maquinaria crítica del área de producción.',
    status: 'not_started',
    priority: 'medium',
    dueDate: new Date('2025-01-20T16:00:00'),
    estimatedDuration: 240,
    projectName: 'Modernización Línea de Producción A',
    location: 'Planta Industrial Norte - Área de Maquinaria',
    tags: [
      { name: 'Mantenimiento' },
      { name: 'Equipamiento' },
      { name: 'Rutina' }
    ],
         subtasks: [
       {
         id: '550e8400-e29b-41d4-a716-446655440030',
         title: 'Lubricar rodamientos',
         description: 'Aplicar lubricante en todos los puntos de rodamiento',
         isCompleted: false,
         order: 1,
         createdAt: new Date('2025-01-10T08:00:00')
       },
       {
         id: '550e8400-e29b-41d4-a716-446655440031',
         title: 'Verificar tensión de correas',
         description: 'Ajustar tensión de correas de transmisión según especificaciones',
         isCompleted: false,
         order: 2,
         createdAt: new Date('2025-01-10T08:00:00')
       }
     ]
  },
     {
     id: '550e8400-e29b-41d4-a716-446655440012',
     title: 'Calibración Sensores - Línea 2',
    description: 'Calibrar todos los sensores de temperatura y presión de la línea de producción 2.',
    status: 'completed',
    priority: 'low',
    dueDate: new Date('2025-01-10T14:00:00'),
    estimatedDuration: 90,
    projectName: 'Modernización Línea de Producción A',
    location: 'Planta Industrial Norte - Línea 2',
    tags: [
      { name: 'Control de Calidad' },
      { name: 'Equipamiento' }
    ],
         subtasks: [
       {
         id: '550e8400-e29b-41d4-a716-446655440040',
         title: 'Sensor temperatura T1',
         description: 'Calibrar sensor de temperatura principal',
         isCompleted: true,
         order: 1,
         createdAt: new Date('2025-01-08T09:00:00'),
         completedAt: new Date('2025-01-08T10:00:00')
       },
       {
         id: '550e8400-e29b-41d4-a716-446655440041',
         title: 'Sensor presión P1',
         description: 'Calibrar sensor de presión de entrada',
         isCompleted: true,
         order: 2,
         createdAt: new Date('2025-01-08T09:00:00'),
         completedAt: new Date('2025-01-08T10:30:00')
       }
     ]
  }
];

async function runMigration() {
  console.log('🚀 Starting Supabase migration...');
  
  // Configurar cliente Supabase
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Crear usuarios de prueba
    console.log('👤 Creating test users...');
    const users = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'admin@tasks-concept.com',
        name: 'Administrador',
        role: 'admin'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'usuario@tasks-concept.com', 
        name: 'Usuario de Prueba',
        role: 'user'
      }
    ];

    const { error: usersError } = await supabase
      .from('users')
      .upsert(users, { onConflict: 'id' });

    if (usersError) {
      console.log('⚠️ Users might already exist:', usersError.message);
    } else {
      console.log('✅ Users created successfully');
    }

    // 2. Migrar tags (limpiar los existentes del mock primero)
    console.log('🏷️ Migrating tags...');
    
    // Limpiar tags existentes del mock (no los de prueba)
    await supabase
      .from('tags')
      .delete()
      .neq('category', 'Prueba');

    const tagsToInsert = mockTags.map((tag) => ({
      id: uuidv4(), // Generar UUID válido
      name: tag.name,
      color: tag.color,
      category: tag.category || null
    }));

    const { error: tagsError } = await supabase
      .from('tags')
      .upsert(tagsToInsert, { onConflict: 'id' });

    if (tagsError) throw tagsError;
    console.log(`✅ Migrated ${tagsToInsert.length} tags`);

    // 3. Obtener IDs de tags para las relaciones
    const { data: tagsInDb } = await supabase
      .from('tags')
      .select('id, name');

    const tagNameToId = new Map(tagsInDb.map(tag => [tag.name, tag.id]));

    // 4. Migrar tareas
    console.log('📋 Migrating tasks...');
    
    for (const task of mockTasks) {
      console.log(`📝 Migrating: ${task.title}`);
      
      // Insertar tarea
      const taskData = {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate.toISOString(),
        estimated_duration: task.estimatedDuration,
        project_name: task.projectName,
        location: task.location,
        assigned_to: '550e8400-e29b-41d4-a716-446655440001'
      };

      const { error: taskError } = await supabase
        .from('tasks')
        .upsert(taskData, { onConflict: 'id' });

      if (taskError) throw taskError;

      // Insertar subtareas
      if (task.subtasks.length > 0) {
        const subtasksData = task.subtasks.map(subtask => ({
          id: subtask.id,
          task_id: task.id,
          title: subtask.title,
          description: subtask.description,
          is_completed: subtask.isCompleted,
          order_index: subtask.order,
          created_at: subtask.createdAt.toISOString(),
          completed_at: subtask.completedAt?.toISOString() || null
        }));

        const { error: subtasksError } = await supabase
          .from('subtasks')
          .upsert(subtasksData, { onConflict: 'id' });

        if (subtasksError) throw subtasksError;
        console.log(`  ✅ Added ${subtasksData.length} subtasks`);
      }

      // Crear relaciones con tags
      if (task.tags.length > 0) {
        const taskTagsData = task.tags
          .map(tag => {
            const tagId = tagNameToId.get(tag.name);
            if (!tagId) return null;
            return {
              task_id: task.id,
              tag_id: tagId
            };
          })
          .filter(Boolean);

        if (taskTagsData.length > 0) {
          const { error: taskTagsError } = await supabase
            .from('task_tags')
            .upsert(taskTagsData, { onConflict: 'task_id,tag_id' });

          if (taskTagsError) throw taskTagsError;
          console.log(`  ✅ Linked ${taskTagsData.length} tags`);
        }
      }
    }

    // 5. Verificar resultados
    console.log('📊 Checking migration results...');
    
    const [
      { count: usersCount },
      { count: tasksCount },
      { count: subtasksCount },
      { count: tagsCount },
      { count: taskTagsCount }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('subtasks').select('*', { count: 'exact', head: true }),
      supabase.from('tags').select('*', { count: 'exact', head: true }),
      supabase.from('task_tags').select('*', { count: 'exact', head: true })
    ]);

    console.log('\n✅ Migration completed successfully!');
    console.log('📊 Final counts:');
    console.log(`   👤 Users: ${usersCount}`);
    console.log(`   📋 Tasks: ${tasksCount}`);
    console.log(`   📝 Subtasks: ${subtasksCount}`);
    console.log(`   🏷️ Tags: ${tagsCount}`);
    console.log(`   🔗 Task-Tag relations: ${taskTagsCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Ejecutar migración
runMigration(); 