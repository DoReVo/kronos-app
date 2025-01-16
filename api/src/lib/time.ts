import ky, { HTTPError } from "ky";

const API_URL = " https://api.aladhan.com/v1";
export async function fetchTime(
  date: string,
  latitude: string,
  longitude: string,
) {
  const url = new URL(`${API_URL}/timings/${date}`);
  url.search = new URLSearchParams({
    latitude,
    longitude,
    method: "17",
    shafaq: "general",
    tune: "",
    school: "0",
    midnightMode: "0",
    timezonestring: "UTC+08",
    iso8601: "true",
  }).toString();

  console.log(url.search);

  try {
    const response = await ky.get(url).json();

    return response;
  } catch (error) {
    if (error instanceof HTTPError) {
      const errMsg = await error.response.json();
      throw new Error("HTTP Error");
    }
  }
}
