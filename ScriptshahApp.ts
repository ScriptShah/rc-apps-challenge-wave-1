import {
    IAppAccessors,
    IConfigurationExtend,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo, RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { ScriptShahCommand } from './slashcommands/ScriptShahCommand';

export class ScriptshahApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    // 1. Registers the "/scriptshah" command
    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new ScriptShahCommand());
    }

    // 2. Listens for mentions and handles the challenge logic
    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
    ): Promise<void> {
        const myUsername = 'scriptshah'; 

        // Ignore messages that don't mention you
        if (!message.text || !message.text.includes(`@${myUsername}`)) {
            return;
        }

        // Check if the app is "ON" for this user
        const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, myUsername);
        const persistenceData = await read.getPersistenceReader().readByAssociation(association);
        
        // Ensure data exists and 'enabled' is true
        const isAppOn = persistenceData && persistenceData.length > 0 && (persistenceData[0] as any).enabled;

        if (!isAppOn) {
            return;
        }

        // Check for the External Logger URL setting
        const externalUrl = await read.getEnvironmentReader().getSettings().getValueById('External_Logger');

        let replyText = `Thank you for mentioning me, @${message.sender.username}`;

        // Handle External Logging mode
        if (externalUrl && externalUrl.trim() !== '') {
            try {
                const response = await http.post(externalUrl, {
                    data: {
                        userid: message.sender.id,
                        message: message.text,
                    },
                });

                if (response.data && response.data.result) {
                    replyText = response.data.result;
                }
            } catch (error) {
                this.getLogger().error('Error calling External Logger:', error);
            }
        }

        // Send the ephemeral message
        const messageBuilder = modify.getCreator().startMessage()
            .setRoom(message.room)
            .setText(replyText);

        await modify.getNotifier().notifyUser(message.sender, messageBuilder.getMessage());
    }
}