import { getDateLikeString } from "./utils.js";


export async function loadCurrencies(seed, apiKey, currencies) {
  // this function load all of currencies of the api
  // I try to call this function just one time
  const endPoint = "currencies"
  let res = await fetch(`${seed}${endPoint}?apikey=${apiKey}`);
  let json = await res.json();
  for (const { code, name, symbol, decimal_digits } of Object.values(json.data)) {
    currencies.set(code, { code, name, symbol, decimal_digits });
  }
}




export async function loadExchanges(seed, apiKey, baseCurrency, latestExchange) {
  let endPoint = "latest"
  let res;
  try {
    res = await fetch(`${seed}${endPoint}?apikey=${apiKey}&base_currency=${baseCurrency}`);

  } catch (error) {
    console.log(`Hubo un error ${error}`)
    return;
  }
  let json = await res.json();
  let date = new Date()
  json.data["date"] = getDateLikeString(date)
  latestExchange.set(baseCurrency, json.data);
}