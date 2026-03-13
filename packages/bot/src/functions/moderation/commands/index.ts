import { getCommandsFromDirectory } from '../../../utils/command/getCommandsFromDirectory'
import path from 'path'
import { fileURLToPath } from 'url'
import { debugLog, errorLog } from '@lucky/shared/utils'

async function getModerationCommands() {
    try {
        debugLog({ message: 'Loading moderation commands...' })
        const dirName = path.dirname(fileURLToPath(import.meta.url))
        const commandsPath = dirName

        return await getCommandsFromDirectory({
            url: commandsPath,
            category: 'moderation',
        })
    } catch (error) {
        errorLog({ message: 'Error loading moderation commands:', error })
        return []
    }
}

export default getModerationCommands
