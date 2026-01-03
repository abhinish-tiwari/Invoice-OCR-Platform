import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductService } from '../services/product.service';
import type { ProductListParams, CreateProductData, UpdateProductData } from '../types/product.types';

const QUERY_KEYS = {
  products: 'products',
  product: 'product',
  categories: 'product-categories',
};

/**
 * Hook for fetching paginated product list
 */
export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.products, params],
    queryFn: () => ProductService.getProducts(params),
  });
}

/**
 * Hook for fetching a single product
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.product, id],
    queryFn: () => ProductService.getProductById(id),
    enabled: !!id,
  });
}

/**
 * Hook for fetching product categories
 */
export function useProductCategories() {
  return useQuery({
    queryKey: [QUERY_KEYS.categories],
    queryFn: () => ProductService.getCategories(),
  });
}

/**
 * Hook for creating a product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductData) => ProductService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.products] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] });
    },
  });
}

/**
 * Hook for updating a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) =>
      ProductService.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.products] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.product, id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] });
    },
  });
}

/**
 * Hook for deleting a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ProductService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.products] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.categories] });
    },
  });
}

/**
 * Hook for searching products
 */
export function useSearchProducts(query: string, limit?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.products, 'search', query, limit],
    queryFn: () => ProductService.searchProducts(query, limit),
    enabled: query.length >= 2,
  });
}

