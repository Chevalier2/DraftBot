import {Database} from "../Database";
import {LogsPlayersMoney} from "./models/LogsPlayersMoney";
import {LogsPlayers} from "./models/LogsPlayers";
import {LogsPlayersHealth} from "./models/LogsPlayersHealth";
import {LogsPlayersExperience} from "./models/LogsPlayersExperience";
import {CreateOptions, Model} from "sequelize";
import {LogsPlayersLevel} from "./models/LogsPlayersLevel";
import {LogsPlayersScore} from "./models/LogsPlayersScore";
import {LogsPlayersGems} from "./models/LogsPlayersGems";
import {LogsServers} from "./models/LogsServers";
import {LogsCommands} from "./models/LogsCommands";
import {LogsPlayersCommands} from "./models/LogsPlayersCommands";
import {LogsSmallEvents} from "./models/LogsSmallEvents";
import {LogsPlayersSmallEvents} from "./models/LogsPlayersSmallEvents";
import {LogsPossibilities} from "./models/LogsPossibilities";
import {LogsPlayersPossibilities} from "./models/LogsPlayersPossibilities";
import {LogsAlterations} from "./models/LogsAlterations";
import {Constants} from "../../Constants";
import {LogsPlayersStandardAlterations} from "./models/LogsPlayersStandardAlterations";
import {LogsPlayersOccupiedAlterations} from "./models/LogsPlayersOccupiedAlterations";
import {LogsUnlocks} from "./models/LogsUnlocks";
import {LogsPlayersClassChanges} from "./models/LogsPlayersClassChanges";
import {LogsPlayersVotes} from "./models/LogsPlayersVotes";
import {LogsServersJoins} from "./models/LogsServersJoins";
import {LogsServersQuits} from "./models/LogsServersQuits";
import MapLink from "../game/models/MapLink";
import {LogsPlayersTravels} from "./models/LogsPlayersTravels";
import {LogsMapLinks} from "./models/LogsMapLinks";
import {LogsMissionsFailed} from "./models/LogsMissionsFailed";
import {LogsMissionsFinished} from "./models/LogsMissionsFinished";
import {LogsMissionsFound} from "./models/LogsMissionsFound";
import {LogsMissionsDailyFinished} from "./models/LogsMissionsDailyFinished";
import {LogsMissionsDaily} from "./models/LogsMissionsDaily";
import {LogsMissionsCampaignProgresses} from "./models/LogsMissionsCampaignProgresses";
import {LogsMissions} from "./models/LogsMissions";

export enum NumberChangeReason {
	// Default value. Used to detect missing parameters in functions
	NULL,

	// Admin
	TEST,
	ADMIN,
	DEBUG,

	// Events
	BIG_EVENT,
	SMALL_EVENT,
	RECEIVE_COIN,

	// Pets
	PET_SELL,
	PET_FEED,
	PET_FREE,

	// Missions
	MISSION_FINISHED,
	MISSION_SHOP,

	// Guild
	GUILD_DAILY,
	GUILD_CREATE,

	// Items
	ITEM_SELL,
	DAILY,
	DRINK,

	// Misc
	SHOP,
	CLASS,
	UNLOCK,
	LEVEL_UP,
	RESPAWN,
}

export class LogsDatabase extends Database {

	constructor() {
		super("logs");
	}

