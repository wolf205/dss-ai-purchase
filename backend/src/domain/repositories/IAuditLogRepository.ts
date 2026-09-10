export interface CreateAuditLogData {
  userId?: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
}

export interface IAuditLogRepository {
  create(data: CreateAuditLogData): Promise<void>;
}
