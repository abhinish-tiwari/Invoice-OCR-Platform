import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminService } from '../services/admin.service';
import type { UserListParams } from '../types/admin.types';

const QUERY_KEYS = {
  stats: 'admin-stats',
  users: 'admin-users',
  user: 'admin-user',
};

/**
 * Hook for fetching system statistics
 */
export function useSystemStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.stats],
    queryFn: () => AdminService.getSystemStats(),
  });
}

/**
 * Hook for fetching paginated user list
 */
export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.users, params],
    queryFn: () => AdminService.getUsers(params),
  });
}

/**
 * Hook for fetching a single user
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.user, id],
    queryFn: () => AdminService.getUserById(id),
    enabled: !!id,
  });
}

/**
 * Hook for updating user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      AdminService.updateUserRole(id, role),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.user, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
}

/**
 * Hook for deleting a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => AdminService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.users] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] });
    },
  });
}

