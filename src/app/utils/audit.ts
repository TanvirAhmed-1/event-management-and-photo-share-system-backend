import prisma from "./prisma";

interface IAuditParams {
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}

export const logAudit = async (params: IAuditParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        before: params.before ? (JSON.parse(JSON.stringify(params.before))) : undefined,
        after: params.after ? (JSON.parse(JSON.stringify(params.after))) : undefined,
        ip: params.ip || null,
      },
    });
  } catch (error) {
    console.error("[AuditLog Error]:", error);
  }
};

