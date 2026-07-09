import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, successEmbed, infoEmbed, warningEmbed } from '../../utils/embeds.js';
import { getEconomyData, setEconomyData } from '../../utils/economy.js';
import { withErrorHandling, createError, ErrorTypes } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const BASE_WIN_CHANCE = 0.5;
const PAYOUT_MULTIPLIER = 2.0;
const FLIP_COOLDOWN = 3 * 20 * 100;

export default {
    data: new SlashCommandBuilder()
        .setName('flip')
        .setDescription('flip a shmeckle for a chance to win more')
        .addIntegerOption(option =>
            option
                .setName('amount')
                .setDescription('Amount of cash to flip')
                .setRequired(true)
                .setMinValue(1)
        ),

    execute: withErrorHandling(async (interaction, config, client) => {
        const deferred = await InteractionHelper.safeDefer(interaction);
        if (!deferred) return;
            
            const userId = interaction.user.id;
            const guildId = interaction.guildId;
            const betAmount = interaction.options.getInteger("amount");
            const now = Date.now();

            const userData = await getEconomyData(client, guildId, userId);
            const lastGamble = userData.lastFlip || 0;

            if (now < lastFlip + FLIP_COOLDOWN) {
                const remaining = lastFlip + FLIP_COOLDOWN - now;
                const minutes = Math.floor(remaining / (1000 * 60));
                const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

                throw createError(
                    "Flip cooldown active",
                    ErrorTypes.RATE_LIMIT,
                    `You need to cool down before Flipping again. Wait **${minutes}m ${seconds}s**.`,
                    { remaining, cooldownType: 'flip' }
                );
            }

            if (userData.wallet < betAmount) {
                throw createError(
                    "Insufficient cash for flip",
                    ErrorTypes.VALIDATION,
                    `You only have $${userData.wallet.toLocaleString()} cash, but you are trying to bet $${betAmount.toLocaleString()}.`,
                    { required: betAmount, current: userData.wallet }
                );
            }
