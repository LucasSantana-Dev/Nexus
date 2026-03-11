import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import clearCommand from './clear'
import leaveCommand from './leave'
import lyricsCommand from './lyrics'
import moveCommand from './move'
import pauseCommand from './pause'
import removeCommand from './remove'
import repeatCommand from './repeat'
import resumeCommand from './resume'
import shuffleCommand from './shuffle'
import skipCommand from './skip'
import songinfoCommand from './songinfo'
import stopCommand from './stop'
import volumeCommand from './volume'

const requireGuildMock = jest.fn()
const requireQueueMock = jest.fn()
const requireCurrentTrackMock = jest.fn()
const requireIsPlayingMock = jest.fn()
const resolveGuildQueueMock = jest.fn()
const interactionReplyMock = jest.fn()
const featureToggleIsEnabledMock = jest.fn()

jest.mock('../../../utils/command/commandValidations', () => ({
    requireGuild: (...args: unknown[]) => requireGuildMock(...args),
    requireQueue: (...args: unknown[]) => requireQueueMock(...args),
    requireCurrentTrack: (...args: unknown[]) =>
        requireCurrentTrackMock(...args),
    requireIsPlaying: (...args: unknown[]) => requireIsPlayingMock(...args),
}))

jest.mock('../../../utils/music/queueResolver', () => ({
    resolveGuildQueue: (...args: unknown[]) => resolveGuildQueueMock(...args),
}))

jest.mock('../../../utils/general/interactionReply', () => ({
    interactionReply: (...args: unknown[]) => interactionReplyMock(...args),
}))

jest.mock('@lucky/shared/services', () => ({
    featureToggleService: {
        isEnabled: (...args: unknown[]) => featureToggleIsEnabledMock(...args),
    },
}))

jest.mock('../../../utils/general/embeds', () => ({
    errorEmbed: jest.fn(() => ({})),
    successEmbed: jest.fn(() => ({})),
    musicEmbed: jest.fn(() => ({
        setThumbnail: jest.fn(),
    })),
}))

jest.mock('@lucky/shared/utils', () => ({
    debugLog: jest.fn(),
    errorLog: jest.fn(),
    infoLog: jest.fn(),
}))

type CommandLike = {
    execute: (_params: unknown) => Promise<void>
}

type QueueCase = {
    name: string
    command: CommandLike
}

const queueValidationCases: QueueCase[] = [
    { name: 'clear', command: clearCommand },
    { name: 'leave', command: leaveCommand },
    { name: 'move', command: moveCommand },
    { name: 'pause', command: pauseCommand },
    { name: 'remove', command: removeCommand },
    { name: 'repeat', command: repeatCommand },
    { name: 'resume', command: resumeCommand },
    { name: 'shuffle', command: shuffleCommand },
    { name: 'skip', command: skipCommand },
    { name: 'songinfo', command: songinfoCommand },
    { name: 'stop', command: stopCommand },
    { name: 'volume', command: volumeCommand },
]

function createClient() {
    return {
        player: {},
    } as any
}

function createInteraction(): any {
    return {
        guildId: 'guild-1',
        user: {
            id: 'user-1',
        },
        options: {
            getString: jest.fn((name: string) => {
                if (name === 'mode') return 'off'
                if (name === 'song') return null
                return null
            }),
            getInteger: jest.fn(() => null),
        },
    }
}

describe('music command resolver wiring', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        requireGuildMock.mockResolvedValue(true)
        requireQueueMock.mockResolvedValue(false)
        requireCurrentTrackMock.mockResolvedValue(true)
        requireIsPlayingMock.mockResolvedValue(true)
        featureToggleIsEnabledMock.mockResolvedValue(true)
        resolveGuildQueueMock.mockReturnValue({
            queue: { id: 'queue-1' },
            source: 'cache.guild',
            diagnostics: {
                guildId: 'guild-1',
                cacheSize: 1,
                cacheSampleKeys: ['guild-1'],
            },
        })
    })

    for (const testCase of queueValidationCases) {
        it(`uses resolveGuildQueue in ${testCase.name}`, async () => {
            const client = createClient()
            const interaction = createInteraction()

            await testCase.command.execute({ client, interaction } as any)

            expect(resolveGuildQueueMock).toHaveBeenCalledWith(client, 'guild-1')
            expect(requireQueueMock).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'queue-1' }),
                interaction,
            )
            expect(interactionReplyMock).not.toHaveBeenCalled()
        })
    }

    it('uses resolveGuildQueue in lyrics when current track is required', async () => {
        const client = createClient()
        const interaction = createInteraction()
        requireCurrentTrackMock.mockResolvedValue(false)

        await lyricsCommand.execute({ client, interaction } as any)

        expect(featureToggleIsEnabledMock).toHaveBeenCalledWith(
            'LYRICS',
            expect.objectContaining({
                guildId: 'guild-1',
                userId: 'user-1',
            }),
        )
        expect(resolveGuildQueueMock).toHaveBeenCalledWith(client, 'guild-1')
        expect(requireCurrentTrackMock).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'queue-1' }),
            interaction,
        )
        expect(interactionReplyMock).not.toHaveBeenCalled()
    })
})
