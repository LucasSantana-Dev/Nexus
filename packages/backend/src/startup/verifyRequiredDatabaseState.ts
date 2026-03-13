import { getPrismaClient } from '@lucky/shared/utils'

export class DatabaseSchemaStateError extends Error {
    readonly code = 'ERR_DB_SCHEMA_MISSING'
    readonly table: string

    constructor(table: string, cause?: unknown) {
        super(
            `Required database relation "${table}" is missing. Run migrations before starting backend.`,
        )
        this.name = 'DatabaseSchemaStateError'
        this.table = table
        if (cause !== undefined) {
            ;(this as Error & { cause?: unknown }).cause = cause
        }
    }
}

export async function verifyRequiredDatabaseState(): Promise<void> {
    const prisma = getPrismaClient()

    try {
        await prisma.guildRoleGrant.count({
            take: 1,
        })
    } catch (error) {
        const maybePrismaError = error as {
            code?: string
            message?: string
            meta?: { table?: string }
        }

        if (maybePrismaError.code === 'P2021') {
            const table = maybePrismaError.meta?.table ?? 'guild_role_grants'
            throw new DatabaseSchemaStateError(table, error)
        }

        throw error
    }
}
