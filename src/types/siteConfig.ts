import type {
	DARK_MODE,
	LIGHT_MODE,
	SYSTEM_MODE,
	WALLPAPER_BANNER,
	WALLPAPER_FULLSCREEN,
	WALLPAPER_NONE,
	WALLPAPER_OVERLAY,
} from "../constants/constants";

export type LIGHT_DARK_MODE =
	| typeof LIGHT_MODE
	| typeof DARK_MODE
	| typeof SYSTEM_MODE;

export type WALLPAPER_MODE =
	| typeof WALLPAPER_BANNER
	| typeof WALLPAPER_FULLSCREEN
	| typeof WALLPAPER_OVERLAY
	| typeof WALLPAPER_NONE;

export type Favicon = {
	src: string;
	theme?: "light" | "dark";
	sizes?: string;
};

export type SiteConfig = {
	title: string;
	subtitle: string;
	site_url: string;
	description?: string; // 网站描述，用于生成 <meta name="description">
	keywords?: string[]; // 站点关键词，用于生成 <meta name="keywords">

	lang: "en" | "zh_CN" | "zh_TW" | "ja" | "ru";

	themeColor: {
		hue: number;
		fixed: boolean;
		defaultMode?: LIGHT_DARK_MODE; // 默认模式：浅色、深色或跟随系统
	};

	pageWidth?: number;

	card: {
		border: boolean;
		followTheme?: boolean;
	};

	siteStartDate?: string; // 格式: "YYYY-MM-DD"
	deployPlatform?: string;
	timezone?: string;

	favicon: Array<{
		src: string;
		theme?: "light" | "dark";
		sizes?: string;
	}>;

	navbar: {
		logo?: {
			type: "icon" | "image" | "url";
			value: string;
			alt?: string;
		};
		title?: string;
		widthFull?: boolean;
		menuAlign?: "left" | "center";
		followTheme?: boolean;
		stickyNavbar?: boolean;
	};

	pages: {
		friends: boolean;
		sponsor: boolean;
		guestbook: boolean;
		moments: boolean;
		bangumi: boolean;
		gallery: boolean;
		anime: boolean;
		play: boolean;
		type: boolean;
	};

	categoryBar?: boolean;
	foldArticle?: boolean;

	postListLayout: {
		defaultMode: "list" | "grid";
		mobileDefaultMode?: "list" | "grid";
		showTags: boolean;
		descriptionLines?: number;
		allowSwitch: boolean;
		grid: {
			masonry: boolean;
			columnWidth?: number;
		};
	};

	post: {
		rehypeCallouts: {
			theme: "github" | "obsidian" | "vitepress" | "docusaurus";
			enablePythonMarkdownAdmonitions?: boolean;
		};
		showLastModified: boolean;
		outdatedThreshold?: number;
		sharePoster?: boolean;
		generateOgImages: boolean;
	};

	bangumi?: {
		userId?: string;
		mode?: "static" | "dynamic";
		apiUrl?: string;
		subjectBaseUrl?: string;
		categoryOrder?: ("anime" | "game" | "book" | "music" | "real")[];
	};

	anime?: {
		bilibili?: {
			uid: string;
		};
		tmdb?: {
			apiKey: string;
			listId: string;
		};
	};

	pagination: {
		postsPerPage: number;
	};

	imageOptimization?: {
		formats?: "avif" | "webp" | "both";
		quality?: number;
		noReferrerDomains?: string[];
	};
};