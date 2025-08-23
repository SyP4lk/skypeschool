type TrialPayload = {
    name: string;
    email: string;
    phone: string;
    subject?: string;
    messenger?: string;
    comment?: string;
    teacherId?: string;
};
export declare class MailerService {
    private readonly log;
    sendTrialEmail(p: TrialPayload): Promise<void>;
    private buildTrialText;
    private sendViaSmtp;
    private sendViaBrevo;
}
export {};
