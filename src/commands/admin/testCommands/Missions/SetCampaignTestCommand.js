const {Entities} = require("../../../../core/models/Entity");
const {MissionsController} = require("../../../../core/missions/MissionsController");
module.exports.commandInfo = {
	name: "setCampaign",
	commandFormat: "<progression>",
	typeWaited: {
		"progression": typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous êtes maintenant à l'étape {progression} de la campagne",
	description: "Vous mets à une certaine étape de la campagne"
};

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const setCampaignTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	const progression = parseInt(args[0]);
	const [campaign] = entity.Player.MissionSlots.filter(m => m.isCampaign());
	const campaignMission = require("../../../../../../resources/text/campaign.json").missions[progression - 1];

	entity.Player.PlayerMissionsInfo.campaignProgression = progression;
	campaign.missionId = campaignMission.missionId;
	campaign.missionObjective = campaignMission.missionObjective;
	campaign.missionVariant = campaignMission.missionVariant;
	campaign.numberDone = await MissionsController.getMissionInterface(campaign.missionId).initialNumberDone(entity.Player, campaign.missionVariant);
	campaign.xpToWin = campaignMission.xpToWin;
	campaign.gemsToWin = campaignMission.gemsToWin;
	campaign.moneyToWin = campaignMission.moneyToWin;
	await campaign.save();
	await entity.Player.PlayerMissionsInfo.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {
		progression
	});
};

module.exports.execute = setCampaignTestCommand;