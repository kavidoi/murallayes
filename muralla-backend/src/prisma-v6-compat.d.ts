// Compatibility shims for Prisma v6 type exports
// Prisma v5 used to export model, input, and enum types at the top level of `@prisma/client`.
// In Prisma v6 these were moved under the `Prisma` namespace.  To avoid touching dozens of
// import statements, we re-export the commonly-used names here by augmenting the module.
// Add more aliases below if the compiler complains about additional missing types.

import '@prisma/client';
import { Prisma } from '@prisma/client';

declare module '@prisma/client' {
  /* Models */
  export type User = Prisma.User;
  export type Role = Prisma.Role;
  export type Task = Prisma.Task;
  export type Project = Prisma.Project;
  export type PTO = Prisma.PTO;

  /* Enums */
  export const PTOStatus: typeof Prisma.PTOStatus;
  export type PTOStatus = Prisma.PTOStatus;

  /* Input types */
  export type UserCreateInput = Prisma.UserCreateInput;
  export type UserUpdateInput = Prisma.UserUpdateInput;
  export type RoleCreateInput = Prisma.RoleCreateInput;
  export type RoleUpdateInput = Prisma.RoleUpdateInput;
  export type TaskCreateInput = Prisma.TaskCreateInput;
  export type TaskUpdateInput = Prisma.TaskUpdateInput;
  export type ProjectCreateInput = Prisma.ProjectCreateInput;
  export type ProjectUpdateInput = Prisma.ProjectUpdateInput;
  export type PTOCreateInput = Prisma.PTOCreateInput;
  export type PTOUpdateInput = Prisma.PTOUpdateInput;
}
