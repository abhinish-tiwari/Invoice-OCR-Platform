import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupplierService } from '../services/supplier.service';
import type { SupplierListParams, CreateSupplierData, UpdateSupplierData } from '../types/supplier.types';

const QUERY_KEYS = {
  suppliers: 'suppliers',
  supplier: 'supplier',
};

/**
 * Hook for fetching paginated supplier list
 */
export function useSuppliers(params?: SupplierListParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.suppliers, params],
    queryFn: () => SupplierService.getSuppliers(params),
  });
}

/**
 * Hook for fetching a single supplier
 */
export function useSupplier(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.supplier, id],
    queryFn: () => SupplierService.getSupplierById(id),
    enabled: !!id,
  });
}

/**
 * Hook for creating a supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierData) => SupplierService.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.suppliers] });
    },
  });
}

/**
 * Hook for updating a supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierData }) =>
      SupplierService.updateSupplier(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.suppliers] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.supplier, id] });
    },
  });
}

/**
 * Hook for deleting a supplier
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SupplierService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.suppliers] });
    },
  });
}

/**
 * Hook for searching suppliers
 */
export function useSearchSuppliers(query: string, limit?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.suppliers, 'search', query, limit],
    queryFn: () => SupplierService.searchSuppliers(query, limit),
    enabled: query.length >= 2,
  });
}

