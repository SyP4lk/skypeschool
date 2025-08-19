import { CreateTrialRequestDto } from './dto/create-trial-request.dto';
import { TrialRequestsService } from './trial-requests.service';
export declare class TrialRequestsController {
    private readonly svc;
    constructor(svc: TrialRequestsService);
    create(dto: CreateTrialRequestDto): Promise<{
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
