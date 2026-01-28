import { WithdrawalsService } from './withdrawals.service';
export declare class WithdrawalsController {
    private readonly service;
    constructor(service: WithdrawalsService);
    createMy(req: any, body: {
        amount: number;
        notes?: string;
    }): Promise<any>;
    myList(req: any, page?: string, limit?: string): Promise<any>;
}
