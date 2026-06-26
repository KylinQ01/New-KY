import type { BackgroundWallpaperConfig } from "@/types/backgroundWallpaper";

export const backgroundWallpaper: BackgroundWallpaperConfig = {
	mode: "banner",
	switchable: true,
	playerEnable: true,
	src: {
		desktop: [
			"assets/images/DesktopWallpaper/微信图片_20260624194440_107_2.jpg",
			"assets/images/DesktopWallpaper/微信图片_20260624194441_108_2.jpg",
			"assets/images/DesktopWallpaper/微信图片_20260624194442_109_2.jpg",
			"assets/images/DesktopWallpaper/微信图片_20260624194443_110_2.jpg",
		],
		mobile: [
			"assets/images/MobileWallpaper/微信图片_20260624194440_107_2.jpg",
			"assets/images/MobileWallpaper/微信图片_20260624194441_108_2.jpg",
			"assets/images/MobileWallpaper/微信图片_20260624194442_109_2.jpg",
			"assets/images/MobileWallpaper/微信图片_20260624194443_110_2.jpg",
		],
		playerUrl: [
			"https://www.image2url.com/r2/default/videos/1781765166391-f2ba6648-1597-40e0-9f0a-6768ae39e574.mp4",
		],
	},
	common: {
		dimOpacity: 0.2,
		playerMode: "random",
		homeText: {
			enable: true,
			switchable: true,
			title: "Kylin",
			titleSize: "3.8rem",
			subtitle: ["怀化佳木所失，峥嵘苍翠犹立"],
			subtitleSize: "1.5rem",
			typewriter: {
				enable: true,
				speed: 100,
				deleteSpeed: 50,
				pauseTime: 2000,
			},
		},
		navbar: {
			transparentMode: "semi",
			enableBlur: true,
			blur: 5,
		},
		waves: {
			enable: {
				desktop: true,
				mobile: true,
			},
			switchable: true,
		},
		gradient: {
			enable: {
				desktop: true,
				mobile: true,
			},
			height: "15vh",
			switchable: true,
		},
		carousel: {
			enable: false,
			interval: 5000,
			transitionEffect: "zoom",
			switchable: true,
		},
	},
	banner: {
		position: "0% 20%",
	},
	overlay: {
		switchable: {
			opacity: true,
			blur: true,
			cardOpacity: true,
		},
		zIndex: -1,
		opacity: 0.8,
		blur: 10,
		cardOpacity: 0.5,
	},
	fullscreen: {
		position: "center",
	},
};