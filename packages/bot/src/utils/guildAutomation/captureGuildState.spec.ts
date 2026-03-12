import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { captureGuildAutomationState } from './captureGuildState'

const getSettingsMock = jest.fn()
const getModerationSettingsMock = jest.fn()
const getWelcomeMessageMock = jest.fn()
const getLeaveMessageMock = jest.fn()
const listReactionRoleMessagesMock = jest.fn()
const listExclusiveRolesMock = jest.fn()
const listRoleGrantsMock = jest.fn()
const onboardingToManifestMock = jest.fn()

jest.mock('@lucky/shared/services', () => ({
    autoMessageService: {
        getWelcomeMessage: (...args: unknown[]) => getWelcomeMessageMock(...args),
        getLeaveMessage: (...args: unknown[]) => getLeaveMessageMock(...args),
    },
    autoModService: {
        getSettings: (...args: unknown[]) => getSettingsMock(...args),
    },
    getModerationSettings: (...args: unknown[]) => getModerationSettingsMock(...args),
    guildRoleAccessService: {
        listRoleGrants: (...args: unknown[]) => listRoleGrantsMock(...args),
    },
    reactionRolesService: {
        listReactionRoleMessages: (...args: unknown[]) =>
            listReactionRoleMessagesMock(...args),
    },
    roleManagementService: {
        listExclusiveRoles: (...args: unknown[]) => listExclusiveRolesMock(...args),
    },
    onboardingToManifest: (...args: unknown[]) => onboardingToManifestMock(...args),
}))

function createGuild(fetchOnboarding: jest.Mock) {
    return {
        id: '123456789012345678',
        name: 'Criativaria',
        fetchOnboarding,
        roles: {
            cache: new Map(),
        },
        channels: {
            cache: new Map(),
        },
        members: {
            cache: new Map([
                [
                    'bot-1',
                    {
                        id: 'bot-1',
                        user: {
                            bot: true,
                            username: 'LegacyBot',
                        },
                    },
                ],
            ]),
        },
    }
}

describe('captureGuildAutomationState', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getSettingsMock.mockResolvedValue(null)
        getModerationSettingsMock.mockResolvedValue(null)
        getWelcomeMessageMock.mockResolvedValue(null)
        getLeaveMessageMock.mockResolvedValue(null)
        listReactionRoleMessagesMock.mockResolvedValue([])
        listExclusiveRolesMock.mockResolvedValue([])
        listRoleGrantsMock.mockResolvedValue([])
        onboardingToManifestMock.mockReturnValue({
            enabled: false,
            mode: 0,
            defaultChannelIds: [],
            prompts: [],
        })
    })

    it('treats only onboarding-not-found errors as empty onboarding', async () => {
        const fetchOnboarding = jest.fn().mockRejectedValue({ status: 404 })
        const guild = createGuild(fetchOnboarding)

        const state = await captureGuildAutomationState(guild as any, 'lucky-bot-id')

        expect(onboardingToManifestMock).toHaveBeenCalledWith(
            '123456789012345678',
            null,
        )
        expect(state.parity?.externalBots).toEqual([
            {
                id: 'bot-1',
                name: 'LegacyBot',
                retireOnCutover: false,
            },
        ])
    })

    it('propagates onboarding fetch errors when not a missing-onboarding case', async () => {
        const fetchOnboarding = jest
            .fn()
            .mockRejectedValue(new Error('Missing permissions'))
        const guild = createGuild(fetchOnboarding)

        await expect(
            captureGuildAutomationState(guild as any, 'lucky-bot-id'),
        ).rejects.toThrow('Missing permissions')
    })
})
