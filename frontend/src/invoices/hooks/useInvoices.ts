import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InvoiceService } from '../services/invoice.service';
import type { InvoiceListParams, UpdateInvoiceData } from '../types/invoice.types';

// Query keys for cache management
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (params?: InvoiceListParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  stats: () => [...invoiceKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch paginated invoice list
 */
export function useInvoiceList(params?: InvoiceListParams) {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => InvoiceService.getInvoices(params),
    select: (response) => response.data,
  });
}

/**
 * Hook to fetch invoice stats
 */
export function useInvoiceStats() {
  return useQuery({
    queryKey: invoiceKeys.stats(),
    queryFn: () => InvoiceService.getStats(),
    select: (response) => response.data.counts,
  });
}

/**
 * Hook to fetch a single invoice by ID
 */
export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => InvoiceService.getInvoiceById(id),
    select: (response) => response.data.invoice,
    enabled: !!id,
  });
}

/**
 * Hook for uploading invoices
 */
export function useUploadInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      processOcr = false,
      onProgress
    }: {
      file: File;
      processOcr?: boolean;
      onProgress?: (percent: number) => void;
    }) => InvoiceService.uploadInvoice(file, processOcr, onProgress),
    onSuccess: () => {
      // Invalidate invoice list and stats after upload
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
}

/**
 * Hook for updating invoices
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceData }) =>
      InvoiceService.updateInvoice(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific invoice and list
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
}

/**
 * Hook for deleting invoices
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => InvoiceService.deleteInvoice(id),
    onSuccess: () => {
      // Invalidate invoice list and stats after deletion
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
}

/**
 * Hook for processing OCR on an invoice
 */
export function useProcessOcr() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => InvoiceService.processOcr(invoiceId),
    onSuccess: (_, invoiceId) => {
      // Invalidate invoice list and detail after OCR processing
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
}

// Query keys for invoice lines
export const invoiceLineKeys = {
  all: ['invoiceLines'] as const,
  byInvoice: (invoiceId: string) => [...invoiceLineKeys.all, invoiceId] as const,
};

/**
 * Hook to fetch invoice lines
 */
export function useInvoiceLines(invoiceId: string) {
  return useQuery({
    queryKey: invoiceLineKeys.byInvoice(invoiceId),
    queryFn: () => InvoiceService.getInvoiceLines(invoiceId),
    select: (response) => response.data.lines,
    enabled: !!invoiceId,
  });
}

/**
 * Hook for updating a line item
 */
export function useUpdateLineItem(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lineId, data }: { lineId: string; data: Parameters<typeof InvoiceService.updateLineItem>[2] }) =>
      InvoiceService.updateLineItem(invoiceId, lineId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceLineKeys.byInvoice(invoiceId) });
    },
  });
}

/**
 * Hook for marking invoice as reviewed
 */
export function useMarkReviewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => InvoiceService.markReviewed(invoiceId),
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.stats() });
    },
  });
}
