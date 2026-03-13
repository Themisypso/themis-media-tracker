import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/utils/media";
import bcrypt from "bcryptjs";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || !isAdminRole(session.user.role)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { role, username, name, newPassword, steamId } = body;

        const updateData: Record<string, unknown> = {};

        if (steamId === null) {
            updateData.steamId = null as any;
        }

        if (role) {
            if (!["USER", "ADMIN", "MODERATOR", "SUPERADMIN"].includes(role)) {
                return new NextResponse("Invalid role", { status: 400 });
            }
            updateData.role = role;
        }

        if (name !== undefined) updateData.name = name;

        if (username !== undefined) {
            const existing = await prisma.user.findFirst({
                where: { username, NOT: { id: params.id } }
            });
            if (existing) {
                return NextResponse.json({ error: "Username already taken" }, { status: 409 });
            }
            updateData.username = username;
        }

        if (newPassword) {
            if (newPassword.length < 8) {
                return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
            }
            updateData.password = await bcrypt.hash(newPassword, 12);
        }

        const user = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[ADMIN_USER_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || !isAdminRole(session.user.role)) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const user = await prisma.user.delete({ where: { id: params.id } });
        return NextResponse.json(user);
    } catch (error) {
        console.error("[ADMIN_USER_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
