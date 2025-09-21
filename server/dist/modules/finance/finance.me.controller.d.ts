import { FinanceService } from './finance.service';
export declare class FinanceMeController {
    private readonly service;
    constructor(service: FinanceService);
    getBalance(req: any): Promise<{
        balance: number;
        currency: string;
    }>;
    listMine(req: any, q: any): any;
}
