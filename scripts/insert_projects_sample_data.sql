-- Script para insertar datos de ejemplo de proyectos
-- Ejecutar después de ejecutar create_projects_table.sql

-- 1. Insertar proyectos de ejemplo
INSERT INTO projects (
  id,
  name,
  description,
  status,
  priority,
  location,
  start_date,
  end_date,
  estimated_duration,
  actual_duration,
  supervisor_name,
  supervisor_email,
  assigned_team,
  required_resources,
  created_by,
  assigned_to
) VALUES 
-- Proyecto 1: En progreso
(
  '550e8400-e29b-41d4-a716-446655440010',
  'Renovación Centro Comercial Plaza Norte',
  'Proyecto integral de renovación y modernización del centro comercial, incluyendo sistemas eléctricos, climatización y acabados interiores.',
  'in_progress',
  'high',
  'Centro Comercial Plaza Norte, Madrid',
  '2024-11-01 08:00:00+00',
  '2024-12-20 18:00:00+00',
  50,
  25,
  'Ana García Rodríguez',
  'ana.garcia@construcciones.com',
  ARRAY['Juan Pérez', 'María López', 'Carlos Martín', 'Elena Torres'],
  ARRAY['Grúa torre', 'Andamios certificados', 'Herramientas eléctricas', 'Materiales ignífugos'],
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001'
),

-- Proyecto 2: Programado
(
  '550e8400-e29b-41d4-a716-446655440011',
  'Instalación Sistema Solar Industrial',
  'Instalación de paneles solares y sistema de almacenamiento energético para nave industrial de 5000m².',
  'programmed',
  'medium',
  'Polígono Industrial Las Américas, Getafe',
  '2024-12-15 07:00:00+00',
  '2025-02-28 17:00:00+00',
  75,
  NULL,
  'Miguel Ángel Ruiz',
  'miguel.ruiz@energiasolar.es',
  ARRAY['Pedro Sánchez', 'Laura Jiménez', 'Roberto Gil'],
  ARRAY['Paneles solares 400W', 'Inversores trifásicos', 'Sistema montaje', 'Cableado DC/AC'],
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001'
),

-- Proyecto 3: Completado
(
  '550e8400-e29b-41d4-a716-446655440012',
  'Mantenimiento Preventivo Edificio Corporativo',
  'Revisión completa de sistemas HVAC, instalaciones eléctricas y estructura del edificio corporativo.',
  'completed',
  'low',
  'Torre Empresarial Azca, Madrid',
  '2024-09-01 08:00:00+00',
  '2024-10-30 17:00:00+00',
  60,
  58,
  'Carmen Delgado Vega',
  'carmen.delgado@mantenimiento.com',
  ARRAY['Alberto Fernández', 'Cristina Moreno'],
  ARRAY['Equipos de medición', 'Repuestos HVAC', 'Herramientas especializadas'],
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001'
),

-- Proyecto 4: Crítico
(
  '550e8400-e29b-41d4-a716-446655440013',
  'Reparación Urgente Puente Acceso',
  'Reparación estructural urgente del puente de acceso principal tras inspección de seguridad.',
  'in_progress',
  'critical',
  'Puente Acceso Norte, Alcalá de Henares',
  '2024-11-20 06:00:00+00',
  '2024-12-05 20:00:00+00',
  15,
  8,
  'Ingeniero José Luis Navarro',
  'joseluis.navarro@infraestructuras.gov.es',
  ARRAY['Equipo Especialista Estructuras', 'Soldadores Certificados', 'Inspector Técnico'],
  ARRAY['Acero estructural', 'Soldadura especializada', 'Grúa pesada', 'Equipos de seguridad'],
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001'
),

-- Proyecto 5: Cancelado
(
  '550e8400-e29b-41d4-a716-446655440014',
  'Ampliación Parking Subterráneo',
  'Proyecto de ampliación del parking subterráneo para 200 plazas adicionales.',
  'cancelled',
  'medium',
  'Centro Comercial Los Remedios, Sevilla',
  '2024-10-01 08:00:00+00',
  NULL,
  90,
  NULL,
  'Francisco Romero Santos',
  'francisco.romero@aparcamientos.es',
  ARRAY['Equipo de excavación', 'Especialistas hormigón'],
  ARRAY['Maquinaria pesada', 'Sistemas de ventilación', 'Hormigón armado'],
  '550e8400-e29b-41d4-a716-446655440000',
  NULL
);

