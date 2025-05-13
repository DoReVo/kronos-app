import kyFactory from "ky";

export function createKy() {
  return kyFactory.create({
    prefixUrl: import.meta.env.PUBLIC_API_URL,
  });
}
