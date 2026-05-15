export interface TeamMember {
  name: string;
  role: string;
  image: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { name: "Игорь Т.", role: "Основатель", image: "/landing/team/igor-t.png" },
  { name: "Давид З.", role: "Обжарщик", image: "/landing/team/david-z.png" },
  { name: "Дмитрий Д.", role: "Инженер/водитель", image: "/landing/team/dmitry-d.png" },
  { name: "Самал А.", role: "Специалист по развитию", image: "/landing/team/samal-a.png" },
];
