import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
} from '@discordjs/voice';
import play from 'play-dl';
import { EmbedBuilder } from 'discord.js';
import config from '../config.js';

export class MusicQueue {
  constructor(client, guildId) {
    this.client = client;
    this.guildId = guildId;
    this.songs = [];
    this.volume = 50;
    this.playing = false;
    this.paused = false;
    this.loop = false;
    this.connection = null;
    this.player = null;
    this.currentSong = null;
    this.textChannel = null;
  }

  async connect(voiceChannel) {
    this.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });

    this.connection.subscribe(this.player);

    // Handle connection state changes
    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        // Check if 24/7 mode is enabled
        const is247 = this.client.twentyFourSeven.get(this.guildId);
        if (is247?.enabled) {
          // Try to reconnect
          try {
            const guild = this.client.guilds.cache.get(this.guildId);
            const channel = guild?.channels.cache.get(is247.channelId);
            if (channel) {
              await this.connect(channel);
            }
          } catch (err) {
            console.error('Failed to reconnect for 24/7:', err);
            this.destroy();
          }
        } else {
          this.destroy();
        }
      }
    });

    // Handle player state changes
    this.player.on(AudioPlayerStatus.Idle, () => {
      this.handleSongEnd();
    });

    this.player.on('error', (error) => {
      console.error('Audio player error:', error);
      this.handleSongEnd();
    });

    return this.connection;
  }

  async addSong(songInfo, position = -1) {
    if (position >= 0 && position < this.songs.length) {
      this.songs.splice(position, 0, songInfo);
    } else {
      this.songs.push(songInfo);
    }
  }

  async play() {
    if (this.songs.length === 0) {
      const is247 = this.client.twentyFourSeven.get(this.guildId);
      if (!is247?.enabled) {
        this.destroy();
      }
      this.playing = false;
      this.currentSong = null;
      return;
    }

    this.currentSong = this.songs.shift();
    this.playing = true;
    this.paused = false;

    try {
      const stream = await play.stream(this.currentSong.url);
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
      });

      resource.volume?.setVolume(this.volume / 100);
      this.player.play(resource);

      // Send now playing message
      if (this.textChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🎵 Now Playing')
          .setDescription(`**[${this.currentSong.title}](${this.currentSong.url})**`)
          .addFields(
            { name: 'Duration', value: this.currentSong.duration || 'Unknown', inline: true },
            { name: 'Requested By', value: `${this.currentSong.requestedBy}`, inline: true },
          )
          .setThumbnail(this.currentSong.thumbnail || null)
          .setColor(config.embedColor)
          .setTimestamp();

        this.textChannel.send({ embeds: [embed] }).catch(console.error);
      }
    } catch (error) {
      console.error('Error playing song:', error);
      if (this.textChannel) {
        this.textChannel.send(`❌ Error playing: **${this.currentSong.title}**. Skipping...`).catch(console.error);
      }
      this.handleSongEnd();
    }
  }

  handleSongEnd() {
    if (this.loop && this.currentSong) {
      this.songs.unshift(this.currentSong);
    }
    this.play();
  }

  setVolume(vol) {
    this.volume = vol;
    if (this.player?.state?.resource?.volume) {
      this.player.state.resource.volume.setVolume(vol / 100);
    }
  }

  pause() {
    if (this.player && this.playing) {
      this.player.pause();
      this.paused = true;
      return true;
    }
    return false;
  }

  resume() {
    if (this.player && this.paused) {
      this.player.unpause();
      this.paused = false;
      return true;
    }
    return false;
  }

  skip() {
    if (this.player) {
      this.player.stop();
      return true;
    }
    return false;
  }

  stop() {
    this.songs = [];
    this.loop = false;
    if (this.player) {
      this.player.stop();
    }
  }

  destroy() {
    this.stop();
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
    this.client.musicQueues.delete(this.guildId);
  }
}

export async function searchSong(query) {
  try {
    // Check if it's a URL
    const urlValidation = play.yt_validate(query);

    if (urlValidation === 'video') {
      const info = await play.video_info(query);
      return [{
        title: info.video_details.title,
        url: info.video_details.url,
        duration: info.video_details.durationRaw,
        thumbnail: info.video_details.thumbnails?.[0]?.url,
      }];
    }

    if (urlValidation === 'playlist') {
      const playlist = await play.playlist_info(query, { incomplete: true });
      const videos = await playlist.all_videos();
      return videos.map(video => ({
        title: video.title,
        url: video.url,
        duration: video.durationRaw,
        thumbnail: video.thumbnails?.[0]?.url,
      }));
    }

    // Search
    const results = await play.search(query, { limit: 1 });
    if (results.length === 0) return null;

    return [{
      title: results[0].title,
      url: results[0].url,
      duration: results[0].durationRaw,
      thumbnail: results[0].thumbnails?.[0]?.url,
    }];
  } catch (error) {
    console.error('Search error:', error);
    return null;
  }
}