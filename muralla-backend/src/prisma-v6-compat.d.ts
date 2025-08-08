// Compatibility shims for Prisma v6 type exports
// Prisma v5 used to export model, input, and enum types at the top level of `@prisma/client`.
// In Prisma v6 these were moved under the `Prisma` namespace.  To avoid touching dozens of
// import statements, we re-export the commonly-used names here by augmenting the module.
// Add more aliases below if the compiler complains about additional missing types.

import '@prisma/client';
import { Prisma } from '@prisma/client';

// Re-export Prisma namespace for files that import it directly
export { Prisma } from '@prisma/client';

declare module '@prisma/client' {
  /* Models */
  export type User = Prisma.User;
  export type Role = Prisma.Role;
  export type Task = Prisma.Task;
  export type Project = Prisma.Project;
  export type PTO = Prisma.PTO;

  /* Finance & Other Enums */
  export const TransactionType: typeof Prisma.TransactionType;
  export type TransactionType = Prisma.TransactionType;
  export const TransactionStatus: typeof Prisma.TransactionStatus;
  export type TransactionStatus = Prisma.TransactionStatus;
  export const PaymentMethod: typeof Prisma.PaymentMethod;
  export type PaymentMethod = Prisma.PaymentMethod;
  export const NotificationType: typeof Prisma.NotificationType;
  export type NotificationType = Prisma.NotificationType;
  export const NotificationStatus: typeof Prisma.NotificationStatus;
  export type NotificationStatus = Prisma.NotificationStatus;
  export const RuleTrigger: typeof Prisma.RuleTrigger;
  export type RuleTrigger = Prisma.RuleTrigger;
  export const DocumentType: typeof Prisma.DocumentType;
  export type DocumentType = Prisma.DocumentType;
  export const DocumentStatus: typeof Prisma.DocumentStatus;
  export type DocumentStatus = Prisma.DocumentStatus;

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

  // Model delegate shims (added for v6 compatibility)
  interface PrismaClient {
    user: any;
    role: any;
    task: any;
    pTORequest: any;
    [model: string]: any;
    $queryRawUnsafe<T = any>(query: string, ...params: any[]): Prisma.PrismaPromise<T>;
  }

  namespace Prisma {
    // Add missing Input types that don't exist in v6
    export type UserCreateInput = import('@prisma/client').Prisma.UserCreateArgs['data'];
    export type UserUpdateInput = import('@prisma/client').Prisma.UserUpdateArgs['data'];
    export type TaskCreateInput = import('@prisma/client').Prisma.TaskCreateArgs['data'];
    export type TaskUpdateInput = import('@prisma/client').Prisma.TaskUpdateArgs['data'];
    export type RoleCreateInput = import('@prisma/client').Prisma.RoleCreateArgs['data'];
    export type RoleUpdateInput = import('@prisma/client').Prisma.RoleUpdateArgs['data'];
    export type ProjectCreateInput = import('@prisma/client').Prisma.ProjectCreateArgs['data'];
    export type ProjectUpdateInput = import('@prisma/client').Prisma.ProjectUpdateArgs['data'];
    export type PrismaPromise<T = any> = import('@prisma/client').Prisma.PrismaPromise<T>;
    export type ProductCreateInput = import('@prisma/client').Prisma.ProductCreateArgs['data'];
    export type ProductUpdateInput = import('@prisma/client').Prisma.ProductUpdateArgs['data'];
    export type SaleCreateInput = import('@prisma/client').Prisma.SaleCreateArgs['data'];
    export type DocumentWhereInput = import('@prisma/client').Prisma.DocumentWhereInput;
    export type TransactionCategoryCreateInput = import('@prisma/client').Prisma.TransactionCategoryCreateArgs['data'];
  }


  /* Finance Inputs */
  export type BankAccountCreateInput = Prisma.BankAccountCreateInput;
}
