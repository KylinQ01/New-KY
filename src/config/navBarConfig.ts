import {
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/navBarConfig";

const getDynamicNavBarConfig = (): NavBarConfig => {
	const links: NavBarLink[] = [LinkPresets.Home];

	links.push({
		name: "文章",
		url: "#",
		icon: "material-symbols:article",
		children: [LinkPresets.Archive, LinkPresets.Categories, LinkPresets.Tags],
	});

	links.push(LinkPresets.Moments);
	links.push(LinkPresets.Friends);
	links.push(LinkPresets.Guestbook);

	links.push({
		name: "我的",
		url: "#",
		icon: "material-symbols:person",
		children: [LinkPresets.Gallery, LinkPresets.Anime, LinkPresets.Play, LinkPresets.Type, LinkPresets.Bangumi],
	});

	links.push({
		name: "关于",
		url: "#",
		icon: "material-symbols:info",
		children: [LinkPresets.About],
	});

	links.push({
		name: "链接",
		url: "#",
		icon: "material-symbols:link",
		children: [
			{
				name: "GitHub",
				url: "https://github.com/KylinQ01",
				external: true,
				icon: "fa7-brands:github",
			},
		],
	});

	return { links } as NavBarConfig;
};

export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

export const LinkPresets: Record<string, NavBarLink> = {
	Home: { name: "主页", url: "/", icon: "material-symbols:home" },
	Archive: { name: "归档", url: "/archive/", icon: "material-symbols:archive" },
	Categories: { name: "分类", url: "/categories/", icon: "material-symbols:folder-open-rounded" },
	Tags: { name: "标签", url: "/tags/", icon: "material-symbols:tag-rounded" },
	Moments: { name: "动态", url: "/moments/", icon: "material-symbols:tips-and-updates", pageKey: "moments" },
	Friends: { name: "友链", url: "/friends/", icon: "material-symbols:group", pageKey: "friends" },
	Sponsor: { name: "打赏", url: "/sponsor/", icon: "material-symbols:favorite", pageKey: "sponsor" },
	Guestbook: { name: "留言", url: "/guestbook/", icon: "material-symbols:chat", pageKey: "guestbook" },
	About: { name: "关于我", url: "/about/", icon: "material-symbols:person" },
	Bangumi: { name: "番组计划", url: "/bangumi/", icon: "material-symbols:movie", pageKey: "bangumi" },
	Gallery: { name: "相册", url: "/gallery/", icon: "material-symbols:photo-library", pageKey: "gallery" },
	Anime: { name: "追番", url: "/anime/", icon: "material-symbols:live-tv", pageKey: "anime" },
	Play: { name: "小游戏", url: "/play/", icon: "material-symbols:sports-esports", pageKey: "play" },
	Type: { name: "打字测试", url: "/type/", icon: "material-symbols:keyboard", pageKey: "type" },
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();