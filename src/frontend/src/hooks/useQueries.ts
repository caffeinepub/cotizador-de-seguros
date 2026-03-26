import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminStats, InsurancePlan, Quote, UserProfile } from "../backend";
import { backendClient as backend } from "../backendClient";

export function usePlans() {
  return useQuery<InsurancePlan[]>({
    queryKey: ["plans"],
    queryFn: () => backend.getPlans(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyQuotes() {
  return useQuery<Quote[]>({
    queryKey: ["myQuotes"],
    queryFn: async () => {
      const profile = await backend.getCallerUserProfile();
      if (!profile) return [];
      const all = await backend.getAllQuotes();
      return all.filter((q) => q.agentName === profile.username);
    },
    refetchInterval: 10000,
  });
}

export function useAllQuotes() {
  return useQuery<Quote[]>({
    queryKey: ["allQuotes"],
    queryFn: () => backend.getAllQuotes(),
    refetchInterval: 10000,
  });
}

export function useAllUsers() {
  return useQuery<UserProfile[]>({
    queryKey: ["allUsers"],
    queryFn: () => backend.getAllUsers(),
    refetchInterval: 5000,
  });
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["adminStats"],
    queryFn: () => backend.getAdminStats(),
    refetchInterval: 5000,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      clientName: string;
      clientAge: bigint;
      clientEmail: string;
      planId: bigint;
    }) =>
      backend.createQuote(
        args.clientName,
        args.clientAge,
        args.clientEmail,
        args.planId,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myQuotes"] });
      qc.invalidateQueries({ queryKey: ["allQuotes"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quoteId: bigint) => backend.markQuotePaid(quoteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myQuotes"] });
      qc.invalidateQueries({ queryKey: ["allQuotes"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useSetUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { userId: string; isActive: boolean }) =>
      backend.setUserActive(Principal.fromText(args.userId), args.isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUsers"] });
      qc.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { userId: string; newRole: string }) =>
      backend.updateUserRole(Principal.fromText(args.userId), args.newRole),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}
