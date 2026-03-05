
export type UserRole = "admin" | "staff" | "club" | "leave_requester"

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
  
}


export type AdminJWTPayload = BaseJWTPayload & {
  role: "admin"
}

export type LeaveRequesterJWTPayload = BaseJWTPayload & {
  role: "leave_requester"
  name: string
  email: string
  national_id: string
}

export type AppJWTPayload =
  | ClubJWTPayload
  | StaffJWTPayload
  | AdminJWTPayload
  | LeaveRequesterJWTPayload