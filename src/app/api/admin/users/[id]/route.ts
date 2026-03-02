import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { role } = body;

        if (!role || (role !== "USER" && role !== "ADMIN")) {
            return new NextResponse("Invalid role", { status: 400 });
        }

        const user = await prisma.user.update({
            where: {
                id: params.id,
            },
            data: {
                role,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[ADMIN_USER_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.delete({
            where: {
                id: params.id,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[ADMIN_USER_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