-- 2. Insertar observaciones de supervisor
INSERT INTO supervisor_observations (
  id,
  project_id,
  supervisor_name,
  supervisor_role,
  observation,
  date,
  priority,
  is_resolved,
  resolved_at,
  resolved_by,
  resolution
) VALUES
-- Observaciones para Renovación Centro Comercial
(
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440010',
  'Ana García Rodríguez',
  'Jefe de Obra',
  'Se detectaron irregularidades en el cableado eléctrico de la zona norte. Es necesario revisar toda la instalación antes de proceder.',
  '2024-11-15 14:30:00+00',
  'high',
  true,
  '2024-11-16 10:00:00+00',
  'Juan Pérez',
  'Se realizó inspección completa y reemplazo del cableado defectuoso. Certificado por electricista autorizado.'
),
(
  '660e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440010',
  'Ana García Rodríguez',
  'Jefe de Obra',
  'Retraso en la entrega de materiales ignífugos. Afecta planificación de la semana próxima.',
  '2024-11-18 09:15:00+00',
  'medium',
  false,
  NULL,
  NULL,
  NULL
),

-- Observaciones para Proyecto Solar
(
  '660e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440011',
  'Miguel Ángel Ruiz',
  'Ingeniero Energético',
  'La estructura del tejado requiere refuerzos adicionales para soportar el peso de los paneles. Necesario estudio estructural.',
  '2024-11-25 11:00:00+00',
  'high',
  false,
  NULL,
  NULL,
  NULL
),

-- Observaciones para Reparación Puente (Crítico)
(
  '660e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440013',
  'José Luis Navarro',
  'Inspector Técnico Estructural',
  'URGENTE: Se observan nuevas fisuras en vigas principales. Requiere refuerzo inmediato antes de continuar trabajos.',
  '2024-11-22 16:45:00+00',
  'critical',
  false,
  NULL,
  NULL,
  NULL
),
(
  '660e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440013',
  'José Luis Navarro',
  'Inspector Técnico Estructural',
  'Condiciones meteorológicas adversas pueden afectar trabajos de soldadura. Planificar según previsión del tiempo.',
  '2024-11-21 08:30:00+00',
  'medium',
  true,
  '2024-11-21 14:00:00+00',
  'Equipo Especialista Estructuras',
  'Se ajustó cronograma considerando ventanas meteorológicas favorables para soldadura.'
),

-- Observación para proyecto completado
(
  '660e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440012',
  'Carmen Delgado Vega',
  'Responsable Mantenimiento',
  'Excelente trabajo del equipo. Todas las inspecciones completadas dentro del plazo y con máxima calidad.',
  '2024-10-29 16:00:00+00',
  'low',
  true,
  '2024-10-30 09:00:00+00',
  'Alberto Fernández',
  'Proyecto finalizado satisfactoriamente. Documentación entregada completa.'
);

-- 3. Actualizar algunas tareas existentes para vincularlas con proyectos
UPDATE tasks SET project_id = '550e8400-e29b-41d4-a716-446655440010' 
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',  -- Inspección eléctrica
  '550e8400-e29b-41d4-a716-446655440002'   -- Instalación HVAC
);

UPDATE tasks SET project_id = '550e8400-e29b-41d4-a716-446655440013' 
WHERE id = '550e8400-e29b-41d4-a716-446655440003';  -- Mantenimiento preventivo

-- 4. Verificar que las estadísticas se calculen correctamente
-- (Los triggers automáticamente actualizarán total_tasks, completed_tasks y completion_percentage)

-- Ejemplo de consulta para verificar los datos:
-- SELECT p.name, p.total_tasks, p.completed_tasks, p.completion_percentage,
--        COUNT(so.id) as observations_count
-- FROM projects p
-- LEFT JOIN supervisor_observations so ON p.id = so.project_id
-- GROUP BY p.id, p.name, p.total_tasks, p.completed_tasks, p.completion_percentage
-- ORDER BY p.created_at DESC; 