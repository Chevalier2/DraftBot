import {Entities} from "../../../../core/database/game/models/Entity";
import {Maps} from "../../../../core/Maps";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "travelreport",
	aliases: ["tr"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez réinitialisé votre parcours !",
	description: "Réinitialise le parcours que vous effectuez",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Reset your current travel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const travelReportTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);

	if (!Maps.isTravelling(entity.Player)) {
		throw new Error("Erreur travelreport : vous ne voyagez pas actuellement !");
	}

	entity.Player.startTravelDate = new Date();
	entity.Player.effectEndDate = new Date(0);
	await entity.Player.save();

	return commandInfo.messageWhenExecuted;

};

commandInfo.execute = travelReportTestCommand;