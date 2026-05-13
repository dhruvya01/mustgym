import React, { useState } from 'react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO';
import { cn } from '../lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { toast } from 'sonner';
import { 
  User as UserIcon, 
  Loader2,
  Camera, 
  Check, 
  Save, 
  Dumbbell, 
  Zap, 
  Trophy, 
  Flame, 
  Star, 
  Heart, 
  Target, 
  Crown,
  Shield,
  Rocket,
  Ghost,
  Smile,
  Gamepad2,
  Music,
  Coffee,
  Moon,
  Sun,
  Cloud,
  Wind,
  Anchor,
  Compass,
  Map,
  Flag,
  Key,
  Lock,
  Eye,
  Bell,
  Search,
  Settings,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  GraduationCap,
  Book,
  Pen,
  Camera as CameraIcon,
  Image as ImageIcon,
  Video,
  Mic,
  Volume2,
  Wifi,
  Bluetooth,
  Battery,
  HardDrive,
  Cpu,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Watch,
  Tv,
  Headphones,
  Speaker,
  Mouse,
  Keyboard,
  Printer,
  Server,
  Database,
  Cloud as CloudIcon,
  Globe,
  Link as LinkIcon,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Edit,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  MoreVertical,
  Grid,
  List,
  Layout,
  Maximize2,
  Minimize2,
  Filter,
  SortAsc,
  SortDesc,
  Hash,
  AtSign,
  Percent,
  DollarSign,
  Euro,
  CreditCard,
  Wallet,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Gift,
  Award,
  Medal,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  TrendingDown,
  Zap as ZapIcon,
  Flame as FlameIcon,
  Dumbbell as DumbbellIcon,
  Trophy as TrophyIcon,
  Target as TargetIcon,
  Timer,
  History,
  ClipboardList,
  FileText,
  Folder,
  Archive,
  Inbox,
  Send,
  MessageSquare,
  MessageCircle,
  PhoneCall,
  Video as VideoIcon,
  UserPlus,
  UserMinus,
  Users,
  UserCheck,
  UserX,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  Palette,
  Brush,
  Eraser,
  Scissors,
  Layers,
  Component,
  Box,
  Package,
  Truck,
  Plane,
  Train,
  Car,
  Bike,
  Footprints,
  Navigation,
  LifeBuoy,
  Umbrella,
  Thermometer,
  Droplets,
  Sprout,
  Leaf,
  Flower2,
  TreeDeciduous,
  Mountain,
  Waves,
  Sunrise,
  Sunset,
  Lightbulb,
  Flashlight,
  Power,
  Settings2,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Radio,
  CheckSquare,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Diamond,
  Pentagon,
  Star as StarIcon,
  Heart as HeartIcon,
  Bookmark,
  StickyNote,
  Pin,
  Paperclip,
  Link2,
  Quote,
  Languages,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Terminal,
  Bug,
  Construction,
  Wrench,
  Hammer,
  Pencil,
  Highlighter,
  Sticker,
  Puzzle,
  Dice5,
  Club,
  Spade,
  Heart as HeartSuit,
  Diamond as DiamondSuit,
  Skull,
  Sword,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
  Zap as PowerZap,
  Flame as HotFlame,
  Dumbbell as GymDumbbell,
  Trophy as WinnerTrophy,
  Target as AimTarget,
  Crown as KingCrown,
  Star as GoldStar,
  Heart as LoveHeart,
  Zap as EnergyZap,
  Flame as FireFlame,
  Dumbbell as WorkoutDumbbell,
  Trophy as AchievementTrophy,
  Target as GoalTarget,
  Crown as LeaderCrown,
  Star as RatingStar,
  Heart as FavoriteHeart,
  Zap as ElectricZap,
  Flame as IntenseFlame,
  Dumbbell as HeavyDumbbell,
  Trophy as VictoryTrophy,
  Target as FocusTarget,
  Crown as MasterCrown,
  Star as PremiumStar,
  Heart as HealthHeart,
  Zap as FastZap,
  Flame as BurnFlame,
  Dumbbell as FitnessDumbbell,
  Trophy as SuccessTrophy,
  Target as PrecisionTarget,
  Crown as EliteCrown,
  Star as SpecialStar,
  Heart as PassionHeart,
  Zap as QuickZap,
  Flame as HeatFlame,
  Dumbbell as StrongDumbbell,
  Trophy as GloryTrophy,
  Target as AccuracyTarget,
  Crown as RoyalCrown,
  Star as SuperStar,
  Heart as CareHeart,
  Zap as SparkZap,
  Flame as GlowFlame,
  Dumbbell as PowerDumbbell,
  Trophy as HonorTrophy,
  Target as VisionTarget,
  Crown as GrandCrown,
  Star as MegaStar,
  Heart as KindHeart,
  Zap as BoltZap,
  Flame as BlazeFlame,
  Dumbbell as MuscleDumbbell,
  Trophy as PrizeTrophy,
  Target as MarkTarget,
  Crown as TopCrown,
  Star as UltraStar,
  Heart as PureHeart,
  Zap as FlashZap,
  Flame as FlareFlame,
  Dumbbell as IronDumbbell,
  Trophy as CupTrophy,
  Target as BullseyeTarget,
  Crown as PeakCrown,
  Star as PrimeStar,
  Heart as DeepHeart,
  Zap as SurgeZap,
  Flame as SparkFlame,
  Dumbbell as LiftDumbbell,
  Trophy as MedalTrophy,
  Target as HitTarget,
  Crown as HighCrown,
  Star as BrightStar,
  Heart as WarmHeart,
  Zap as ShockZap,
  Flame as LightFlame,
  Dumbbell as TrainingDumbbell,
  Trophy as RewardTrophy,
  Target as SpotTarget,
  Crown as MainCrown,
  Star as ShineStar,
  Heart as SoftHeart,
  Zap as PulseZap,
  Flame as WarmFlame,
  Dumbbell as DailyDumbbell,
  Trophy as BonusTrophy,
  Target as PointTarget,
  Crown as FirstCrown,
  Star as NewStar,
  Heart as SmallHeart,
  Zap as TinyZap,
  Flame as TinyFlame,
  Dumbbell as TinyDumbbell,
  Trophy as TinyTrophy,
  Target as TinyTarget,
  Crown as TinyCrown,
  Star as TinyStar,
  Heart as TinyHeart
} from 'lucide-react';

