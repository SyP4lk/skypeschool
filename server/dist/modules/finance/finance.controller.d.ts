import { Response } from 'express';
import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly service;
    constructor(service: FinanceService);
    getBalance(req: any): Promise<{
        balance: number;
        currency: string;
    }>;
    listMine(req: any, q: any): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    exportCsv(res: Response, q: any): Promise<void>;
}
