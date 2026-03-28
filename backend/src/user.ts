import { prisma } from "./prisma";

export const requestAccountDeletion = async (
  userId: string,
  reason: string,
) => {
  return await (prisma as any).accountDeletionRequest.create({
    data: {
      userId,
      reason,
      status: "pending",
      requestedAt: new Date(),
    },
  });
};
