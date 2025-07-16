import { supabase } from '@/lib/supabase'
import { mockTasks, mockTags } from '@/utils/mockData'
import { Database } from '@/types/supabase'

type UserInsert = Database['public']['Tables']['users']['Insert']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type SubtaskInsert = Database['public']['Tables']['subtasks']['Insert']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type TaskTagInsert = Database['public']['Tables']['task_tags']['Insert']

export class SupabaseMigration {
  
  async migrateAllData() {
    console.log('🚀 Starting migration to Supabase...')
    
    try {
      // 1. Crear usuario de prueba
      await this.createTestUsers()
      
      // 2. Limpiar y recrear tags
      await this.migrateTags()
      
      // 3. Migrar tareas
      await this.migrateTasks()
      
      console.log('✅ Migration completed successfully!')
      return true
      
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }

  private async createTestUsers() {
    console.log('👤 Creating test users...')
    
    // Crear un admin y un usuario para las pruebas
    const users: UserInsert[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000', // UUID fijo para admin
        email: 'admin@tasks-concept.com',
        name: 'Administrador',
        role: 'admin'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001', // UUID fijo para usuario
        email: 'usuario@tasks-concept.com', 
        name: 'Usuario de Prueba',
        role: 'user'
      }
    ]

    // Verificar si ya existen los usuarios
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .in('id', users.map(u => u.id))

    if (existingUsers && existingUsers.length > 0) {
      console.log('👤 Users already exist, skipping...')
      return
    }

    const { error } = await supabase
      .from('users')
      .insert(users)

    if (error) throw error
    
    console.log(`✅ Created ${users.length} test users`)
  }

  private async migrateTags() {
    console.log('🏷️ Migrating tags...')
    
    // Limpiar tags existentes (excepto los que ya se crearon manualmente)
    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .neq('category', 'Prueba') // Mantener tags de prueba que ya se crearon

    if (deleteError) {
      console.warn('Warning cleaning existing tags:', deleteError)
    }

    // Insertar todos los tags del mock con UUIDs consistentes
    const tagsToInsert: TagInsert[] = mockTags.map((tag, index) => ({
      id: `tag-${String(index + 1).padStart(3, '0')}-${tag.id.slice(-12)}`, // UUID consistente
      name: tag.name,
      color: tag.color,
      category: tag.category || null
    }))

    const { error } = await supabase
      .from('tags')
      .insert(tagsToInsert)

    if (error) throw error
    
    console.log(`✅ Migrated ${tagsToInsert.length} tags`)
  }

  private async migrateTasks() {
    console.log('📋 Migrating tasks and subtasks...')
    
    // Obtener los IDs de los tags para hacer la relación
    const { data: tagsInDb } = await supabase
      .from('tags')
      .select('id, name')

    if (!tagsInDb) throw new Error('No tags found in database')

    // Crear mapa de nombres a IDs de tags
    const tagNameToId = new Map(tagsInDb.map(tag => [tag.name, tag.id]))

    for (const mockTask of mockTasks) {
      console.log(`📝 Migrating task: ${mockTask.title}`)
      
      // 1. Insertar la tarea
      const taskInsert: TaskInsert = {
        id: mockTask.id,
        title: mockTask.title,
        description: mockTask.description,
        status: mockTask.status,
        priority: mockTask.priority,
        due_date: mockTask.dueDate?.toISOString() || null,
        estimated_duration: mockTask.estimatedDuration || null,
        project_name: mockTask.projectName,
        location: mockTask.location,
        assigned_to: '550e8400-e29b-41d4-a716-446655440001' // Asignar al usuario de prueba
      }

      const { error: taskError } = await supabase
        .from('tasks')
        .insert(taskInsert)

      if (taskError) throw taskError

      // 2. Insertar subtareas
      if (mockTask.subtasks.length > 0) {
        const subtasksInsert: SubtaskInsert[] = mockTask.subtasks.map(subtask => ({
          id: subtask.id,
          task_id: mockTask.id,
          title: subtask.title,
          description: subtask.description,
          is_completed: subtask.isCompleted,
          order_index: subtask.order,
          created_at: subtask.createdAt.toISOString(),
          completed_at: subtask.completedAt?.toISOString() || null
        }))

        const { error: subtasksError } = await supabase
          .from('subtasks')
          .insert(subtasksInsert)

        if (subtasksError) throw subtasksError
        
        console.log(`  ✅ Added ${subtasksInsert.length} subtasks`)
      }

      // 3. Crear relaciones con tags
      if (mockTask.tags.length > 0) {
        const taskTagsInsert: TaskTagInsert[] = mockTask.tags
          .map(tag => {
            const tagId = tagNameToId.get(tag.name)
            if (!tagId) {
              console.warn(`Tag not found: ${tag.name}`)
              return null
            }
            return {
              task_id: mockTask.id,
              tag_id: tagId
            }
          })
          .filter(Boolean) as TaskTagInsert[]

        if (taskTagsInsert.length > 0) {
          const { error: taskTagsError } = await supabase
            .from('task_tags')
            .insert(taskTagsInsert)

          if (taskTagsError) throw taskTagsError
          
          console.log(`  ✅ Linked ${taskTagsInsert.length} tags`)
        }
      }
    }
    
    console.log(`✅ Migrated ${mockTasks.length} tasks with all their data`)
  }

  async checkMigrationStatus() {
    console.log('🔍 Checking migration status...')
    
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
    ])

    const status = {
      users: usersCount || 0,
      tasks: tasksCount || 0,
      subtasks: subtasksCount || 0,
      tags: tagsCount || 0,
      taskTags: taskTagsCount || 0
    }

    console.log('📊 Database status:', status)
    return status
  }

  async clearAllData() {
    console.log('🗑️ Clearing all data for fresh migration...')
    
    // Eliminar en orden correcto debido a las foreign keys
    await supabase.from('task_tags').delete().neq('task_id', '')
    await supabase.from('subtasks').delete().neq('id', '')
    await supabase.from('tasks').delete().neq('id', '')
    await supabase.from('tags').delete().neq('id', '')
    await supabase.from('users').delete().neq('id', '')
    
    console.log('✅ All data cleared')
  }
}

// Instancia singleton
export const supabaseMigration = new SupabaseMigration() 