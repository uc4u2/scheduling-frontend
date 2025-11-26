import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import TwitterIcon from "@mui/icons-material/Twitter";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import PinterestIcon from "@mui/icons-material/Pinterest";
import LinkIcon from "@mui/icons-material/Link";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import TelegramIcon from "@mui/icons-material/Telegram";
import DiscordIcon from "@mui/icons-material/Discord";
import ForumIcon from "@mui/icons-material/Forum"; // Messenger/Line/Slack fallback
import RedditIcon from "@mui/icons-material/Reddit";
import RssFeedIcon from "@mui/icons-material/RssFeed";
import VideocamIcon from "@mui/icons-material/Videocam"; // Vimeo

export const SOCIAL_ICON_MAP = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
  twitter: TwitterIcon,
  x: TwitterIcon,
  tiktok: MusicNoteIcon,
  threads: AllInclusiveIcon,
  pinterest: PinterestIcon,
  whatsapp: WhatsAppIcon,
  snapchat: CameraAltIcon,
  telegram: TelegramIcon,
  discord: DiscordIcon,
  slack: ForumIcon,
  messenger: ForumIcon,
  line: ForumIcon,
  reddit: RedditIcon,
  rss: RssFeedIcon,
  vimeo: VideocamIcon,
};

export const DEFAULT_SOCIAL_ICON = LinkIcon;

export default SOCIAL_ICON_MAP;
