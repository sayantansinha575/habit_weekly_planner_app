import { prisma } from "./prisma";

export const requestAccountDeletion = async (
  userId: string,
  reason: string,
) => {
  return await (prisma as any).accountDeletionRequest.create({
    data: {
      user_id: userId,
      reason,
      status: "pending",
      requested_at: new Date(),
    },
  });
};