const AVATAR_STYLES = [
  { id: 'avataaars', label: 'Human' },
  { id: 'bottts', label: 'Robot' },
  { id: 'pixel-art', label: 'Pixel' },
  { id: 'identicon', label: 'Abstract' },
  { id: 'initials', label: 'Initials' },
  { id: 'lorelei', label: 'Anime' },
  { id: 'micah', label: 'Sketch' },
  { id: 'open-peeps', label: 'Peeps' },
];

const AVATAR_SEEDS = [
  'Champion', 'Elite', 'Warrior', 'Legend', 'Titan', 'Phoenix', 'Dragon', 'Wolf',
  'Bear', 'Tiger', 'Lion', 'Eagle', 'Hawk', 'Shark', 'Rhino', 'Bull',
  'Ares', 'Athena', 'Zeus', 'Hera', 'Apollo', 'Artemis', 'Hades', 'Poseidon',
  'Iron', 'Steel', 'Gold', 'Silver', 'Bronze', 'Diamond', 'Ruby', 'Sapphire'
];

const SYMBOLS = [
  { id: 'Dumbbell', icon: Dumbbell },
  { id: 'Zap', icon: Zap },
  { id: 'Trophy', icon: Trophy },
  { id: 'Flame', icon: Flame },
  { id: 'Star', icon: Star },
  { id: 'Heart', icon: Heart },
  { id: 'Target', icon: Target },
  { id: 'Crown', icon: Crown },
  { id: 'Shield', icon: Shield },
  { id: 'Rocket', icon: Rocket },
  { id: 'Ghost', icon: Ghost },
  { id: 'Smile', icon: Smile },
  { id: 'Gamepad2', icon: Gamepad2 },
  { id: 'Music', icon: Music },
  { id: 'Coffee', icon: Coffee },
  { id: 'Moon', icon: Moon },
  { id: 'Sun', icon: Sun },
  { id: 'Cloud', icon: Cloud },
  { id: 'Wind', icon: Wind },
  { id: 'Anchor', icon: Anchor },
  { id: 'Compass', icon: Compass },
  { id: 'Map', icon: Map },
  { id: 'Flag', icon: Flag },
  { id: 'Key', icon: Key },
  { id: 'Lock', icon: Lock },
  { id: 'Eye', icon: Eye },
  { id: 'Bell', icon: Bell },
  { id: 'Search', icon: Search },
  { id: 'Settings', icon: Settings },
  { id: 'Mail', icon: Mail },
  { id: 'Phone', icon: Phone },
  { id: 'MapPin', icon: MapPin },
  { id: 'Calendar', icon: Calendar },
  { id: 'Clock', icon: Clock },
  { id: 'Briefcase', icon: Briefcase },
  { id: 'GraduationCap', icon: GraduationCap },
  { id: 'Book', icon: Book },
  { id: 'Pen', icon: Pen },
  { id: 'Camera', icon: CameraIcon },
  { id: 'Image', icon: ImageIcon },
  { id: 'Video', icon: Video },
  { id: 'Mic', icon: Mic },
  { id: 'Volume2', icon: Volume2 },
  { id: 'Wifi', icon: Wifi },
  { id: 'Bluetooth', icon: Bluetooth },
  { id: 'Battery', icon: Battery },
  { id: 'HardDrive', icon: HardDrive },
  { id: 'Cpu', icon: Cpu },
  { id: 'Monitor', icon: Monitor },
  { id: 'Smartphone', icon: Smartphone },
  { id: 'Tablet', icon: Tablet },
  { id: 'Laptop', icon: Laptop },
  { id: 'Watch', icon: Watch },
  { id: 'Tv', icon: Tv },
  { id: 'Headphones', icon: Headphones },
  { id: 'Speaker', icon: Speaker },
  { id: 'Mouse', icon: Mouse },
  { id: 'Keyboard', icon: Keyboard },
  { id: 'Printer', icon: Printer },
  { id: 'Server', icon: Server },
  { id: 'Database', icon: Database },
  { id: 'CloudIcon', icon: CloudIcon },
  { id: 'Globe', icon: Globe },
  { id: 'LinkIcon', icon: LinkIcon },
  { id: 'Share2', icon: Share2 },
  { id: 'Download', icon: Download },
  { id: 'Upload', icon: Upload },
  { id: 'RefreshCw', icon: RefreshCw },
  { id: 'Trash2', icon: Trash2 },
  { id: 'Edit', icon: Edit },
  { id: 'Plus', icon: Plus },
  { id: 'Minus', icon: Minus },
  { id: 'CheckCircle2', icon: CheckCircle2 },
  { id: 'AlertCircle', icon: AlertCircle },
  { id: 'HelpCircle', icon: HelpCircle },
  { id: 'Info', icon: Info },
  { id: 'ExternalLink', icon: ExternalLink },
  { id: 'ChevronRight', icon: ChevronRight },
  { id: 'ChevronLeft', icon: ChevronLeft },
  { id: 'ChevronUp', icon: ChevronUp },
  { id: 'ChevronDown', icon: ChevronDown },
  { id: 'ArrowRight', icon: ArrowRight },
  { id: 'ArrowLeft', icon: ArrowLeft },
  { id: 'ArrowUp', icon: ArrowUp },
  { id: 'ArrowDown', icon: ArrowDown },
  { id: 'MoreHorizontal', icon: MoreHorizontal },
  { id: 'MoreVertical', icon: MoreVertical },
  { id: 'Grid', icon: Grid },
  { id: 'List', icon: List },
  { id: 'Layout', icon: Layout },
  { id: 'Maximize2', icon: Maximize2 },
  { id: 'Minimize2', icon: Minimize2 },
  { id: 'Filter', icon: Filter },
  { id: 'SortAsc', icon: SortAsc },
  { id: 'SortDesc', icon: SortDesc },
  { id: 'Hash', icon: Hash },
  { id: 'AtSign', icon: AtSign },
  { id: 'Percent', icon: Percent },
  { id: 'DollarSign', icon: DollarSign },
  { id: 'Euro', icon: Euro },
  { id: 'CreditCard', icon: CreditCard },
  { id: 'Wallet', icon: Wallet },
  { id: 'ShoppingBag', icon: ShoppingBag },
  { id: 'ShoppingCart', icon: ShoppingCart },
  { id: 'Tag', icon: Tag },
  { id: 'Gift', icon: Gift },
  { id: 'Award', icon: Award },
  { id: 'Medal', icon: Medal },
  { id: 'Activity', icon: Activity },
  { id: 'BarChart3', icon: BarChart3 },
  { id: 'PieChart', icon: PieChart },
  { id: 'LineChart', icon: LineChart },
  { id: 'TrendingUp', icon: TrendingUp },
  { id: 'TrendingDown', icon: TrendingDown },
  { id: 'ZapIcon', icon: ZapIcon },
  { id: 'FlameIcon', icon: FlameIcon },
  { id: 'DumbbellIcon', icon: DumbbellIcon },
  { id: 'TrophyIcon', icon: TrophyIcon },
  { id: 'TargetIcon', icon: TargetIcon },
  { id: 'Timer', icon: Timer },
  { id: 'History', icon: History },
  { id: 'ClipboardList', icon: ClipboardList },
  { id: 'FileText', icon: FileText },
  { id: 'Folder', icon: Folder },
  { id: 'Archive', icon: Archive },
  { id: 'Inbox', icon: Inbox },
  { id: 'Send', icon: Send },
  { id: 'MessageSquare', icon: MessageSquare },
  { id: 'MessageCircle', icon: MessageCircle },
  { id: 'PhoneCall', icon: PhoneCall },
  { id: 'VideoIcon', icon: VideoIcon },
  { id: 'UserPlus', icon: UserPlus },
  { id: 'UserMinus', icon: UserMinus },
  { id: 'Users', icon: Users },
  { id: 'UserCheck', icon: UserCheck },
  { id: 'UserX', icon: UserX },
  { id: 'Fingerprint', icon: Fingerprint },
  { id: 'Scan', icon: Scan },
  { id: 'QrCode', icon: QrCode },
  { id: 'Barcode', icon: Barcode },
  { id: 'Palette', icon: Palette },
  { id: 'Brush', icon: Brush },
  { id: 'Eraser', icon: Eraser },
  { id: 'Scissors', icon: Scissors },
  { id: 'Layers', icon: Layers },
  { id: 'Component', icon: Component },
  { id: 'Box', icon: Box },
  { id: 'Package', icon: Package },
  { id: 'Truck', icon: Truck },
  { id: 'Plane', icon: Plane },
  { id: 'Train', icon: Train },
  { id: 'Car', icon: Car },
  { id: 'Bike', icon: Bike },
  { id: 'Footprints', icon: Footprints },
  { id: 'Navigation', icon: Navigation },
  { id: 'LifeBuoy', icon: LifeBuoy },
  { id: 'Umbrella', icon: Umbrella },
  { id: 'Thermometer', icon: Thermometer },
  { id: 'Droplets', icon: Droplets },
  { id: 'Sprout', icon: Sprout },
  { id: 'Leaf', icon: Leaf },
  { id: 'Flower2', icon: Flower2 },
  { id: 'TreeDeciduous', icon: TreeDeciduous },
  { id: 'Mountain', icon: Mountain },
  { id: 'Waves', icon: Waves },
  { id: 'Sunrise', icon: Sunrise },
  { id: 'Sunset', icon: Sunset },
  { id: 'Lightbulb', icon: Lightbulb },
  { id: 'Flashlight', icon: Flashlight },
  { id: 'Power', icon: Power },
  { id: 'Settings2', icon: Settings2 },
  { id: 'Sliders', icon: Sliders },
  { id: 'ToggleLeft', icon: ToggleLeft },
  { id: 'ToggleRight', icon: ToggleRight },
  { id: 'Radio', icon: Radio },
  { id: 'CheckSquare', icon: CheckSquare },
  { id: 'Square', icon: Square },
  { id: 'Circle', icon: Circle },
  { id: 'Triangle', icon: Triangle },
  { id: 'Hexagon', icon: Hexagon },
  { id: 'Diamond', icon: Diamond },
  { id: 'Pentagon', icon: Pentagon },
  { id: 'StarIcon', icon: StarIcon },
  { id: 'HeartIcon', icon: HeartIcon },
  { id: 'Bookmark', icon: Bookmark },
  { id: 'StickyNote', icon: StickyNote },
  { id: 'Pin', icon: Pin },
  { id: 'Paperclip', icon: Paperclip },
  { id: 'Link2', icon: Link2 },
  { id: 'Quote', icon: Quote },
  { id: 'Languages', icon: Languages },
  { id: 'Type', icon: Type },
  { id: 'Bold', icon: Bold },
  { id: 'Italic', icon: Italic },
  { id: 'Underline', icon: Underline },
  { id: 'Strikethrough', icon: Strikethrough },
  { id: 'Code', icon: Code },
  { id: 'Terminal', icon: Terminal },
  { id: 'Bug', icon: Bug },
  { id: 'Construction', icon: Construction },
  { id: 'Wrench', icon: Wrench },
  { id: 'Hammer', icon: Hammer },
  { id: 'Pencil', icon: Pencil },
  { id: 'Highlighter', icon: Highlighter },
  { id: 'Sticker', icon: Sticker },
  { id: 'Puzzle', icon: Puzzle },
  { id: 'Dice5', icon: Dice5 },
  { id: 'Club', icon: Club },
  { id: 'Spade', icon: Spade },
  { id: 'HeartSuit', icon: HeartSuit },
  { id: 'DiamondSuit', icon: DiamondSuit },
  { id: 'Skull', icon: Skull },
  { id: 'Sword', icon: Sword },
  { id: 'ShieldAlert', icon: ShieldAlert },
  { id: 'ShieldCheck', icon: ShieldCheck },
  { id: 'ShieldQuestion', icon: ShieldQuestion },
  { id: 'ShieldX', icon: ShieldX }
];

