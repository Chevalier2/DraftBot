import {Constants} from "../Constants";

/**
 * remove discord formatting scrap from usernames
 * @param username
 */
export function escapeUsername(username: string): string {
	let fixedName = username.replace(/[*`_|]/gu, "");
	if (fixedName === "") {
		fixedName = ".";
	}
	return fixedName;
}

/**
 * Creates a bar of progression
 * @param value
 * @param maxValue
 */
export function progressBar(value: number, maxValue: number): string {
	let percentage = value / maxValue; // Calculate the percentage of the bar
	if (percentage < 0 || isNaN(percentage) || percentage === Infinity) {
		percentage = 0;
	}
	if (percentage > 1) {
		percentage = 1;
	}
	const progress = Math.round(Constants.MESSAGES.PROGRESS_BAR_SIZE * percentage); // Calculate the number of square caracters to fill the progress side.
	const emptyProgress = Constants.MESSAGES.PROGRESS_BAR_SIZE - progress; // Calculate the number of dash caracters to fill the empty progress side.

	const progressText = "▇".repeat(progress); // Repeat is creating a string with progress * caracters in it
	const emptyProgressText = "—".repeat(emptyProgress); // Repeat is creating a string with empty progress * caracters in it
	const percentageText = Math.floor(percentage * 100) + "%"; // Displaying the percentage of the bar

	return `\`\`\`[${progressText}${emptyProgressText}]${percentageText}\`\`\``; // Creating the bar
}

/**
 * Check if a name is valid
 * @param name - the name to check
 * @param minLength
 * @param maxLength
 */
export function checkNameString(name: string, minLength: number, maxLength: number): boolean {
	const regexAllowed = /^[A-Za-z0-9 ÇçÜüÉéÂâÄäÀàÊêËëÈèÏïÎîÔôÖöÛû]+$/u;
	const regexSpecialCases = /^[0-9 ]+$|( {2})+/u;
	return regexAllowed.test(name) && !regexSpecialCases.test(name) && name.length >= minLength && name.length <= maxLength;
}

/**
 * Convert a discord id to its corresponding mention
 * @param id
 */
export function discordIdToMention(id: string): string {
	return `<@${id}>`;
}

/**
 * Check if the given variable is a Mention
 * @param {String} variable
 * @return {boolean}
 */
export function isAMention(variable: string): boolean {
	if (typeof variable === "string") {
		return /^<@!?[0-9]{18}>$/u.test(variable);
	}
	return false;
}

/**
 * Check if the given variable is a Discord Emoji
 * @param {String} variable
 * @return {boolean}
 */
export function isAnEmoji(variable: string): boolean {
	return /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/giu.test(variable);
}

/**
 * Get the id from a mention
 * @param {any} variable
 * @return {String} The id of the mention
 */
export function getIdFromMention(variable: string): string {
	if (typeof variable === "string") {
		return variable.slice(3, variable.length - 1);
	}
	return "";
}