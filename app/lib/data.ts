// Mock data for Connekt platform

export interface Project {
    id: string;
    title: string;
    description: string;
    budget: string;
    budgetType: "fixed" | "hourly";
    category: string;
    tags: string[];
    postedBy: string;
    postedByAvatar: string;
    postedAt: string;
    duration: string;
    location: string;
    applicants: number;
    status: "open" | "in-progress" | "closed";
}

export interface Category {
    id: string;
    name: string;
    iconName: string;
    count: number;
}

export const categories: Category[] = [
    { id: "1", name: "Admin Support", iconName: "ClipboardList", count: 234 },
    { id: "2", name: "Customer Service", iconName: "MessageCircle", count: 189 },
    { id: "3", name: "Data Entry", iconName: "BarChart3", count: 156 },
    { id: "4", name: "Social Media", iconName: "Smartphone", count: 312 },
    { id: "5", name: "Email Management", iconName: "Mail", count: 98 },
    { id: "6", name: "Bookkeeping", iconName: "DollarSign", count: 145 },
    { id: "7", name: "Content Writing", iconName: "PenTool", count: 267 },
    { id: "8", name: "Research", iconName: "Search", count: 178 },
    { id: "9", name: "Project Management", iconName: "FolderKanban", count: 123 },
    { id: "10", name: "Web Development", iconName: "Globe", count: 201 },
    { id: "11", name: "Graphic Design", iconName: "Palette", count: 176 },
    { id: "12", name: "Video Editing", iconName: "Film", count: 89 },
];

