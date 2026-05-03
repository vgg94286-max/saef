
export type UserRole = "admin" | "staff" | "club" | "requester"

export type BaseJWTPayload = {
  user_id: string
  role: UserRole
}

export type ClubJWTPayload = BaseJWTPayload & {
  role: "club"
  club_id: string
  club_name: string
  email: string
}

export type StaffJWTPayload = BaseJWTPayload & {
  role: "staff"
  staff_id: string
  staff_name: string
  committee: string
  
}


export type AdminJWTPayload = BaseJWTPayload & {
  role: "admin"
}

export type RequesterJWTPayload = BaseJWTPayload & {
  role: "requester"
  name: string
  email: string
  national_id: string
}
export type NoObjectionJWTPayload = BaseJWTPayload & {
  role: "requester"
  name: string
  email: string
  
}

export type AppJWTPayload =
  | ClubJWTPayload
  | StaffJWTPayload
  | AdminJWTPayload
  | RequesterJWTPayload
  | NoObjectionJWTPayload