export interface RegisterBody {
  correo?: string;
  password?: string;
  nombre?: string;
  rol?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateRegisterPayload = (body: any): ValidationResult => {

  if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
    return { 
      isValid: false, 
      error: 'El cuerpo de la solicitud es inválido o se encuentra completamente vacío.' 
    };
  }

  const { correo, password, nombre, rol } = body as RegisterBody;

  if (!correo || !correo.trim()) return { isValid: false, error: 'El campo "correo" es obligatorio.' };
  if (!password || !password.trim()) return { isValid: false, error: 'El campo "password" es obligatorio.' };
  if (!nombre || !nombre.trim()) return { isValid: false, error: 'El campo "nombre" es obligatorio.' };
  if (!rol || !rol.trim()) return { isValid: false, error: 'El campo "rol" es obligatorio.' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    return { isValid: false, error: 'El formato del correo electrónico no es válido.' };
  }

  const rolesPermitidos = ['Administrador', 'Operador', 'Cliente']; 
  if (!rolesPermitidos.includes(rol)) {
    return { 
      isValid: false, 
      error: `El rol proporcionado no es válido. Roles permitidos: ${rolesPermitidos.join(', ')}` 
    };
  }

  return { isValid: true };
};