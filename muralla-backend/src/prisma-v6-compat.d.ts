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

// --------------------------------------------------------------------------------
// Legacy names inside the Prisma namespace (e.g., Prisma.UserCreateInput)
// --------------------------------------------------------------------------------

declare module '@prisma/client' {
  namespace Prisma {
    interface PrismaClient {
      $queryRawUnsafe<T = any>(query: string, ...params: any[]): Prisma.PrismaPromise<T>;
    }
    // Map removed *CreateInput / *UpdateInput names to the new canonical aliases
    // so existing code that references Prisma.UserCreateInput continues to work.
    // They are inferred from the corresponding Args types so they stay in sync.
    // For models where unchecked variants exist, we map to them; otherwise to Args.

    type UserCreateInput = import('@prisma/client').Prisma.UserCreateArgs['data'];
    type UserUpdateInput = import('@prisma/client').Prisma.UserUpdateArgs['data'];

    type RoleCreateInput = import('@prisma/client').Prisma.RoleCreateArgs['data'];
    type RoleUpdateInput = import('@prisma/client').Prisma.RoleUpdateArgs['data'];

    type TaskCreateInput = import('@prisma/client').Prisma.TaskCreateArgs['data'];
    type TaskUpdateInput = import('@prisma/client').Prisma.TaskUpdateArgs['data'];

    type ProjectCreateInput = import('@prisma/client').Prisma.ProjectCreateArgs['data'];
    type ProjectUpdateInput = import('@prisma/client').Prisma.ProjectUpdateArgs['data'];

    type PTOCreateInput = import('@prisma/client').Prisma.PTOCreateArgs['data'];
    type PTOUpdateInput = import('@prisma/client').Prisma.PTOUpdateArgs['data'];

    // Inventory models
    type ProductCreateInput = import('@prisma/client').Prisma.ProductCreateArgs['data'];
    type ProductUpdateInput = import('@prisma/client').Prisma.ProductUpdateArgs['data'];
    type SaleCreateInput = import('@prisma/client').Prisma.SaleCreateArgs['data'];

    // Knowledge models
    type DocumentWhereInput = import('@prisma/client').Prisma.DocumentWhereInput;
    const DocumentType: typeof import('@prisma/client').Prisma.DocumentType;
    type DocumentType = import('@prisma/client').Prisma.DocumentType;
    const DocumentStatus: typeof import('@prisma/client').Prisma.DocumentStatus;
    type DocumentStatus = import('@prisma/client').Prisma.DocumentStatus;

    // Notifications
    const RuleTrigger: typeof import('@prisma/client').Prisma.RuleTrigger;
    type RuleTrigger = import('@prisma/client').Prisma.RuleTrigger;

    // Enums preserved as const enums mapping
    const NotificationType: typeof import('@prisma/client').Prisma.NotificationType;
    type NotificationType = import('@prisma/client').Prisma.NotificationType;

    const NotificationStatus: typeof import('@prisma/client').Prisma.NotificationStatus;
    type NotificationStatus = import('@prisma/client').Prisma.NotificationStatus;
  }
}
