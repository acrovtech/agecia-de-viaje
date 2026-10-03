export const TEAM_UI_ALLOWED_ROLES = ['OWNER', 'ADMIN'] as const;

export type TeamUiAllowedRole = (typeof TEAM_UI_ALLOWED_ROLES)[number];

export function canAccessTeamUi(role: string): boolean {
  return (TEAM_UI_ALLOWED_ROLES as readonly string[]).includes(role);
}
