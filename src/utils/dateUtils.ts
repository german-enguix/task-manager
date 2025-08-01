import { WorkDay } from '@/types';

/**
 * Determina si una fecha es anterior al día actual (día pasado)
 * @param date - Fecha a verificar
 * @returns true si la fecha es anterior al día actual
 */
export const isPastDay = (date: Date): boolean => {
  const today = new Date();
  // Crear fecha de inicio del día actual (00:00:00)
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // Crear fecha de inicio del día objetivo (00:00:00)
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  return targetDate < startOfToday;
};

/**
 * Determina si un WorkDay debe estar en modo solo lectura
 * Solo lectura = días pasados (anteriores al día actual)
 * @param workDay - WorkDay a verificar
 * @returns true si debe estar en modo solo lectura
 */
export const isDayReadOnly = (workDay: WorkDay): boolean => {
  return isPastDay(workDay.date);
};

/**
 * Determina si una fecha es el día actual
 * @param date - Fecha a verificar
 * @returns true si es el día actual
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  const targetDate = new Date(date);
  
  return today.getFullYear() === targetDate.getFullYear() &&
         today.getMonth() === targetDate.getMonth() &&
         today.getDate() === targetDate.getDate();
};

/**
 * Determina si una fecha es futura (posterior al día actual)
 * @param date - Fecha a verificar
 * @returns true si la fecha es futura
 */
export const isFutureDay = (date: Date): boolean => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  return targetDate > startOfToday;
};

/**
 * Obtiene el tipo de día para mostrar información al usuario
 * @param date - Fecha a verificar
 * @returns 'past' | 'today' | 'future'
 */
export const getDayType = (date: Date): 'past' | 'today' | 'future' => {
  if (isPastDay(date)) return 'past';
  if (isToday(date)) return 'today';
  return 'future';
}; 