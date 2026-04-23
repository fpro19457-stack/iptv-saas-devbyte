import { Request, Response } from 'express';
import { body } from 'express-validator';
import prisma from '../../../config/database';
import { comparePassword } from '../../../utils/password';
import { generateAdminToken } from '../../../utils/jwt';
import { success, error } from '../../../utils/response';
import { validate } from '../../../middlewares/validate';

interface AuthRequest extends Request {
  admin?: { id: string; username: string; role: string };
}

export const loginValidation = [
  body('username').notEmpty().withMessage('Usuario requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  validate,
];

export async function login(req: AuthRequest, res: Response) {
  try {
    const { username, password } = req.body;

    const admin = await prisma.adminUser.findUnique({ where: { username } });

    if (!admin) {
      return error(res, 'Credenciales incorrectas', 401);
    }

    const validPassword = await comparePassword(password, admin.passwordHash);
    if (!validPassword) {
      return error(res, 'Credenciales incorrectas', 401);
    }

    const token = generateAdminToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    });

    return success(res, {
      accessToken: token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    }, 'Login exitoso');
  } catch (err) {
    return error(res, 'Error en el servidor', 500);
  }
}

export async function logout(req: AuthRequest, res: Response) {
  return success(res, null, 'Logout exitoso');
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.admin!.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    if (!admin) {
      return error(res, 'Admin no encontrado', 404);
    }

    return success(res, admin);
  } catch (err) {
    return error(res, 'Error al obtener admin', 500);
  }
}
