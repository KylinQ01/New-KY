// 音乐播放器配置
export type MusicPlayerConfig = {
	// 使用方式：'meting' | 'local' | 'api'
	mode?: "meting" | "local" | "api"; // "meting" 使用 Meting API，"local" 使用本地音乐列表，"api" 使用自建音乐 API（支持登录 VIP）

	// 默认音量 (0-1)
	volume?: number;

	// 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机播放
	playMode?: "list" | "one" | "random";

	// 是否显示歌词
	showLyrics?: boolean;

	// 是否在导航栏显示音乐播放器
	showInNavbar?: boolean;

	// Meting API 配置
	meting?: {
		// Meting API 地址
		api?: string;

		// 音乐平台：netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
		server?: "netease" | "tencent" | "kugou" | "xiami" | "baidu";

		// 类型：song=单曲, playlist=歌单, album=专辑, search=搜索, artist=艺术家
		type?: "song" | "playlist" | "album" | "search" | "artist";

		// 歌单/专辑/单曲 ID 或搜索关键词
		id?: string;

		// 认证 token（可选）
		auth?: string;

		// 备用 API 配置（当主 API 失败时使用）
		fallbackApis?: string[];
	};

	// 自建音乐 API 配置（用于登录网易云/QQ 账号获取 VIP 歌曲）
	api?: {
		// API 地址（部署 NeteaseCloudMusicApi 的服务器地址）
		endpoint?: string;

		// 默认音质：'standard'=标准, 'high'=高质量, 'lossless'=无损, 'hires'=Hi-Res
		quality?: "standard" | "high" | "lossless" | "hires";
	};

	// 本地音乐配置（当 mode 为 'local' 时使用）
	local?: {
		playlist?: Array<{
			// 歌曲名称
			name: string;
			// 艺术家
			artist: string;
			// 音乐文件路径（相对于 public 目录）
			url: string;
			// 封面图片路径（相对于 public 目录）
			cover?: string;
			// 歌词内容，支持 LRC 格式
			lrc?: string;
		}>;
	};
};
