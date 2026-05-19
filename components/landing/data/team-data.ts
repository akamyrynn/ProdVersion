export interface TeamMember {
  name: string;
  role: string;
  image: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { name: "Игорь Т.", role: "Основатель", image: "/team/IMG_20260507_221614_883.png" },
  { name: "Давид З.", role: "Обжарщик", image: "/team/IMG_20260507_221552_895.png" },
  { name: "Дмитрий Д.", role: "Инженер/водитель", image: "/team/IMG_20260507_221622_514.png" },
  { name: "Самал А.", role: "Специалист по развитию", image: "/team/IMG_20260507_221626_182.png" },
];
