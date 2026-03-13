import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/utils/media";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !isAdminRole(session.user.role)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        const media = await prisma.mediaItem.findMany({
            where: userId ? { userId } : undefined,
            select: {
                id: true,
                type: true,
                title: true,
                status: true,
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                updatedAt: "desc"
            }
        });

        // Limit to 500 for performance if no specific user is selected
        return NextResponse.json(userId ? media : media.slice(0, 500));
    } catch (error) {
        console.error("[ADMIN_MEDIA_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
