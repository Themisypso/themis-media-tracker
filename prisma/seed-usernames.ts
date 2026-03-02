import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        where: {
            username: null
        }
    })

    console.log(`Found ${users.length} users missing a username. Updating...`)

    for (const user of users) {
        const baseName = (user.name || 'user').toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 15)
        // Make it unique by appending ID substring
        const uniqueSuffix = user.id.slice(-4)
        const newUsername = `${baseName}_${uniqueSuffix}`

        await prisma.user.update({
            where: { id: user.id },
            data: { username: newUsername }
        })
        console.log(`Updated user ${user.email} -> @${newUsername}`)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
