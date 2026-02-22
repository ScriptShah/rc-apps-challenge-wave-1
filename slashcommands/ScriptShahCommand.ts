import {
    IHttp,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
    ISlashCommand,
    SlashCommandContext,
} from '@rocket.chat/apps-engine/definition/slashcommands';
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';

export const COMMAND_NAME = 'scriptshah';
export const APP_STATUS_ASSOCIATION = new RocketChatAssociationRecord(
    RocketChatAssociationModel.MISC,
    'scriptshah-status',
);

export class ScriptShahCommand implements ISlashCommand {
    public command = COMMAND_NAME;
    public i18nDescription = 'Toggle scriptshah mention listener with on/off';
    public i18nParamsExample = 'on | off';
    public providesPreview = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        _http: IHttp,
        persistence: IPersistence,
    ): Promise<void> {
        const [action] = context.getArguments();
        const normalizedAction = (action || '').trim().toLowerCase();

        if (normalizedAction !== 'on' && normalizedAction !== 'off') {
            await this.notifyUser(
                context,
                modify,
                `Usage: /${COMMAND_NAME} on or /${COMMAND_NAME} off`,
            );
            return;
        }

        const enabled = normalizedAction === 'on';

        await persistence.updateByAssociation(
            APP_STATUS_ASSOCIATION,
            {
                enabled,
                updatedBy: context.getSender().id,
                updatedAt: new Date().toISOString(),
            },
            true,
        );

        await this.notifyUser(
            context,
            modify,
            `Mention capture is now ${enabled ? 'ON' : 'OFF'}.`,
        );
    }

    private async notifyUser(
        context: SlashCommandContext,
        modify: IModify,
        text: string,
    ): Promise<void> {
        const messageBuilder = modify
            .getCreator()
            .startMessage()
            .setRoom(context.getRoom())
            .setSender(context.getSender())
            .setText(text);

        await modify
            .getNotifier()
            .notifyUser(context.getSender(), messageBuilder.getMessage());
    }
}
