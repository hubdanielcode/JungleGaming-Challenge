export interface UserFixture {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  avatar: string | null;
}

export interface CouponFixture {
  code: string;
  status: "active" | "expired";
  kind: "percent" | "fixed";
  value: string;
}

const createFakePasswordHash = (password: string) => {
  return `sim_${btoa(password).split("").reverse().join("")}`;
};

const userFixtures: UserFixture[] = [
  {
    id: "user-andreza",
    email: "andreza.colecionadora@kurio.test",
    username: "andreza.colecionadora",
    passwordHash: createFakePasswordHash("kurio123"),
    avatar: null,
  },
  {
    id: "user-daniel",
    email: "daniel.dev@kurio.test",
    username: "daniel.dev",
    passwordHash: createFakePasswordHash("kurio123"),
    avatar: null,
  },
];

const couponFixtures: CouponFixture[] = [
  { code: "KURIO10", status: "active", kind: "percent", value: "10" },
  { code: "BEMVINDO", status: "active", kind: "fixed", value: "0.05" },
  { code: "EXPIROU5", status: "expired", kind: "percent", value: "5" },
];

export { userFixtures, couponFixtures };
