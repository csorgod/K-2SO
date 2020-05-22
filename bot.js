const Discord = require('discord.js');
const ytdl = require('ytdl-core');

var config = require('./auth.json');

const client = new Discord.Client();
const queue = new Map();

client.on('ready', () => {
    console.log('Connected');
});

client.on('message', async message => {

    if(message.author.bot)
        return;

    if(message.content.indexOf(config.prefix) !== 0) 
        return;

    if (!message.content.startsWith(config.prefix)) 
        return;

    const args = message.content
        .slice(config.prefix.length)
        .trim()
        .split(/ +/g);

    const command = args
        .shift()
        .toLowerCase();
    
    const serverQueue = queue
            .get(message.guild.id);

    if(command === "ping") {
        message.channel.send('pong');
    }

    if(command === "music"){
        
        if(args[0] === "play") {
            play(message, args[1], serverQueue);
            return;
        } else if (args[0] === "skip") {
            skip(message, serverQueue);
            return;
        } else if (args[0] === "stop") {
            stop(message, serverQueue);
            return;
        } else {
            message.channel
                .send(`I can't recognize the command {args[0]} :(`);
        }
    }
    

});

//#region Functions

async function play(message, music, serverQueue) {
    

    const voiceChannel = message.member.voice.channel;

    if (!voiceChannel)
        return message.channel.send("You need to join a voice channel first!");
        
    const permissions = voiceChannel.permissionsFor(message.client.user);

    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send("I need the permissions to join and speak in your voice channel!");
    }

    const songInfo = await ytdl.getInfo(music);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url,
    };

    if (!serverQueue) {

        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 1,
            playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            playSong(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }

    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }
}

function playSong(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            playSong(guild, serverQueue.songs[0]);
        })
        .on("error", error => {
            console.error(error)
        });
                        
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 1);
    serverQueue.textChannel.send(`Now you will listen ** ${song.title} **`);
}

function skip(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to skip the music!");
        
    if (!serverQueue)
        return message.channel.send("There is no song in the queue!");

    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
    if (!message.member.voice.channel)
        return message.channel.send("You have to be in a voice channel to stop the music!");

    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

//#endregion


client.on('guildMemberAdd', member => {
    
    const channel = member.guild.channels.cache.find(ch => ch.name === 'welcome');

    if (!channel) 
        return;

    channel.send('Welcome to the server, ${member}!');
});

client.login(config.token);

function urlify(text) {
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    text.match(/ain/g);
    return urlRegex.test(text);
}