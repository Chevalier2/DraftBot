/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";

const executeSmallEvent = async function(message, language, entity, seEmbed) {

	const randomItem = await generateRandomItem(RARITY.EPIC);
	seEmbed.setDescription(
		seEmbed.description +
		JsonReader.smallEventsIntros.getTranslation(language).intro[randInt(0, JsonReader.smallEventsIntros.getTranslation(language).intro.length)] +
		JsonReader.smallEvents.findItem.getTranslation(language).intrigue[randInt(0, JsonReader.smallEvents.findItem.getTranslation(language).intrigue.length)]
	);

	await message.channel.send({ embeds: [seEmbed] });
	log(entity.discordUserId + " got an item from a mini event ");
	await giveItemToPlayer(entity, randomItem, language, message.author, message.channel);
};

module.exports = {
	smallEvent: {
		executeSmallEvent: executeSmallEvent,
		canBeExecuted: () => Promise.resolve(true)
	}
};