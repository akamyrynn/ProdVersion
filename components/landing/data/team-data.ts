export interface TeamMember {
  name: string;
  role: string;
  image: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { name: "Алексей", role: "Основатель", image: "/landing/team/team-1.jpg" },
  { name: "Мария", role: "Менеджер", image: "/landing/team/team-2.jpg" },
  { name: "Дмитрий", role: "Инженер/водитель", image: "/landing/team/team-3.jpg" },
  { name: "Анна", role: "Бариста", image: "/landing/team/team-4.jpg" },
  { name: "Игорь", role: "Директор", image: "/landing/team/team-5.jpg" },
  { name: "Елена", role: "Обжарщик", image: "/landing/team/team-6.jpg" },
  { name: "Сергей", role: "Логист", image: "/landing/team/team-7.jpg" },
  { name: "Ольга", role: "Бухгалтер", image: "/landing/team/team-8.jpg" },
];