export default function ProfilePage({ profile }: { profile: UserProfile | null }) {
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [selectedStyle, setSelectedStyle] = useState('avataaars');
  const [selectedSeed, setSelectedSeed] = useState(profile?.uid || 'Champion');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentAvatarUrl = selectedSymbol 
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${selectedSymbol}&backgroundColor=ff8f6f&fontFamily=Arial&fontWeight=700`
    : `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${selectedSeed}`;

  const handleSave = async (url?: string) => {
    if (!profile?.uid) return;
    setSaving(true);
    const finalUrl = url || currentAvatarUrl;
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName: displayName.trim(),
        photoURL: finalUrl
      });
      toast.success('Identity updated!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
      toast.error('Failed to update identity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <SEO title="Member Identity" />
      
      <section className="text-center pt-8">
        <h2 className="font-headline font-black text-4xl sm:text-6xl uppercase italic tracking-tighter mb-4">
          CHOOSE YOUR <span className="text-primary">AVATAR.</span>
        </h2>
        <p className="text-on-surface-variant font-medium text-sm max-w-lg mx-auto">
          Pick a style and seed to generate your unique Elite Identity. No uploads needed.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Customization */}
        <div className="space-y-6">
          {/* Display Name */}
          <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5">
            <h3 className="font-headline font-bold uppercase tracking-widest text-[10px] text-primary mb-4">Display Name</h3>
            <div className="relative">
              <input 
                type="text" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-surface-container-highest border-none text-on-surface py-4 px-5 rounded-2xl focus:ring-2 focus:ring-primary/40 font-headline font-bold uppercase tracking-widest text-sm"
              />
              <button 
                onClick={() => handleSave()}
                disabled={saving}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-on-primary-fixed p-2 rounded-xl shadow-lg disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              </button>
            </div>
          </div>

          {/* Style Selection */}
          <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5">
            <h3 className="font-headline font-bold uppercase tracking-widest text-[10px] text-primary mb-4">Visual Style</h3>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    setSelectedStyle(style.id);
                    setSelectedSymbol(null);
                  }}
                  className={cn(
                    "aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border",
                    selectedStyle === style.id && !selectedSymbol
                      ? "bg-primary border-primary text-on-primary-fixed shadow-lg shadow-primary/20" 
                      : "bg-surface-container-highest border-transparent text-on-surface-variant hover:border-white/10"
                  )}
                >
                  <img 
                    src={`https://api.dicebear.com/7.x/${style.id}/svg?seed=preview`} 
                    className="w-8 h-8 rounded-lg" 
                    alt="" 
                  />
                  <span className="text-[8px] font-black uppercase tracking-tighter">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Seed Selection */}
          <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5">
            <h3 className="font-headline font-bold uppercase tracking-widest text-[10px] text-primary mb-4">Identity Seed</h3>
            <div className="flex flex-wrap gap-2">
              {AVATAR_SEEDS.map((seed) => (
                <button
                  key={seed}
                  onClick={() => {
                    setSelectedSeed(seed);
                    setSelectedSymbol(null);
                  }}
                  className={cn(
                    "py-2 px-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all border",
                    selectedSeed === seed && !selectedSymbol
                      ? "bg-primary/20 border-primary text-primary" 
                      : "bg-surface-container-highest border-transparent text-on-surface-variant hover:border-white/10"
                  )}
                >
                  {seed}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Preview & Save */}
        <div className="space-y-6 md:sticky md:top-24">
          <div className="bg-surface-container-low p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="w-48 h-48 rounded-[2rem] overflow-hidden border-4 border-primary/20 bg-surface-container shadow-2xl">
                <img 
                  src={currentAvatarUrl} 
                  alt="Avatar Preview" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-4 -right-4 bg-primary text-on-primary-fixed p-4 rounded-2xl shadow-2xl"
              >
                <Zap size={24} />
              </motion.div>
            </div>

            <h4 className="font-headline font-black text-3xl uppercase italic mb-1">{displayName || 'CHAMPION'}</h4>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Elite Member Identity</p>
            
            <button 
              onClick={() => handleSave()}
              disabled={saving}
              className="kinetic-gradient w-full py-5 rounded-2xl font-headline font-bold uppercase tracking-widest text-on-primary-fixed flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
              Confirm Identity
            </button>
          </div>

          {/* Quick Symbols */}
          <div className="bg-surface-container-low p-6 rounded-3xl border border-white/5">
            <h3 className="font-headline font-bold uppercase tracking-widest text-[10px] text-primary mb-4">Quick Symbols</h3>
            <div className="grid grid-cols-6 gap-2">
              {SYMBOLS.slice(0, 18).map((sym) => {
                const Icon = sym.icon;
                return (
                  <button
                    key={sym.id}
                    onClick={() => setSelectedSymbol(sym.id)}
                    className={cn(
                      "aspect-square rounded-xl flex items-center justify-center transition-all border",
                      selectedSymbol === sym.id
                        ? "bg-primary border-primary text-on-primary-fixed shadow-lg shadow-primary/20" 
                        : "bg-surface-container-highest border-transparent text-on-surface-variant hover:border-white/10"
                    )}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
