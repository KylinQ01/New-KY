import type { MusicPlayerConfig } from "../types/musicConfig";

export const musicPlayerConfig: MusicPlayerConfig = {
	showInNavbar: true,
	mode: "local",
	volume: 0.7,
	playMode: "list",
	showLyrics: true,

	meting: {
		api: "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
		server: "netease",
		type: "playlist",
		id: "10046455237",
		auth: "",
		fallbackApis: [
			"https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
			"https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
		],
	},

	local: {
		playlist: [
			{
				name: "玻璃",
				artist: "Gareth.T",
				url: "/assets/music/玻璃.mp3",
				cover: "/assets/music/cover/vinyl.svg",
				lrc: "/assets/music/lrc/玻璃.lrc",
			},
			{
				name: "颜色",
				artist: "Gareth.T",
				url: "/assets/music/颜色.mp3",
				cover: "/assets/music/cover/vinyl.svg",
				lrc: "/assets/music/lrc/颜色.lrc",
			},
			{
				name: "用背脊唱情歌",
				artist: "Gareth.T",
				url: "/assets/music/用背脊唱情歌.mp3",
				cover: "/assets/music/cover/vinyl.svg",
				lrc: "/assets/music/lrc/用背脊唱情歌.lrc",
			},
			{
				name: "遇上你之前的我",
				artist: "Gareth.T",
				url: "/assets/music/遇上你之前的我.mp3",
				cover: "/assets/music/cover/vinyl.svg",
				lrc: "/assets/music/lrc/遇上你之前的我.lrc",
			},
		],
	},
};