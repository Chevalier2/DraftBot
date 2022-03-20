import {Entities} from "../../core/models/Entity";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {CommandRegisterPriority} from "../CommandRegisterPriority";

/**
 * Allow the bot owner or a badgemanager to remove all badges from somebody
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const playerToReset = interaction.options.getUser("user");
	const [entity] = await Entities.getOrRegister(playerToReset.id);

	entity.Player.badges = null;
	await entity.Player.save();

	return await interaction.reply({
		embeds: [new DraftBotEmbed()
			.formatAuthor(Translations.getModule("commands.resetBadgeCommand", language).get("resetSuccess"), interaction.user)
			.setDescription(
				Translations.getModule("commands.resetBadgeCommand", language)
					.format("descReset",
						{player: playerToReset}))]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("resetbadge")
		.setDescription("Reset the badges of a given user (admin only)")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to reset the badges")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: Constants.ROLES.USER.BADGE_MANAGER
	},
	mainGuildCommand: true,
	slashCommandPermissions: null,
	registerPriority: CommandRegisterPriority.LOWEST
};