import { ISlashCommand, SlashCommandContext } from '@rocket.chat/apps-engine/definition/slashcommands';
import { IRead, IModify, IHttp, IPersistence } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

export class ScriptShahCommand implements ISlashCommand {
	public command = 'scriptshah';
	public i18nDescription = 'Toggle scriptshah mention responder';
	public i18nParamsExample = 'on|off';
	public providesPreview = false;

	public async executor(context: SlashCommandContext, read: IRead, modify: IModify, http: IHttp, persistence: IPersistence): Promise<void> {
		const args = context.getArguments();
		const sender = context.getSender();
		const room = context.getRoom();

		const username = 'scriptshah';
		const action = args && args.length > 0 ? args[0].toLowerCase() : '';

		const association = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, username);

		let text = 'Usage: /scriptshah on|off';

		if (action === 'on') {
			await persistence.createWithAssociation({ enabled: true }, association);
			text = 'scriptshah is now ON';
		} else if (action === 'off') {
			await persistence.createWithAssociation({ enabled: false }, association);
			text = 'scriptshah is now OFF';
		}

		const message = modify.getCreator().startMessage().setSender(sender).setText(text).setRoom(room);
		await modify.getNotifier().notifyUser(sender, message.getMessage());
	}
}
