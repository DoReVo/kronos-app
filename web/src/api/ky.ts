import kyFactory from "ky";

export function createKy() {
  return kyFactory.create({
    prefix: import.meta.env.VITE_API_URL,
  });
}
