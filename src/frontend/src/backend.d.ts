import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Quote {
    id: bigint;
    status: Variant_pending_paid;
    clientName: string;
    planId: bigint;
    userId: Principal;
    createdAt: bigint;
    clientEmail: string;
    agentName: string;
    coverageAmount: bigint;
    clientAge: bigint;
    planName: string;
    paidAt?: bigint;
    monthlyPremium: bigint;
}
export interface AdminStats {
    activeUsers: bigint;
    totalQuotes: bigint;
    totalUsers: bigint;
    paidQuotes: bigint;
    pendingQuotes: bigint;
}
export interface UserProfile {
    username: string;
    lastActivity: bigint;
    role: string;
    isActive: boolean;
    email: string;
    registeredAt: bigint;
}
export interface InsurancePlan {
    id: bigint;
    name: string;
    description: string;
    coverageAmount: bigint;
    benefits: Array<string>;
    monthlyPremium: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_pending_paid {
    pending = "pending",
    paid = "paid"
}
export interface backendInterface {
    addInsurancePlan(name: string, description: string, benefits: Array<string>, coverageAmount: bigint, monthlyPremium: bigint): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createQuote(clientName: string, clientAge: bigint, clientEmail: string, planId: bigint): Promise<bigint>;
    getAdminStats(): Promise<AdminStats>;
    getAllQuotes(): Promise<Array<Quote>>;
    getAllUsers(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPlans(): Promise<Array<InsurancePlan>>;
    getQuotesByUser(userId: Principal): Promise<Array<Quote>>;
    getUserById(userId: Principal): Promise<UserProfile | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    login(username: string, password: string): Promise<string>;
    logout(token: string): Promise<boolean>;
    markQuotePaid(quoteId: bigint): Promise<boolean>;
    register(username: string, email: string, password: string, role: string): Promise<Principal>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setUserActive(userId: Principal, isActive: boolean): Promise<boolean>;
    updateUserRole(userId: Principal, newRole: string): Promise<boolean>;
    validateSession(token: string): Promise<[Principal, string] | null>;
}
