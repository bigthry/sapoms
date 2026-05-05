export interface AgreementRecord {
  userId: string;
  userName: string;
  email: string;
  acceptedAt: string; // ISO string
  status: "agreed";
}