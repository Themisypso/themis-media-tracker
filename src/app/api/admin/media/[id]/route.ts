import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/utils/media";

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || !isAdminRole(session.user.role)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const media = await prisma.mediaItem.delete({
            where: { id: params.id }
        });

        return NextResponse.json(media);
    } catch (error) {
        console.error("[ADMIN_MEDIA_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
