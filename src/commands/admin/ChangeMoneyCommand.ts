import {Entities, Entity} from "../../core/models/Entity";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {draftBotClient} from "../../core/bot";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {sendDirectMessage} from "../../core/utils/MessageUtils";

declare function isAMention(variable: string): boolean;

declare function getIdFromMention(variable: string): string;

/**
 * Allow the bot owner to give money to 1 or more people
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const moneyModule = Translations.getModule("commands.money", language);
	const usersToChange = interaction.options.getString("users").split(" ");
	if (usersToChange.length > 52) {
		replyErrorMessage(
			interaction,
			language,
			moneyModule.get("errors.tooMuchPeople")
		);
		return;
	}
	const amount = interaction.options.getInteger("amount");
	if (amount > 10 ** 17) {
		replyErrorMessage(
			interaction,
			language,
			moneyModule.get("errors.invalidAmountFormat")
		);
		return;
	}
	const users = new Set<string>();
	for (let i = 0; i < usersToChange.length; i++) {
		const mention = usersToChange[i];
		if (!isAMention(mention) && (parseInt(mention) < 10 ** 17 || parseInt(mention) >= 10 ** 18)) {
			replyErrorMessage(
				interaction,
				language,
				moneyModule.format("errors.invalidIdOrMention", {
					position: i + 1,
					wrongText: usersToChange[i]
				})
			);
			return;
		}
		users.add(isAMention(mention) ? getIdFromMention(mention) : mention);
	}

	let descString = "";
	for (const user of users) {
		const entityToEdit = await Entities.getByDiscordUserId(user);
		if (!entityToEdit) {
			replyErrorMessage(
				interaction,
				language,
				moneyModule.format("errors.invalidIdOrMentionDoesntExist", {
					position: usersToChange.indexOf(user) + 1,
					wrongText: user
				})
			);
			return;
		}
		const moneyBefore = entityToEdit.Player.money;
		try {
			giveMoneyTo(entityToEdit, amount, interaction);
		}
		catch (e) {
			if (e.message === "mauvais paramètre don monnaie") {
				replyErrorMessage(
					interaction,
					language,
					moneyModule.get("errors.invalidDonationParameter")
				);
				return;
			}
			console.error(e.stack);

		}
		await entityToEdit.Player.save();
		descString += moneyModule.format("desc", {
			player: entityToEdit.getMention(),
			money: entityToEdit.Player.money
		});
		if (entityToEdit.Player.dmNotification) {
			sendDirectMessage(
				await draftBotClient.users.fetch(user),
				moneyModule.get("dm.title"),
				moneyModule.format("dm.description", {
					moneyGained: entityToEdit.Player.money - moneyBefore
				}),
				null, // Data.getModule("bot").getString("embed.default"),
				language
			);
		}
	}
	return await interaction.reply({
		embeds: [new DraftBotEmbed()
			.formatAuthor(moneyModule.get("title"), interaction.user)
			.setDescription(descString)]
	});
}

function giveMoneyTo(entityToEdit: Entity, amount: number, interaction: CommandInteraction) {
	if (interaction.options.getString("mode") === "set") {
		entityToEdit.Player.money = amount;
	}
	else if (interaction.options.getString("mode") === "add") {
		entityToEdit.Player.money += amount;
	}
	else {
		throw new Error("mauvais paramètre don monnaie");
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("money")
		.setDescription("Give money to one or more players (admin only)")
		.addStringOption(option => option.setName("mode")
			.setDescription("Add / Set")
			.setRequired(true)
			.addChoices([["Add", "add"], ["Set", "set"]]))
		.addIntegerOption(option => option.setName("amount")
			.setDescription("The amount of money to give")
			.setRequired(true))
		.addStringOption(option => option.setName("users")
			.setDescription("The users' ids affected by the command (example : 'id1 id2 id3')")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};