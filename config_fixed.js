// Clean and safe configuration for your Telegram bot.
// IMPORTANT: The old bot token was exposed. Revoke it with @BotFather
// and put your newly generated token below. Never share this file publicly.

module.exports = {
    mainToken: '9167131548:AAFNmQ4mhXsbhf3Pq985gujZZujcG2vTWil',

    S7: '@Maivyrox',
    adminId: '9281850642',

    // Main links
    channel: 'https://t.me/+45YICkwaVUs1NGM1',
    group: 'https://t.me/+45YICkwaVUs1NGM1',
    youtube: 'https://t.me/+45YICkwaVUs1NGM1',

    // Force-join channels (replace every placeholder with real details)
    forceJoinChannels: [
        {
            id: 'USERNAME',
            name: 'GROUP NAME',
            url: 'LINK'
        },
        {
            id: '@ALIWCHATZONE',
            name: 'CHAT',
            url: 'https://t.me/ALIWCHATZONE'
        },
        {
            id: 'USERNAME',
            name: 'NAME',
            url: 'CHANNEL LINK'
        }
    ],

    // Force-join groups (replace every placeholder with real details)
    forceJoinGroups: [
        {
            id: 'USERNAME',
            name: 'NAME',
            url: 'CHANNEL LINK'
        },
        {
            id: 'GROUP_USERNAME',
            name: 'NAME',
            url: 'LINK'
        },
        {
            id: 'USERNAME',
            name: 'MAIN',
            url: 'GROUP LINK'
        }
    ],

    // Bot information
    bot: 'YOUR BOT NAME',
    logo: 'YASH.mp4'
};
