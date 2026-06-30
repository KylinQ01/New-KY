import type { MusicPlayerConfig } from "../types/musicConfig";

export const musicPlayerConfig: MusicPlayerConfig = {
	showInNavbar: true,
	mode: "api",
	volume: 0.7,
	playMode: "list",
	showLyrics: true,

	api: {
		endpoint: "http://8.138.253.155:3000",
		quality: "high",
	},

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
				"