/**
 * Validaciones estrictas para nombres de usuario y nombres visibles en NexStudio.
 * Restricciones solicitadas por el usuario:
 * - Solo letras (a-z, A-Z, con tildes y eñes).
 * - Cero números, cero símbolos, cero caracteres especiales.
 * - Prohibición estricta de palabras asociadas a: nexuslz, nexus, nexstudio, admin, soporte, etc.
 */

export const FORBIDDEN_WORDS = [
  'nexuslz',
  'nexus',
  'nexstudio',
  'studio',
  'admin',
  'administrator',
  'administrador',
  'soporte',
  'support',
  'moderador',
  'moderator',
  'staff',
  'oficial',
  'official',
  'root',
  'system',
  'sistema'
];

/**
 * Solo letras del alfabeto latino incluyendo acentos y eñes: a-z, A-Z, áéíóú, ñ
 */
export const LETTERS_ONLY_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/;

/**
 * Solo letras y espacios simples para el nombre visible (displayName)
 */
export const LETTERS_AND_SPACES_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateUsername = (username: string, isSuperAdmin: boolean = false): ValidationResult => {
  // SuperAdmin (allnexuslzyt@gmail.com) tiene libertad total sin restricciones de nombre o formato
  if (isSuperAdmin) {
    return { isValid: true };
  }

  const trimmed = username.trim();

  if (!trimmed) {
    return { isValid: false, error: 'El nombre de usuario es obligatorio.' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'El nombre de usuario debe tener al menos 3 letras.' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: 'El nombre de usuario no puede superar las 20 letras.' };
  }

  // Comprobar si tiene números
  if (/\d/.test(trimmed)) {
    return { isValid: false, error: 'No se permiten números en el nombre de usuario. Solo letras.' };
  }

  // Comprobar si tiene símbolos, espacios o caracteres especiales
  if (!LETTERS_ONLY_REGEX.test(trimmed)) {
    return { isValid: false, error: 'No se permiten símbolos, guiones ni espacios. Solo letras.' };
  }

  // Comprobar palabras prohibidas
  const lower = trimmed.toLowerCase();
  for (const forbidden of FORBIDDEN_WORDS) {
    if (lower.includes(forbidden)) {
      return { 
        isValid: false, 
        error: `No puedes usar términos reservados como "${forbidden}". Elige un nombre de usuario auténtico.` 
      };
    }
  }

  return { isValid: true };
};

export const validateDisplayName = (displayName: string, isSuperAdmin: boolean = false): ValidationResult => {
  // SuperAdmin (allnexuslzyt@gmail.com) tiene libertad total sin restricciones
  if (isSuperAdmin) {
    return { isValid: true };
  }

  const trimmed = displayName.trim();

  if (!trimmed) {
    return { isValid: false, error: 'El nombre visible es obligatorio.' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'El nombre visible debe tener al menos 2 letras.' };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: 'El nombre visible no puede superar las 30 letras.' };
  }

  // Comprobar si tiene números
  if (/\d/.test(trimmed)) {
    return { isValid: false, error: 'No se permiten números en el nombre visible. Solo letras.' };
  }

  // Comprobar si tiene símbolos o caracteres especiales
  if (!LETTERS_AND_SPACES_REGEX.test(trimmed)) {
    return { isValid: false, error: 'No se permiten símbolos ni caracteres especiales. Solo letras y espacios.' };
  }

  // Comprobar palabras prohibidas
  const lower = trimmed.toLowerCase();
  for (const forbidden of FORBIDDEN_WORDS) {
    if (lower.includes(forbidden)) {
      return { 
        isValid: false, 
        error: `El nombre visible no puede contener palabras reservadas como "${forbidden}".` 
      };
    }
  }

  return { isValid: true };
};
