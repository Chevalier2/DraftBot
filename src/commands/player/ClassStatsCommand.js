import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Classes} from "../../core/models/Class";
import {Entities} from "../../core/models/Entity";

module.exports.commandInfo = {
	name: "classtats",
	aliases: ["cs","classesstats","classcompare","classestats","classstats","classstat"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD],
	requiredLevel: CLASS.REQUIRED_LEVEL
};

/**
 * Display information about classes
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function ClassStatsCommand(message, language) {
	const [entity] = await Entities.getOrRegister(message.author.id); // Loading player

	const classTranslations = JsonReader.commands.classStats.getTranslation(language);

	const classesLineDisplay = [];
	const allClasses = await Classes.getByGroupId(entity.Player.getClassGroup());
	for (let k = 0; k < allClasses.length; k++) {
		classesLineDisplay.push(allClasses[k].toString(language, entity.Player.level));
	}

	// Creating classstats message
	await message.channel.send({ embeds: [
		new DraftBotEmbed()
			.setTitle(classTranslations.title)
			.setDescription(classTranslations.desc)
			.addField(
				"\u200b", classesLineDisplay.join("\n")
			)] }
	);
}

module.exports.execute = ClassStatsCommand;