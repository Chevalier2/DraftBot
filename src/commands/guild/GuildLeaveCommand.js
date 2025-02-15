import {Entities} from "../../core/models/Entity";

module.exports.commandInfo = {
	name: "guildleave",
	aliases: ["gleave", "gl"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD],
	guildRequired: true
};

/**
 * Allow to leave a guild
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import Guild, {Guilds} from "../../core/models/Guild";
import Player from "../../core/models/Player";
import {MissionsController} from "../../core/missions/MissionsController";
import {escapeUsername} from "../../core/utils/StringUtils";
import {BlockingUtils} from "../../core/utils/BlockingUtils";

const GuildLeaveCommand = async (message, language) => {
	if (await sendBlockedError(message.author, message.channel, language)) {
		return;
	}
	const [entity] = await Entities.getOrRegister(message.author.id);
	const guild = await Guilds.getById(entity.Player.guildId);
	let elder;

	if (guild.elderId) {
		elder = await Entities.getById(guild.elderId);
	}

	const endCallback = async (validationMessage) => {
		const embed = new DraftBotEmbed();
		BlockingUtils.unblockPlayer(entity.discordUserId);
		if (elder) {
			BlockingUtils.unblockPlayer(elder.discordUserId);
		}
		if (validationMessage.isValidated()) {
			entity.Player.guildId = null;
			if (guild.elderId === entity.Player.id) {
				guild.elderId = null;
			}
			if (entity.id === guild.chiefId) {
				if (elder) {
					log(
						elder.discordUserId +
						" becomes the chief of  " +
						guild.name
					);
					guild.chiefId = elder.id;
					guild.elderId = null;
					await Promise.all([guild.save()]);
					message.channel.send({ content:
						format(JsonReader.commands.guildLeave.getTranslation(language).newChiefTitle, {
							guild: guild.name
						})}
					);
				}
				else {
					log(
						guild.name +
						" has been destroyed"
					);
					// the chief is leaving : destroy the guild
					await Player.update(
						{guildId: null},
						{
							where: {
								guildId: guild.id
							}
						}
					);
					for (const pet of guild.GuildPets) {
						pet.PetEntity.destroy();
						pet.destroy();
					}
					await Guild.destroy({
						where: {
							id: guild.id
						}
					});
				}
			}

			await Promise.all([guild.save(), entity.save(), entity.Player.save()]);

			embed.setAuthor(
				format(JsonReader.commands.guildLeave.getTranslation(language).successTitle, {
					pseudo: escapeUsername(message.author.username),
					guildName: guild.name
				}),
				message.author.displayAvatarURL()
			);
			embed.setDescription(JsonReader.commands.guildLeave.getTranslation(language).leavingSuccess);
			await MissionsController.update(entity.discordUserId, message.channel, language, "guildLevel", 0, null, true);
			return message.channel.send({ embeds: [embed] });
		}

		// Cancel leaving
		return sendErrorMessage(
			message.author, message.channel, language, format(JsonReader.commands.guildLeave.getTranslation(language).leavingCancelled, {
				guildName: guild.name
			}), true
		);
	};

	const confirmationEmbed = new DraftBotValidateReactionMessage(
		message.author,
		endCallback
	)
		.formatAuthor(JsonReader.commands.guildLeave.getTranslation(language).leaveGuildTitle, message.author);

	if (entity.id === guild.chiefId) {
		if (elder) {
			confirmationEmbed.setDescription(
				format(JsonReader.commands.guildLeave.getTranslation(language).leaveChiefDescWithElder, {
					guildName: guild.name,
					elderName: await elder.Player.getPseudo(language)
				})
			);
		}
		else {
			confirmationEmbed.setDescription(
				format(JsonReader.commands.guildLeave.getTranslation(language).leaveChiefDesc, {
					guildName: guild.name
				})
			);
		}
	}
	else {
		confirmationEmbed.setDescription(
			format(JsonReader.commands.guildLeave.getTranslation(language).leaveDesc, {
				guildName: guild.name
			})
		);
	}

	await confirmationEmbed.send(message.channel, (collector) => {
		BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "guildLeave", collector);
		if (elder) {
			BlockingUtils.blockPlayerWithCollector(elder.discordUserId, "chiefGuildLeave", collector);
		}
	});
};

module.exports.execute = GuildLeaveCommand;