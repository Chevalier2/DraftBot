import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Classes} from "../../core/models/Class";
import {Entities} from "../../core/models/Entity";
import {Guilds} from "../../core/models/Guild";
import Player, {Players} from "../../core/models/Player";
import {Campaign} from "../../core/missions/Campaign";

module.exports.commandInfo = {
	name: "profile",
	aliases: ["p", "profil"],
	disallowEffects: [EFFECT.BABY]
};

/**
 * Displays information about the profile of the player who sent the command
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ProfileCommand = async (message, language, args) => {
	let [entity] = await Entities.getByArgs(args, message);
	if (!entity) {
		[entity] = await Entities.getOrRegister(message.author.id);
	}

	let titleEffect = entity.Player.effect;
	const w = await entity.Player.getMainWeaponSlot().getItem();
	const a = await entity.Player.getMainArmorSlot().getItem();
	const p = await entity.Player.getMainPotionSlot().getItem();
	const o = await entity.Player.getMainObjectSlot().getItem();
	const [mc] = entity.Player.MissionSlots.filter(m => m.isCampaign());
	const numberOfPlayers = await Player.count({
		where: {
			score: {
				[require("sequelize/lib/operators").gt]: 100
			}
		}
	});
	const rank = (await Players.getById(entity.Player.id))[0].rank;
	const fields = [
		{
			name: JsonReader.commands.profile.getTranslation(language).information.fieldName,
			value: format(JsonReader.commands.profile.getTranslation(language).information.fieldValue, {
				health: entity.health,
				maxHealth: await entity.getMaxHealth(),
				experience: entity.Player.experience,
				experienceNeededToLevelUp: entity.Player.getExperienceNeededToLevelUp(),
				money: entity.Player.money
			})
		}];
	if (entity.Player.level >= CLASS.REQUIRED_LEVEL) {
		fields.push({
			name: JsonReader.commands.profile.getTranslation(language).statistique.fieldName,
			value: format(JsonReader.commands.profile.getTranslation(language).statistique.fieldValue, {
				cumulativeAttack: await entity.getCumulativeAttack(w, a, p, o),
				cumulativeDefense: await entity.getCumulativeDefense(w, a, p, o),
				cumulativeSpeed: await entity.getCumulativeSpeed(w, a, p, o),
				cumulativeHealth: await entity.getCumulativeHealth(),
				cumulativeMaxHealth: await entity.getMaxCumulativeHealth()
			})
		});
	}
	fields.push(
		{
			name: JsonReader.commands.profile.getTranslation(language).mission.fieldName,
			value: format(JsonReader.commands.profile.getTranslation(language).mission.fieldValue, {
				gems: entity.Player.PlayerMissionsInfo.gems,
				campaign: Math.round(
					(entity.Player.PlayerMissionsInfo.campaignProgression ===
							Campaign.getMaxCampaignNumber() && mc.isCompleted() ? entity.Player.PlayerMissionsInfo.campaignProgression
						: entity.Player.PlayerMissionsInfo.campaignProgression - 1
					) / Campaign.getMaxCampaignNumber() * 100)
			}
			),
			inline: false
		});
	fields.push(
		{
			name: JsonReader.commands.profile.getTranslation(language).ranking.fieldName,
			value:
				format(JsonReader.commands.profile.getTranslation(
					language).ranking.fieldValue, {
					rank: rank > numberOfPlayers ? JsonReader.commands.profile.getTranslation(
						language).ranking.unranked : rank,
					numberOfPlayer: numberOfPlayers,
					score: entity.Player.score
				})
		});

	if (!entity.Player.checkEffect()) {
		if (message.createdAt.valueOf() >= entity.Player.effectEndDate) {
			titleEffect = ":hospital:";
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).timeLeft.fieldName,
				value: JsonReader.commands.profile.getTranslation(language).noTimeLeft.fieldValue
			});
		}
		else {
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).timeLeft.fieldName,
				value: format(JsonReader.commands.profile.getTranslation(language).timeLeft.fieldValue, {
					effect: entity.Player.effect,
					timeLeft: minutesToString(millisecondsToMinutes(entity.Player.effectEndDate - message.createdAt.valueOf()))
				})
			});
		}
	}

	try {
		const playerClass = await Classes.getById(entity.Player.class);
		if (playerClass) {
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).playerClass.fieldName,
				value: format(JsonReader.commands.profile.getTranslation(language).playerClass.fieldValue, {
					class: playerClass[language]
				}),
				inline: true
			});
		}
	}
	catch (error) {
		log("Error while getting class of player for profile: " + error);
	}

	try {
		const guild = await Guilds.getById(entity.Player.guildId);
		if (guild) {
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).guild.fieldName,
				value: format(JsonReader.commands.profile.getTranslation(language).guild.fieldValue, {
					guild: guild.name
				}),
				inline: true
			});
		}
	}
	catch (error) {
		log("Error while getting guild of player for profile: " + error);
	}

	try {
		const mapId = await entity.Player.getDestinationId();
		if (mapId !== null) {
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).map.fieldName,
				value: (await entity.Player.getDestination()).getDisplayName(language),
				inline: true
			});
		}
	}
	catch (error) {
		console.log(error);
	}

	try {
		const pet = entity.Player.Pet;
		if (pet) {
			fields.push({
				name: JsonReader.commands.profile.getTranslation(language).pet.fieldName,
				value: format(JsonReader.commands.profile.getTranslation(language).pet.fieldValue, {
					rarity: pet.PetModel.getRarityDisplay(),
					emote: pet.getPetEmote(),
					nickname: pet.nickname ? pet.nickname : pet.getPetTypeName(language)
				}),
				inline: false
			});
		}
	}
	catch (error) {
		console.log(error);
	}
	const msg = await message.channel.send({
		embeds: [
			new DraftBotEmbed()
				.setTitle(format(JsonReader.commands.profile.getTranslation(language).title, {
					effect: titleEffect,
					pseudo: await entity.Player.getPseudo(language),
					level: entity.Player.level
				}))
				.addFields(fields)
		]
	});

	const filterConfirm = (reaction) => reaction.me && !reaction.users.cache.last().bot;

	const collector = msg.createReactionCollector({
		filter: filterConfirm,
		time: COLLECTOR_TIME,
		max: JsonReader.commands.profile.badgeMaxReactNumber
	});

	collector.on("collect", (reaction) => {
		message.channel.send({content: JsonReader.commands.profile.getTranslation(language).badges[reaction.emoji.name]}).then((msg) => {
			setTimeout(() => msg.delete(), JsonReader.commands.profile.badgeDescriptionTimeout);
		});
	});

	if (entity.Player.badges !== null && entity.Player.badges !== "") {
		const badges = entity.Player.badges.split("-");
		for (const badgeid in badges) {
			if (Object.prototype.hasOwnProperty.call(badges, badgeid)) {
				await msg.react(badges[badgeid]);
			}
		}
	}
	if (new Date() - entity.Player.topggVoteAt < TOPGG.BADGE_DURATION * 60 * 60 * 1000) {
		await msg.react(TOPGG.BADGE);
	}
};

module.exports.execute = ProfileCommand;