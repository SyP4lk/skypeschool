export declare class TrialRequestsService {
    private readonly logger;
    private emailEnabled;
    accept(payload: {
        name: string;
        phone?: string;
        email?: string;
        message?: string;
    }): Promise<{
        ok: boolean;
        mode: "noop";
    } | {
        ok: boolean;
        mode: "email";
    }>;
    status(): {
        emailEnabled: boolean;
    };
}
