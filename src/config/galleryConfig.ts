import type { GalleryConfig } from "@/types/galleryConfig";

// 相册配置
export const galleryConfig: GalleryConfig = {
	albums: [
		{
			id: "luoke",
			name: "洛克王国日常",
			description: "洛克王国的日常游戏截图记录。",
			location: "洛克王国",
			date: "2026-06-01",
			cover: "/gallery/luoke/微信图片_20260624193819_20_2.png",
		},
		{
			id: "gugugaga",
			name: "咕咕嘎嘎真可爱",
			description: "咕咕嘎嘎相关图片收集。",
			location: "收集",
			date: "2026-06-01",
			tags: ["咕咕嘎嘎"],
		},
	],

	columnWidth: 240,
};
