import {
    ClipboardList,
    MessageCircle,
    BarChart3,
    Smartphone,
    Mail,
    DollarSign,
    PenTool,
    Search,
    FolderKanban,
    Globe,
    Palette,
    Film,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    ClipboardList,
    MessageCircle,
    BarChart3,
    Smartphone,
    Mail,
    DollarSign,
    PenTool,
    Search,
    FolderKanban,
    Globe,
    Palette,
    Film,
};

interface CategoryIconProps {
    name: string;
    size?: number;
    className?: string;
}

export default function CategoryIcon({ name, size = 20, className = "" }: CategoryIconProps) {
    const Icon = iconMap[name];
    if (!Icon) return null;
    return <Icon size={size} className={className} />;
}