export const projects: Project[] = [
    {
        id: "1",
        title: "Virtual Assistant for E-commerce Store Management",
        description:
            "Looking for an experienced virtual assistant to manage our Shopify store. Responsibilities include processing orders, managing inventory, responding to customer inquiries, and updating product listings. Must be detail-oriented and familiar with e-commerce platforms.",
        budget: "$15-25/hr",
        budgetType: "hourly",
        category: "Admin Support",
        tags: ["Shopify", "E-commerce", "Customer Service", "Inventory"],
        postedBy: "Sarah Mitchell",
        postedByAvatar: "SM",
        postedAt: "2 hours ago",
        duration: "3+ months",
        location: "Remote",
        applicants: 12,
        status: "open",
    },
    {
        id: "2",
        title: "Social Media Manager for Growing Tech Startup",
        description:
            "We need a creative social media manager to handle our Instagram, Twitter/X, and LinkedIn accounts. You'll create content calendars, design posts, engage with our audience, and track analytics. Experience with Canva and scheduling tools is preferred.",
        budget: "$800-1,200",
        budgetType: "fixed",
        category: "Social Media",
        tags: ["Instagram", "LinkedIn", "Content Creation", "Analytics"],
        postedBy: "James Chen",
        postedByAvatar: "JC",
        postedAt: "5 hours ago",
        duration: "1-3 months",
        location: "Remote",
        applicants: 24,
        status: "open",
    },
    {
        id: "3",
        title: "Data Entry Specialist — CRM Migration",
        description:
            "We're migrating from Salesforce to HubSpot and need someone to clean, organize, and transfer 10,000+ records. Must be meticulous, fast, and experienced with both CRM platforms. This is a one-time project with a tight deadline.",
        budget: "$500-750",
        budgetType: "fixed",
        category: "Data Entry",
        tags: ["Salesforce", "HubSpot", "CRM", "Data Migration"],
        postedBy: "Olivia Grant",
        postedByAvatar: "OG",
        postedAt: "1 day ago",
        duration: "Less than 1 month",
        location: "Remote",
        applicants: 8,
        status: "open",
    },
    {
        id: "4",
        title: "Executive Assistant for CEO — Calendar & Email Management",
        description:
            "Seeking a highly organized executive assistant to manage a busy CEO's calendar, coordinate meetings across time zones, handle email correspondence, and prepare briefing documents. Discretion and professionalism are paramount.",
        budget: "$20-35/hr",
        budgetType: "hourly",
        category: "Admin Support",
        tags: ["Calendar Management", "Email", "Executive Support", "Scheduling"],
        postedBy: "David Park",
        postedByAvatar: "DP",
        postedAt: "3 hours ago",
        duration: "6+ months",
        location: "Remote",
        applicants: 19,
        status: "open",
    },
    {
        id: "5",
        title: "Customer Support Agent for SaaS Product",
        description:
            "We need a customer support agent to handle inbound tickets via Zendesk, respond to live chats, and create help documentation. Our product is a project management tool, so familiarity with SaaS products is ideal. Training will be provided.",
        budget: "$12-18/hr",
        budgetType: "hourly",
        category: "Customer Service",
        tags: ["Zendesk", "Live Chat", "SaaS", "Help Documentation"],
        postedBy: "Rachel Torres",
        postedByAvatar: "RT",
        postedAt: "6 hours ago",
        duration: "3+ months",
        location: "Remote",
        applicants: 31,
        status: "open",
    },
    {
        id: "6",
        title: "Bookkeeper for Small Business — QuickBooks Expert",
        description:
            "Looking for an experienced bookkeeper to manage accounts payable/receivable, reconcile bank statements, and prepare monthly financial reports using QuickBooks Online. Must be comfortable with invoicing and expense tracking.",
        budget: "$18-28/hr",
        budgetType: "hourly",
        category: "Bookkeeping",
        tags: ["QuickBooks", "Accounts Payable", "Reconciliation", "Financial Reports"],
        postedBy: "Michael Brown",
        postedByAvatar: "MB",
        postedAt: "12 hours ago",
        duration: "6+ months",
        location: "Remote",
        applicants: 7,
        status: "open",
    },
    {
        id: "7",
        title: "Blog Content Writer — Health & Wellness Niche",
        description:
            "We're looking for a talented writer to produce 8 blog posts per month (1,500-2,000 words each) on health, wellness, and nutrition topics. Must be able to do SEO research and follow brand voice guidelines. Samples required.",
        budget: "$2,000-3,000",
        budgetType: "fixed",
        category: "Content Writing",
        tags: ["Blog Writing", "SEO", "Health", "Wellness"],
        postedBy: "Emily Watson",
        postedByAvatar: "EW",
        postedAt: "1 day ago",
        duration: "3+ months",
        location: "Remote",
        applicants: 42,
        status: "open",
    },
    {
        id: "8",
        title: "Research Assistant — Market Analysis Reports",
        description:
            "Need a research assistant to compile market analysis reports for our consulting firm. Tasks include gathering data from public sources, creating spreadsheets, writing executive summaries, and preparing presentations. Strong analytical skills required.",
        budget: "$15-22/hr",
        budgetType: "hourly",
        category: "Research",
        tags: ["Market Research", "Data Analysis", "Presentations", "Reports"],
        postedBy: "Alex Rivera",
        postedByAvatar: "AR",
        postedAt: "8 hours ago",
        duration: "1-3 months",
        location: "Remote",
        applicants: 15,
        status: "open",
    },
    {
        id: "9",
        title: "Email Marketing Specialist — Mailchimp Campaigns",
        description:
            "Seeking an email marketing specialist to design, write, and manage our weekly newsletter and promotional campaigns using Mailchimp. Should understand segmentation, A/B testing, and analytics. Previous email marketing experience required.",
        budget: "$600-900",
        budgetType: "fixed",
        category: "Email Management",
        tags: ["Mailchimp", "Email Marketing", "Newsletters", "A/B Testing"],
        postedBy: "Nicole Foster",
        postedByAvatar: "NF",
        postedAt: "4 hours ago",
        duration: "3+ months",
        location: "Remote",
        applicants: 11,
        status: "open",
    },
    {
        id: "10",
        title: "WordPress Website Updates & Maintenance",
        description:
            "We need a web developer to maintain our WordPress website — update plugins, fix bugs, add new pages/features, and optimize performance. Ongoing role with approximately 10-15 hours per week. Must know PHP, CSS, and WordPress ecosystem.",
        budget: "$20-30/hr",
        budgetType: "hourly",
        category: "Web Development",
        tags: ["WordPress", "PHP", "CSS", "Maintenance"],
        postedBy: "Carlos Mendez",
        postedByAvatar: "CM",
        postedAt: "2 days ago",
        duration: "6+ months",
        location: "Remote",
        applicants: 28,
        status: "open",
    },
    {
        id: "11",
        title: "Graphic Designer for Brand Identity Package",
        description:
            "We're a new startup looking for a graphic designer to create our complete brand identity: logo, color palette, typography, business cards, letterhead, and social media templates. Must have a strong portfolio and excellent communication skills.",
        budget: "$1,500-2,500",
        budgetType: "fixed",
        category: "Graphic Design",
        tags: ["Logo Design", "Branding", "Adobe Suite", "Identity"],
        postedBy: "Priya Sharma",
        postedByAvatar: "PS",
        postedAt: "1 day ago",
        duration: "Less than 1 month",
        location: "Remote",
        applicants: 35,
        status: "open",
    },
    {
        id: "12",
        title: "Video Editor for YouTube Channel — Weekly Content",
        description:
            "Looking for a skilled video editor to edit 2-3 YouTube videos per week (10-15 min each). Tasks include cutting, color correction, adding graphics/text overlays, and syncing audio. Experience with Premiere Pro or DaVinci Resolve required.",
        budget: "$100-200/video",
        budgetType: "fixed",
        category: "Video Editing",
        tags: ["Premiere Pro", "YouTube", "Color Grading", "Motion Graphics"],
        postedBy: "Tyler Kim",
        postedByAvatar: "TK",
        postedAt: "3 hours ago",
        duration: "3+ months",
        location: "Remote",
        applicants: 16,
        status: "open",
    },
];
