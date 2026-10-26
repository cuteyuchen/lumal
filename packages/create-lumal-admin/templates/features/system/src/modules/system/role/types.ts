import type { Status } from '../../../shared/api';

export interface RoleInput {
  code: string;
  name: string;
  description: string;
  status: Status;
}
export interface Role extends RoleInput {
  id: string;
  builtIn: boolean;
}
