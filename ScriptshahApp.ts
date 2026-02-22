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
import {
    IAppInfo,
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import {
    ISetting,
    SettingType,
} from '@rocket.chat/apps-engine/definition/settings';
import {
    APP_STATUS_ASSOCIATION,
    ScriptShahCommand,
} from './slashcommands/ScriptShahCommand';

const EXTERNAL_LOGGER_SETTING_ID = 'external_logger_url';
const MY_USERNAME = 'scriptshah';

export class ScriptshahApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await configuration.slashCommands.provideSlashCommand(new ScriptShahCommand());
        await configuration.settings.provideSetting(this.getExternalLoggerSetting());
    }

    public async executePostMessageSent(
        message: IMessage,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify,
    ): Promise<void> {
        if (!message.text || !message.text.includes(`@${MY_USERNAME}`)) {
            return;
        }

        if (message.sender.username === MY_USERNAME) {
            return;
        }

        const statusData = await read
            .getPersistenceReader()
            .readByAssociation(APP_STATUS_ASSOCIATION);
        const isEnabled = statusData.length > 0 && Boolean((statusData[0] as { enabled?: boolean }).enabled);

        if (!isEnabled) {
            return;
        }

        await this.captureMention(message, persistence);

        const externalLoggerUrl = await read
            .getEnvironmentReader()
            .getSettings()
            .getValueById(EXTERNAL_LOGGER_SETTING_ID);

        const responseText = await this.getEphemeralText(message, externalLoggerUrl, http);

        const ephemeralBuilder = modify
            .getCreator()
            .startMessage()
            .setRoom(message.room)
            .setText(responseText);

        await modify.getNotifier().notifyUser(message.sender, ephemeralBuilder.getMessage());
    }

    private async captureMention(message: IMessage, persistence: IPersistence): Promise<void> {
        const association = new RocketChatAssociationRecord(
            RocketChatAssociationModel.MISC,
            `scriptshah-capture-${Date.now()}`,
        );

        await persistence.createWithAssociation(
            {
                senderId: message.sender.id,
                senderUsername: message.sender.username,
                roomId: message.room.id,
                message: message.text,
                createdAt: new Date().toISOString(),
            },
            association,
        );
    }

    private async getEphemeralText(
        message: IMessage,
        externalLoggerUrl: string,
        http: IHttp,
    ): Promise<string> {
        if (!externalLoggerUrl || externalLoggerUrl.trim() === '') {
            return `Thank you for mentioning me, ${message.sender.username}`;
        }

        try {
            const response = await http.post(externalLoggerUrl, {
                data: {
                    userid: message.sender.id,
                    message: message.text,
                },
            });

            const payload = this.getResponsePayload(response);

            if (payload?.result && payload?.id !== undefined) {
                return `${payload.result} (${payload.id})`;
            }

            this.getLogger().warn('External logger response did not include result/id fields.');
        } catch (error) {
            this.getLogger().error('Error calling External Logger endpoint.', error);
        }

        return `Thank you for mentioning me, ${message.sender.username}`;
    }

    private getResponsePayload(response: {
        data?: unknown;
        content?: string;
    }): { id?: string | number; result?: string } | undefined {
        if (response.data && typeof response.data === 'object') {
            return response.data as { id?: string | number; result?: string };
        }

        if (response.content) {
            try {
                return JSON.parse(response.content) as { id?: string | number; result?: string };
            } catch (_error) {
                this.getLogger().warn('External logger response content was not valid JSON.');
            }
        }

        return undefined;
    }

    private getExternalLoggerSetting(): ISetting {
        return {
            id: EXTERNAL_LOGGER_SETTING_ID,
            type: SettingType.STRING,
            i18nLabel: 'External Logger',
            required: false,
            public: false,
            packageValue: '',
        };
    }
}
