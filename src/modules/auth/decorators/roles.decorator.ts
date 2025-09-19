import { SetMetadata } from '@nestjs/common';
import { Cargo } from '../../usuario/enums/cargo.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Cargo[]) => SetMetadata(ROLES_KEY, roles);