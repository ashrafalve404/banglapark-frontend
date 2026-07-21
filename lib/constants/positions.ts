export interface PositionDef {
    rank: number;
    name: string;
    requiredMembers: number;
    monthlySalary: number;
}

export const POSITIONS: PositionDef[] = [
    { rank: 1, name: "Executive Officer", requiredMembers: 5_000, monthlySalary: 25_000 },
    { rank: 2, name: "Executive Manager", requiredMembers: 25_000, monthlySalary: 75_000 },
    { rank: 3, name: "Marketing Manager", requiredMembers: 75_000, monthlySalary: 150_000 },
    { rank: 4, name: "District Manager", requiredMembers: 200_000, monthlySalary: 300_000 },
    { rank: 5, name: "Regional Manager", requiredMembers: 500_000, monthlySalary: 500_000 },
    { rank: 6, name: "Executive Vice President", requiredMembers: 1_200_000, monthlySalary: 750_000 },
    { rank: 7, name: "Additional General Manager", requiredMembers: 2_500_000, monthlySalary: 1_200_000 },
    { rank: 8, name: "Divisional General Manager", requiredMembers: 5_000_000, monthlySalary: 2_500_000 },
    { rank: 9, name: "General Manager", requiredMembers: 5_000_000, monthlySalary: 7_500_000 },
    { rank: 10, name: "Executive Director", requiredMembers: 10_000_000, monthlySalary: 10_000_000 },
];
