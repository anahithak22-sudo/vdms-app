import { toast } from 'sonner';
import type { ServiceResponse } from '@/types/api';

/**
 * Thin wrapper over sonner giving a single, consistent toast vocabulary.
 * `fromResult` surfaces a service error message or an optional success message.
 */
export function useToast() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast.info(message),
    fromResult<T>(result: ServiceResponse<T>, successMessage?: string): boolean {
      if (result.success) {
        if (successMessage) toast.success(successMessage);
        return true;
      }
      toast.error(result.message ?? 'Произошла ошибка');
      return false;
    },
  };
}
