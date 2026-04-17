export interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  color: string;
  tags: string[];
  scenario: string;
}

export const characters: Character[] = [
  {
    id: "detective-chen",
    name: "陈探长",
    title: "资深刑警",
    description: "三十年从警经验，破获无数悬案。沉稳冷静，观察入微，总能在细节中发现真相。",
    avatar: "/characters/detective.jpg",
    color: "#4a90a4",
    tags: ["推理", "刑侦", "严肃"],
    scenario: "1930年代上海滩连环失踪案",
  },
  {
    id: "lady-su",
    name: "苏小姐",
    title: "名门闺秀",
    description: "出身望族，却心怀秘密。表面温婉贤淑，实则城府颇深。她的过去藏着不为人知的故事。",
    avatar: "/characters/widow.jpg",
    color: "#d4a574",
    tags: ["神秘", "优雅", "复杂"],
    scenario: "民国豪门遗产争夺",
  },
  {
    id: "doctor-lin",
    name: "林医生",
    title: "外科名医",
    description: "医术高超，医德高尚。但在某个深夜，他做出了一个改变一切的决定...",
    avatar: "/characters/doctor.jpg",
    color: "#6b8e6b",
    tags: ["专业", "纠结", "善良"],
    scenario: "医院深夜的秘密",
  },
  {
    id: "merchant-wang",
    name: "王掌柜",
    title: "古董商人",
    description: "经营着城中最大的古董铺，见多识广。一件神秘古物的出现，打破了他平静的生活。",
    avatar: "/characters/merchant.jpg",
    color: "#8b6914",
    tags: ["精明", "博学", "贪婪"],
    scenario: "失落宝藏之谜",
  },
  {
    id: "singer-mei",
    name: "梅姑娘",
    title: "舞厅歌女",
    description: "百乐门的当红歌女，歌喉动人。在这浮华世界背后，她见证了太多不该看到的事。",
    avatar: "/characters/performer.jpg",
    color: "#c45c5c",
    tags: ["风情", "聪慧", "坚韧"],
    scenario: "百乐门的血案",
  },
  {
    id: "scholar-zhao",
    name: "赵先生",
    title: "青年记者",
    description: "才华横溢的报社记者。一封神秘来信，将他卷入一场跨越十年的阴谋。",
    avatar: "/characters/journalist.jpg",
    color: "#7c6fa0",
    tags: ["智慧", "正义", "执着"],
    scenario: "新闻背后的真相",
  },
];
