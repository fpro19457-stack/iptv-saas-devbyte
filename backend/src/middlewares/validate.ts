import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { error } from '../utils/response';

export function validate(req: Request, res: Response, next: Function) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    return error(res, messages, 400);
  }
  next();
}