	public logMoneyChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayersMoney);
	}

	public logHealthChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayersHealth);
	}

	public logExperienceChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayersExperience);
	}

	public logScoreChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayersScore);
	}

	public logGemsChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayersGems);
	}

	public logLevelChange(discordId: string, level: number): Promise<void> {
		return this.logPlayerAndNumber(discordId, "level", level, LogsPlayersLevel);
	}

	public logCommandUsage(discordId: string, serverId: string, commandName: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayers.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				const [server] = await LogsServers.findOrCreate({
					where: {
						discordId: serverId
					},
					transaction
				});
				const [command] = await LogsCommands.findOrCreate({
					where: {
						commandName
					},
					transaction
				});
				await LogsPlayersCommands.create({
					playerId: player.id,
					serverId: server.id,
					commandId: command.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logSmallEvent(discordId: string, name: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayers.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				const [smallEvent] = await LogsSmallEvents.findOrCreate({
					where: {
						name
					},
					transaction
				});
				await LogsPlayersSmallEvents.create({
					playerId: player.id,
					smallEventId: smallEvent.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logBigEvent(discordId: string, eventId: number, possibilityEmote: string, issueIndex: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayers.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				const [possibility] = await LogsPossibilities.findOrCreate({
					where: {
						bigEventId: eventId,
						emote: possibilityEmote === "end" ? null : possibilityEmote,
						issueIndex
					},
					transaction
				});
				await LogsPlayersPossibilities.create({
					playerId: player.id,
					bigEventId: eventId,
					possibilityId: possibility.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logAlteration(discordId: string, alteration: string, reason: NumberChangeReason, duration: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayers.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				switch (alteration) {
				case Constants.EFFECT.OCCUPIED:
					await LogsPlayersOccupiedAlterations.create({
						playerId: player.id,
						duration: duration,
						reason: reason,
						date: Math.trunc(Date.now() / 1000)
					}, {transaction});
					break;
				default:
					await LogsPlayersStandardAlterations.create({
						playerId: player.id,
						alterationId: (await LogsAlterations.findOrCreate({
							where: {
								alteration: alteration
							},
							transaction
						}))[0].id,
						reason,
						date: Math.trunc(Date.now() / 1000)
					}, {transaction});
				}
				await transaction.commit();
				resolve();
			});
		});
	}

	public logUnlocks(buyerDiscordId: string, releasedDiscordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [buyer] = await LogsPlayers.findOrCreate({
					where: {
						discordId: buyerDiscordId
					},
					transaction
				});
				const [released] = await LogsPlayers.findOrCreate({
					where: {
						discordId: releasedDiscordId
					},
					transaction
				});
				await LogsUnlocks.create({
					buyerId: buyer.id,
					releasedId: released.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logPlayerClassChange(discordId: string, classId: number): Promise<void> {
		return this.logPlayerAndNumber(discordId, "classId", classId, LogsPlayersClassChanges);
	}

	public logVote(discordId: string): Promise<void> {
		return this.logSimplePlayerDate(discordId, LogsPlayersVotes);
	}

	public logMissionFailed(discordId: string, missionId: string, variant: number, objective: number): Promise<void> {
		return this.logMissionChange(discordId, missionId, variant, objective, LogsMissionsFailed);
	}

	public logMissionFinished(discordId: string, missionId: string, variant: number, objective: number): Promise<void> {
		return this.logMissionChange(discordId, missionId, variant, objective, LogsMissionsFinished);
	}

	public logMissionFound(discordId: string, missionId: string, variant: number, objective: number): Promise<void> {
		return this.logMissionChange(discordId, missionId, variant, objective, LogsMissionsFound);
	}

	public logMissionDailyFinished(discordId: string): Promise<void> {
		return this.logSimplePlayerDate(discordId, LogsMissionsDailyFinished);
	}

	public logMissionCampaignProgress(discordId: string, campaignIndex: number): Promise<void> {
		return this.logPlayerAndNumber(discordId, "number", campaignIndex, LogsMissionsCampaignProgresses);
	}

	public logMissionDailyRefreshed(missionId: string, variant: number, objective: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [mission] = await LogsMissions.findOrCreate({
					where: {
						name: missionId,
						variant,
						objective
					},
					transaction
				});
				await LogsMissionsDaily.create({
					missionId: mission.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	private logPlayerAndNumber(
		discordId: string,
		valueFieldName: string,
		value: number,
		model: { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> }
	): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayers.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				const values: { [key: string]: string | number } = {
					playerId: player.id,
					date: Math.trunc(Date.now() / 1000)
				};
				values[valueFieldName] = value;
				await model.create(values, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	private logSimplePlayerDate(
		discordId: string,
		model: { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> }
	): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayers.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				await model.create({
					playerId: player.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	private logMissionChange(
		discordId: string,
		missionId: string,
		variant: number,
		objective: number,
		model: { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> }
	): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayers.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				const [mission] = await LogsMissions.findOrCreate({
					where: {
						name: missionId,
						variant,
						objective
					},
					transaction
				});
				await model.create({
					playerId: player.id,
					missionId: mission.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logServerJoin(discordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [server] = await LogsServers.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				await LogsServersJoins.create({
					serverId: server.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logServerQuit(discordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [server] = await LogsServers.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				await LogsServersQuits.create({
					serverId: server.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logNewTravel(discordId: string, mapLink: MapLink): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayers.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				const [maplinkLog] = await LogsMapLinks.findOrCreate({
					where: {
						start: mapLink.startMap,
						end: mapLink.endMap
					},
					transaction
				});
				await LogsPlayersTravels.create({
					playerId: player.id,
					mapLinkId: maplinkLog.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	private logNumberChange(
		discordId: string,
		value: number,
		reason: NumberChangeReason,
		model: { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> }
	): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayers.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				await model.create({
					playerId: player.id,
					value,
					reason,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}
}